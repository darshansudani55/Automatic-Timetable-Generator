/**
 * Timetable Service — orchestrates scheduling and converts flat assignments → DB schema
 */
const GeneticAlgorithmScheduler = require('../algorithms/geneticAlgorithm');
const BacktrackingScheduler = require('../algorithms/backtracking');
const Class = require('../models/Class.model');
const Classroom = require('../models/Classroom.model');
const Lab = require('../models/Lab.model');
const { generateTimeSlots, WORKING_DAYS } = require('../config/constants');

const timeToMins = (t) => { if (!t) return 0; const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const minsToTime = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const calcDuration = (start, end) => timeToMins(end) - timeToMins(start);

/**
 * Redistribute: ensure max 1 lab per class per day.
 * Labs are spread evenly across the working week, each on a different day.
 * Theory sessions keep their GA-assigned days.
 */
const redistributeAssignments = (assignments, workingDays) => {
  // Group all assignments by classId
  const byClass = {};
  for (const a of assignments) {
    if (!byClass[a.classId]) byClass[a.classId] = [];
    byClass[a.classId].push(a);
  }

  const result = [];

  for (const [, sessions] of Object.entries(byClass)) {
    const labs   = sessions.filter(s => s.type === 'Lab');
    const theory = sessions.filter(s => s.type !== 'Lab');

    // Which days have theory sessions (prefer to attach lab to those days)
    const theoryDays = [...new Set(theory.map(t => t.day))];
    const otherDays  = workingDays.filter(d => !theoryDays.includes(d));
    // Priority list: days with theory first, then spare days
    const priorityDays = [...theoryDays, ...otherDays];

    // Assign each lab to a different day (one lab per day max)
    const usedLabDays = new Set();
    const redistributedLabs = labs.map((lab, idx) => {
      // Find next available day from priority list that doesn't already have a lab
      const targetDay =
        priorityDays.find(d => !usedLabDays.has(d)) ||
        workingDays[idx % workingDays.length];
      usedLabDays.add(targetDay);
      return { ...lab, day: targetDay };
    });

    result.push(...redistributedLabs, ...theory);
  }

  return result;
};

/**
 * Post-process compaction: re-pack each class's daily sessions into consecutive,
 * gap-free slots starting from workingHours.startTime.
 * Order within each day: Theory sessions first (60 min each), Lab last (90 min).
 * Break is auto-inserted at the configured time.
 */
const compactAssignments = (assignments, workingHours) => {
  const breakStart = timeToMins(workingHours.breakTime.start);
  const breakEnd   = timeToMins(workingHours.breakTime.end);
  const dayEnd     = timeToMins(workingHours.endTime);

  // Group by classId + day
  const groups = {};
  for (const a of assignments) {
    const k = `${a.classId}::${a.day}`;
    if (!groups[k]) groups[k] = [];
    groups[k].push(a);
  }

  const compacted = [];
  const dropped = [];

  for (const [, sessions] of Object.entries(groups)) {
    // Sort: Theory first, then Lab — so lab never stacks on top of another lab
    sessions.sort((a, b) => {
      if (a.type === 'Lab' && b.type !== 'Lab') return 1;
      if (b.type === 'Lab' && a.type !== 'Lab') return -1;
      return 0;
    });

    let cursor = timeToMins(workingHours.startTime);
    let breakInserted = false;

    // Distribute large unassigned pools of time to the morning to avoid >1hr free slots at the end
    const totalSessionMins = sessions.reduce((s, a) => s + (a.type === 'Lab' ? 90 : 60), 0);
    const dayCapacityMins = dayEnd - cursor - (breakEnd - breakStart); 
    let freeMins = dayCapacityMins - totalSessionMins;
    
    // If there is more than 60 minutes of free time, delay the start of the student's day by 60-min blocks!
    while (freeMins > 60 && cursor + 60 <= breakStart) {
      cursor += 60;
      freeMins -= 60;
    }

    for (const session of sessions) {
      const dur = session.type === 'Lab' ? 90 : 60;

      // If cursor reached break boundary, jump over break
      if (!breakInserted && cursor >= breakStart) {
        cursor = breakEnd;
        breakInserted = true;
      }

      // If this session would cross the break, insert break first
      if (!breakInserted && cursor + dur > breakStart) {
        cursor = breakEnd;
        breakInserted = true;
      }

      if (cursor + dur > dayEnd) {
        dropped.push(session);
        continue;
      }

      compacted.push({
        ...session,
        startTime: minsToTime(cursor),
        endTime:   minsToTime(cursor + dur),
      });

      cursor += dur;
    }
  }

  return { compacted, dropped };
};

/**
 * Convert flat assignment list → nested schedule array for DB storage
 */
const buildScheduleFromAssignments = (assignments, workingHours) => {
  const timeSlots = generateTimeSlots(
    workingHours.startTime, workingHours.endTime,
    workingHours.breakTime.start, workingHours.breakTime.end
  );
  const breakSlot = timeSlots.find((s) => s.isBreak);

  // Group assignments by classId → day
  const classMap = {};
  for (const a of assignments) {
    if (!classMap[a.classId]) classMap[a.classId] = {};
    if (!classMap[a.classId][a.day]) classMap[a.classId][a.day] = [];
    classMap[a.classId][a.day].push(a);
  }

  const schedule = [];
  for (const [classId, dayMap] of Object.entries(classMap)) {
    const dayWiseSchedule = [];

    for (const day of WORKING_DAYS) {
      const dayAssignments = dayMap[day] || [];
      const slots = [];

      for (const a of dayAssignments) {
        slots.push({
          slotNumber:  a.slotNumber || null,
          startTime:   a.startTime,
          endTime:     a.endTime,
          subject:     a.subjectId,
          faculty:     a.facultyId,
          classroom:   a.classroomId || null,
          lab:         a.labId       || null,
          labPart:     a.labPart     || null,
          sessionType: a.type === 'Lab' ? 'Lab' : 'Theory',
          isBreak:     false,
          duration:    calcDuration(a.startTime, a.endTime),
        });
      }

      // Insert break slot for days that have sessions
      if (breakSlot && dayAssignments.length > 0) {
        slots.push({
          slotNumber:  'BREAK',
          startTime:   breakSlot.startTime,
          endTime:     breakSlot.endTime,
          sessionType: 'Break',
          isBreak:     true,
          duration:    breakSlot.duration,
        });
      }

      // Sort slots chronologically
      slots.sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime));

      dayWiseSchedule.push({ day, slots });
    }

    schedule.push({ class: classId, dayWiseSchedule });
  }
  return schedule;
};

