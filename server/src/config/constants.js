const WORKING_HOURS = {
  START: '07:30',
  END: '13:30',
  BREAK_START: '10:30',
  BREAK_END: '11:00',
};

const WORKING_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const SLOT_DURATION = 60; // minutes
const LAB_DURATION = 90; // 1.5 hours

// Generate standard time slots for working day
const generateTimeSlots = (
  startTime = WORKING_HOURS.START,
  endTime = WORKING_HOURS.END,
  breakStart = WORKING_HOURS.BREAK_START,
  breakEnd = WORKING_HOURS.BREAK_END,
  slotDuration = SLOT_DURATION
) => {
  const slots = [];
  let slotNumber = 1;

  const toMinutes = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const toTime = (mins) => {
    const h = Math.floor(mins / 60).toString().padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  let current = toMinutes(startTime);
  const end = toMinutes(endTime);
  const bStart = toMinutes(breakStart);
  const bEnd = toMinutes(breakEnd);

  while (current < end) {
    const slotEnd = current + slotDuration;

    if (current < bStart && slotEnd > bStart) {
      // Partial slot before break
      if (current < bStart) {
        slots.push({
          slotNumber: slotNumber++,
          startTime: toTime(current),
          endTime: toTime(bStart),
          duration: bStart - current,
          isBreak: false,
        });
      }
      // Break slot
      slots.push({
        slotNumber: 'BREAK',
        startTime: toTime(bStart),
        endTime: toTime(bEnd),
        duration: bEnd - bStart,
        isBreak: true,
      });
      current = bEnd;
    } else if (current === bStart) {
      slots.push({
        slotNumber: 'BREAK',
        startTime: toTime(bStart),
        endTime: toTime(bEnd),
        duration: bEnd - bStart,
        isBreak: true,
      });
      current = bEnd;
    } else {
      const actualEnd = Math.min(slotEnd, end);
      slots.push({
        slotNumber: slotNumber++,
        startTime: toTime(current),
        endTime: toTime(actualEnd),
        duration: actualEnd - current,
        isBreak: false,
      });
      current = slotEnd;
    }
  }

  return slots;
};

// Standard slots for the default working day
const DEFAULT_TIME_SLOTS = generateTimeSlots();

const CREDIT_SESSIONS = {
  6: { theory: 4, lab: 2 },
  5: { theory: 4, lab: 1 },
  4: { theory: 3, lab: 1 },
  3: { theory: 2, lab: 1 },
  2: { theory: 2, lab: 0 },
  1: { theory: 1, lab: 0 },
};

const SESSION_TYPES = ['Theory', 'Lab', 'Tutorial'];
const DESIGNATION_TYPES = [
  'Professor',
  'Associate Professor',
  'Assistant Professor',
  'Lecturer',
  'Visiting Faculty',
];
const ROOM_TYPES = ['Lecture Hall', 'Classroom', 'Smart Classroom', 'Auditorium'];
const LAB_TYPES = [
  'Computer Lab',
  'Physics Lab',
  'Chemistry Lab',
  'Electronics Lab',
  'Mechanical Lab',
  'General Lab',
];
const FACILITIES = ['Projector', 'Smart Board', 'AC', 'Audio System', 'Microphone'];

module.exports = {
  WORKING_HOURS,
  WORKING_DAYS,
  SLOT_DURATION,
  LAB_DURATION,
  DEFAULT_TIME_SLOTS,
  generateTimeSlots,
  CREDIT_SESSIONS,
  SESSION_TYPES,
  DESIGNATION_TYPES,
  ROOM_TYPES,
  LAB_TYPES,
  FACILITIES,
};
