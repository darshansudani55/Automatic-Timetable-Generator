/**
 * Timetable Service — orchestrates scheduling and converts flat assignments → DB schema
 */
const GeneticAlgorithmScheduler = require('../algorithms/geneticAlgorithm');
const BacktrackingScheduler = require('../algorithms/backtracking');
const Class = require('../models/Class.model');
const Classroom = require('../models/Classroom.model');
const Lab = require('../models/Lab.model');
const { generateTimeSlots, WORKING_DAYS } = require('../config/constants');

/**
 * Convert flat assignment list → nested schedule array for DB storage
 */
const buildScheduleFromAssignments = (assignments, workingHours) => {
  const timeSlots = generateTimeSlots(
    workingHours.startTime, workingHours.endTime,
    workingHours.breakTime.start, workingHours.breakTime.end
  );

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
    const days = WORKING_DAYS;

    for (const day of days) {
      const dayAssignments = dayMap[day] || [];
      const slots = [];

      // Add break slot
      const breakSlot = timeSlots.find((s) => s.isBreak);

      // Add all theory/lab slots
      for (const a of dayAssignments) {
        slots.push({
          slotNumber: a.slotNumber || null,
          startTime: a.startTime,
          endTime: a.endTime,
          subject: a.subjectId,
          faculty: a.facultyId,
          classroom: a.classroomId || null,
          lab: a.labId || null,
          labPart: a.labPart || null,
          sessionType: (a.type || a.sessionType) === 'Lab' ? 'Lab' : 'Theory',
          isBreak: false,
          duration: calcDuration(a.startTime, a.endTime),
        });
      }

      // Add break slot to each day
      if (breakSlot) {
        slots.push({
          slotNumber: 'BREAK',
          startTime: breakSlot.startTime,
          endTime: breakSlot.endTime,
          sessionType: 'Break',
          isBreak: true,
          duration: breakSlot.duration,
        });
      }

      // Sort slots by start time
      slots.sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime));

      dayWiseSchedule.push({ day, slots });
    }

    schedule.push({ class: classId, dayWiseSchedule });
  }
  return schedule;
};

const timeToMins = (t) => { if (!t) return 0; const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const calcDuration = (start, end) => timeToMins(end) - timeToMins(start);

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
  const labs = await Lab.find({ isActive: true });

  const schedulerConfig = { classes, classrooms, labs, workingHours, workingDays, constraints };

  let result;
  if (algorithm === 'backtracking') {
    const scheduler = new BacktrackingScheduler(schedulerConfig);
    result = await scheduler.run(progressCallback);
  } else {
    const scheduler = new GeneticAlgorithmScheduler({ ...schedulerConfig, populationSize: 50, generations: 200 });
    result = await scheduler.run(progressCallback);
  }

  const schedule = buildScheduleFromAssignments(result.assignments, workingHours);
  return { schedule, conflicts: result.conflicts || [], fitness: result.fitness || 0 };
};

module.exports = { generateSchedule, buildScheduleFromAssignments };