/**
 * Run scheduling for the given config
 */
const generateSchedule = async ({ classIds, workingHours, workingDays, constraints, algorithm = 'genetic' }, progressCallback) => {
  // Fetch fully populated classes
  const classes = await Class.find({ _id: { $in: classIds }, isActive: true })
    .populate('department')
    .populate({ path: 'subjects.subject' })
    .populate({ path: 'subjects.faculty' })
    .populate({ path: 'subjects.labFaculty' });

  if (!classes.length) throw new Error('No active classes found for selected IDs');

  const classrooms = await Classroom.find({ isActive: true });
  const labs       = await Lab.find({ isActive: true });

  const schedulerConfig = { classes, classrooms, labs, workingHours, workingDays, constraints };

  let result;
  if (algorithm === 'backtracking') {
    const scheduler = new BacktrackingScheduler(schedulerConfig);
    result = await scheduler.run(progressCallback);
  } else {
    const scheduler = new GeneticAlgorithmScheduler({ ...schedulerConfig, populationSize: 50, generations: 200 });
    result = await scheduler.run(progressCallback);
  }

  // Step 1 — Redistribute: max 1 lab per class per day, spread across week
  const redistributed = redistributeAssignments(result.assignments, workingDays || WORKING_DAYS);

  // Step 2 — Compact: re-assign consecutive time slots (theory first, then lab)
  const { compacted, dropped } = compactAssignments(redistributed, workingHours);

  const finalConflicts = [...(result.conflicts || [])];
  for (const d of dropped) {
    finalConflicts.push({
      conflictType: 'working_hours',
      severity: 'high',
      description: `Session ${d.subjectCode || ''} (${d.type}) for ${d.className} was dropped because it exceeds working hours on ${d.day}`,
      resolved: false
    });
  }

  const schedule = buildScheduleFromAssignments(compacted, workingHours);
  return { schedule, conflicts: finalConflicts, fitness: result.fitness || 0 };
};

module.exports = { generateSchedule, buildScheduleFromAssignments };
