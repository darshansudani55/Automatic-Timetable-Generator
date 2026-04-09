/**
 * Backtracking Scheduler
 * For small sets (≤ 5 classes), produces exact conflict-free timetables.
 */

const {
  isFacultyFree,
  isClassroomFree,
  isLabFree,
  isClassFree,
  isFacultyNotUnavailable,
  getFacultyScheduledHours,
  getFacultyScheduledHoursPerDay,
  getTheoryTimeSlots,
  getLabTimeSlots,
} = require('./constraintChecker');

const { WORKING_DAYS, generateTimeSlots } = require('../config/constants');

class BacktrackingScheduler {
  constructor(config) {
    this.classes = config.classes;
    this.classrooms = config.classrooms || [];
    this.labs = config.labs || [];
    this.workingDays = config.workingDays || WORKING_DAYS;
    this.workingHours = config.workingHours;
    this.constraints = config.constraints || { noFreeSlots: true, maxFacultyHoursPerDay: 6 };

    this.timeSlots = generateTimeSlots(
      this.workingHours.startTime,
      this.workingHours.endTime,
      this.workingHours.breakTime.start,
      this.workingHours.breakTime.end
    );

    this.theorySlots = getTheoryTimeSlots(this.timeSlots);
    this.labSlots = getLabTimeSlots(this.timeSlots);
    this.assignments = []; // flat list of all assigned sessions
  }

  /** Build the list of sessions that need to be scheduled */
  buildSessionList() {
    const sessions = [];
    for (const cls of this.classes) {
      for (const sa of cls.subjects) {
        const subject = sa.subject;
        const sessions_theory = subject.sessionsPerWeek?.theory || 0;
        const sessions_lab = subject.sessionsPerWeek?.lab || 0;

        for (let i = 0; i < sessions_theory; i++) {
          sessions.push({
            classId: cls._id.toString(),
            className: cls.className,
            subjectId: subject._id.toString(),
            subjectName: subject.subjectName,
            subjectCode: subject.subjectCode,
            facultyId: sa.faculty ? sa.faculty._id.toString() : null,
            faculty: sa.faculty,
            type: 'Theory',
            studentCount: cls.studentCount,
          });
        }
        for (let i = 0; i < sessions_lab; i++) {
          sessions.push({
            classId: cls._id.toString(),
            className: cls.className,
            subjectId: subject._id.toString(),
            subjectName: subject.subjectName,
            subjectCode: subject.subjectCode,
            facultyId: sa.labFaculty
              ? sa.labFaculty._id.toString()
              : sa.faculty
              ? sa.faculty._id.toString()
              : null,
            faculty: sa.labFaculty || sa.faculty,
            type: 'Lab',
            studentCount: cls.studentCount,
          });
        }
      }
    }
    // Shuffle sessions so different subjects get distributed
    return sessions.sort(() => Math.random() - 0.5);
  }

  /** Find available classroom for a session */
  findClassroom(studentCount, day, startTime, endTime) {
    const suitable = this.classrooms
      .filter((r) => r.capacity >= studentCount && r.isActive)
      .sort((a, b) => a.capacity - b.capacity);

    for (const room of suitable) {
      if (isClassroomFree(room._id.toString(), day, startTime, endTime, this.assignments)) {
        return room;
      }
    }
    return null;
  }

  /** Find available lab for a session */
  findLab(day, startTime, endTime) {
    for (const lab of this.labs) {
      if (!lab.isActive) continue;

      if (lab.hasParts && lab.allowSimultaneousUse) {
        // Try Part A
        if (isLabFree(lab._id.toString(), 'Part A', true, day, startTime, endTime, this.assignments)) {
          return { lab, labPart: 'Part A' };
        }
        // Try Part B
        if (isLabFree(lab._id.toString(), 'Part B', true, day, startTime, endTime, this.assignments)) {
          return { lab, labPart: 'Part B' };
        }
      } else {
        if (isLabFree(lab._id.toString(), null, false, day, startTime, endTime, this.assignments)) {
          return { lab, labPart: null };
        }
      }
    }
    return null;
  }

  /** Main scheduling method using recursive backtracking */
  async run(progressCallback) {
    const sessions = this.buildSessionList();
    const total = sessions.length;
    let iterations = 0;
    const MAX_ITERATIONS = 50000; // Prevent infinite loop on unsolvable sets

    const solve = (index) => {
      if (index === total) return true; // All scheduled
      
      iterations++;
      if (iterations > MAX_ITERATIONS) return false;

      const session = sessions[index];
      const timePool = session.type === 'Theory' ? this.theorySlots : this.labSlots;

      const days = [...this.workingDays].sort(() => Math.random() - 0.5);
      const slots = [...timePool].sort(() => Math.random() - 0.5);

      for (const day of days) {
        for (const slot of slots) {
          const { startTime, endTime } = slot;

          // Hard constraint checks
          if (session.facultyId) {
            if (!isFacultyFree(session.facultyId, day, startTime, endTime, this.assignments)) continue;
            if (session.faculty && !isFacultyNotUnavailable(session.faculty, day, startTime, endTime)) continue;

            // Faculty workload check
            const hoursScheduled = getFacultyScheduledHours(session.facultyId, this.assignments);
            const maxHours = session.faculty?.maxWeeklyHours || 25;
            if (hoursScheduled >= maxHours) continue;

            const dailyHours = getFacultyScheduledHoursPerDay(session.facultyId, day, this.assignments);
            const maxDailyHours = this.constraints.maxFacultyHoursPerDay || 6;
            const sessionDuration = session.type === 'Theory' ? 1 : 1.5;
            if (dailyHours + sessionDuration > maxDailyHours) continue;
          }

          if (!isClassFree(session.classId, day, startTime, endTime, this.assignments)) continue;

          let classroomId = null, labId = null, labPart = null;

          if (session.type === 'Theory') {
            const room = this.findClassroom(session.studentCount, day, startTime, endTime);
            if (!room) continue;
            classroomId = room._id.toString();
          } else {
            const labResult = this.findLab(day, startTime, endTime);
            if (!labResult) continue;
            labId = labResult.lab._id.toString();
            labPart = labResult.labPart;
          }

          // Assign
          const assignment = {
            classId: session.classId,
            className: session.className,
            subjectId: session.subjectId,
            subjectName: session.subjectName,
            subjectCode: session.subjectCode,
            facultyId: session.facultyId,
            faculty: session.faculty,
            classroomId,
            labId,
            labPart,
            day,
            startTime,
            endTime,
            sessionType: session.type,
            studentCount: session.studentCount,
          };
          this.assignments.push(assignment);

          if (progressCallback && iterations % 100 === 0) {
            progressCallback({
              generation: iterations,
              totalGenerations: MAX_ITERATIONS,
              bestFitness: (this.assignments.length / total) * 1000,
              avgFitness: (this.assignments.length / total) * 1000,
            });
          }

          if (solve(index + 1)) return true;

          // Backtrack
          this.assignments.pop();
        }
      }
      return false; // Could not place this session
    };

    const success = solve(0);

    const conflicts = [];
    if (!success) {
      conflicts.push({
        type: 'algorithm',
        severity: 'high',
        description: `Backtracking search exhausted (placed ${this.assignments.length} of ${total})`,
        resolved: false,
      });
    }

    const fitness = Math.round((this.assignments.length / total) * 1000);
    return { assignments: this.assignments, conflicts, fitness };
  }
}

module.exports = BacktrackingScheduler;
