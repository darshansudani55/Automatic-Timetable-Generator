/**
 * Constraint Checker — all hard & soft constraint validation
 */

const toMinutes = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const slotsOverlap = (s1Start, s1End, s2Start, s2End) => {
  const a = toMinutes(s1Start);
  const b = toMinutes(s1End);
  const c = toMinutes(s2Start);
  const d = toMinutes(s2End);
  return a < d && c < b;
};

/**
 * Check if a faculty member is free at a given time slot
 * @param {string} facultyId
 * @param {string} day
 * @param {string} startTime
 * @param {string} endTime
 * @param {Array} allAssignments  - flat list of all scheduled slots
 */
const isFacultyFree = (facultyId, day, startTime, endTime, allAssignments) => {
  return !allAssignments.some(
    (a) =>
      a.facultyId === facultyId &&
      a.day === day &&
      slotsOverlap(startTime, endTime, a.startTime, a.endTime)
  );
};

/**
 * Check if a classroom is free at a given time slot
 */
const isClassroomFree = (classroomId, day, startTime, endTime, allAssignments) => {
  return !allAssignments.some(
    (a) =>
      a.classroomId === classroomId &&
      a.day === day &&
      slotsOverlap(startTime, endTime, a.startTime, a.endTime)
  );
};

/**
 * Check if a lab (or lab part) is free at a given time slot
 */
const isLabFree = (labId, labPart, allowSimultaneous, day, startTime, endTime, allAssignments) => {
  return !allAssignments.some((a) => {
    if (a.labId !== labId || a.day !== day) return false;
    if (!slotsOverlap(startTime, endTime, a.startTime, a.endTime)) return false;
    // If lab supports simultaneous use, check part-level conflict
    if (allowSimultaneous && labPart && a.labPart) {
      return a.labPart === labPart;
    }
    return true; // Whole lab is blocked
  });
};

/**
 * Check if a class already has a session in this time slot
 */
const isClassFree = (classId, day, startTime, endTime, allAssignments) => {
  return !allAssignments.some(
    (a) =>
      a.classId === classId &&
      a.day === day &&
      slotsOverlap(startTime, endTime, a.startTime, a.endTime)
  );
};

/**
 * Check faculty unavailable slots
 */
const isFacultyNotUnavailable = (faculty, day, startTime, endTime) => {
  if (!faculty.unavailableSlots || faculty.unavailableSlots.length === 0) return true;
  return !faculty.unavailableSlots.some(
    (u) => u.day === day && slotsOverlap(startTime, endTime, u.startTime, u.endTime)
  );
};

/**
 * Count faculty hours already scheduled
 */
const getFacultyScheduledHours = (facultyId, allAssignments) => {
  return allAssignments
    .filter((a) => a.facultyId === facultyId)
    .reduce((sum, a) => sum + (toMinutes(a.endTime) - toMinutes(a.startTime)) / 60, 0);
};

/**
 * Count faculty hours scheduled on a specific day
 */
const getFacultyScheduledHoursPerDay = (facultyId, day, allAssignments) => {
  return allAssignments
    .filter((a) => a.facultyId === facultyId && a.day === day)
    .reduce((sum, a) => sum + (toMinutes(a.endTime) - toMinutes(a.startTime)) / 60, 0);
};

/**
 * Count free slots (gaps) in a class day schedule
 */
const countFreeSlots = (classId, day, allAssignments) => {
  const daySlots = allAssignments
    .filter((a) => a.classId === classId && a.day === day)
    .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));

  let gaps = 0;
  for (let i = 0; i < daySlots.length - 1; i++) {
    const gap = toMinutes(daySlots[i + 1].startTime) - toMinutes(daySlots[i].endTime);
    if (gap > 0) gaps++;
  }
  return gaps;
};

/**
 * Get all possible theory time slots for a working day
 * Returns array of { startTime, endTime } pairs from the slot list
 */
const getTheoryTimeSlots = (timeSlots) => {
  return timeSlots
    .filter((s) => !s.isBreak && s.duration >= 60)
    .map((s) => ({ startTime: s.startTime, endTime: s.endTime }));
};

/**
 * Get all possible lab time slots (need consecutive 90 min blocks)
 */
const getLabTimeSlots = (timeSlots) => {
  const labSlots = [];
  const regularSlots = timeSlots.filter((s) => !s.isBreak);

  for (let i = 0; i < regularSlots.length; i++) {
    let totalMins = 0;
    const combined = [];
    for (let j = i; j < regularSlots.length; j++) {
      // Check continuity
      if (j > i) {
        const prev = combined[combined.length - 1];
        if (prev.endTime !== regularSlots[j].startTime) break;
      }
      totalMins += regularSlots[j].duration;
      combined.push(regularSlots[j]);
      if (totalMins >= 90) {
        labSlots.push({
          startTime: combined[0].startTime,
          endTime: combined[combined.length - 1].endTime,
          duration: totalMins,
          slots: [...combined],
        });
        break;
      }
    }
  }
  return labSlots;
};

module.exports = {
  isFacultyFree,
  isClassroomFree,
  isLabFree,
  isClassFree,
  isFacultyNotUnavailable,
  getFacultyScheduledHours,
  getFacultyScheduledHoursPerDay,
  countFreeSlots,
  getTheoryTimeSlots,
  getLabTimeSlots,
  toMinutes,
  slotsOverlap,
};
