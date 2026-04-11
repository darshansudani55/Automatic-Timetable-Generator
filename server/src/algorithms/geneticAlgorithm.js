/**
 * Genetic Algorithm Scheduler
 * Produces near-optimal conflict-free timetables via evolutionary optimization.
 */
const {
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
  slotsOverlap,
} = require('./constraintChecker');
const { WORKING_DAYS, generateTimeSlots } = require('../config/constants');

class GeneticAlgorithmScheduler {
  constructor(config) {
    this.classes = config.classes;
    this.classrooms = config.classrooms || [];
    this.labs = config.labs || [];
    this.workingDays = config.workingDays || WORKING_DAYS;
    this.workingHours = config.workingHours;
    this.constraints = config.constraints || {};
    this.populationSize = Math.min(config.populationSize || 50, 80);
    this.generations = Math.min(config.generations || 200, 300);
    this.mutationRate = config.mutationRate || 0.15;
    this.crossoverRate = config.crossoverRate || 0.7;
    this.elitismRate = config.elitismRate || 0.15;

    this.timeSlots = generateTimeSlots(
      this.workingHours.startTime,
      this.workingHours.endTime,
      this.workingHours.breakTime.start,
      this.workingHours.breakTime.end
    );
    this.theorySlots = getTheoryTimeSlots(this.timeSlots);
    this.labSlots = getLabTimeSlots(this.timeSlots);
  }

  buildSessionList() {
    const sessions = [];
    for (const cls of this.classes) {
      for (const sa of cls.subjects) {
        const subject = sa.subject;
        const theory = subject.sessionsPerWeek?.theory || 0;
        const lab = subject.sessionsPerWeek?.lab || 0;
        for (let i = 0; i < theory; i++) {
          sessions.push({ classId: cls._id.toString(), className: cls.className, subjectId: subject._id.toString(), subjectCode: subject.subjectCode, subjectName: subject.subjectName, facultyId: sa.faculty?._id?.toString() || null, faculty: sa.faculty, type: 'Theory', studentCount: cls.studentCount });
        }
        for (let i = 0; i < lab; i++) {
          const lf = sa.labFaculty || sa.faculty;
          sessions.push({ classId: cls._id.toString(), className: cls.className, subjectId: subject._id.toString(), subjectCode: subject.subjectCode, subjectName: subject.subjectName, facultyId: lf?._id?.toString() || null, faculty: lf, type: 'Lab', studentCount: cls.studentCount });
        }
      }
    }
    return sessions;
  }

  randomSlot(type) {
    const pool = type === 'Lab' ? this.labSlots : this.theorySlots;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  randomDay() { return this.workingDays[Math.floor(Math.random() * this.workingDays.length)]; }

  randomClassroom(studentCount) {
    const suitable = this.classrooms.filter((r) => r.isActive && r.capacity >= studentCount);
    if (!suitable.length) return null;
    return suitable[Math.floor(Math.random() * suitable.length)];
  }

  randomLab() {
    const active = this.labs.filter((l) => l.isActive);
    if (!active.length) return { lab: null, labPart: null };
    const lab = active[Math.floor(Math.random() * active.length)];
    let labPart = null;
    if (lab.hasParts && lab.parts?.length) {
      labPart = lab.parts[Math.floor(Math.random() * lab.parts.length)].partName;
    }
    return { lab, labPart };
  }

  createIndividual(sessions) {
    return sessions.map((s) => {
      const slot = this.randomSlot(s.type);
      const day = this.randomDay();
      let classroomId = null, labId = null, labPart = null;
      if (s.type === 'Theory') { const r = this.randomClassroom(s.studentCount); if (r) classroomId = r._id.toString(); }
      else { const { lab, labPart: lp } = this.randomLab(); if (lab) { labId = lab._id.toString(); labPart = lp; } }
      return { ...s, day, startTime: slot?.startTime, endTime: slot?.endTime, classroomId, labId, labPart };
    });
  }

  calcFitness(individual) {
    let score = 1000;
    const maxFacHoursPerDay = this.constraints.maxFacultyHoursPerDay || 6;
    const dayCapacityMins = (() => {
      const start = this.workingHours.startTime.split(':').map(Number);
      const end   = this.workingHours.endTime.split(':').map(Number);
      const bkStart = this.workingHours.breakTime.start.split(':').map(Number);
      const bkEnd   = this.workingHours.breakTime.end.split(':').map(Number);
      const total = (end[0]*60+end[1]) - (start[0]*60+start[1]);
      const breakMins = (bkEnd[0]*60+bkEnd[1]) - (bkStart[0]*60+bkStart[1]);
      return total - breakMins; // usable minutes per day
    })();

    // Penalty: missing resources
    for (const a of individual) {
      if (a.type === 'Theory' && !a.classroomId) score -= 40;
      if (a.type === 'Lab'    && !a.labId)       score -= 40;
    }

    // Group by classId+day and facultyId+day
    const classDay  = {}; // classId → day → [sessions]
    const facDay    = {}; // facultyId → day → totalMinutes

    for (const a of individual) {
      const cdKey = `${a.classId}::${a.day}`;
      if (!classDay[cdKey]) classDay[cdKey] = [];
      classDay[cdKey].push(a);

      if (a.facultyId) {
        const fdKey = `${a.facultyId}::${a.day}`;
        const dur = a.type === 'Lab' ? 90 : 60;
        facDay[fdKey] = (facDay[fdKey] || 0) + dur;
      }
    }

    // Penalty: class has more sessions in a day than can fit
    for (const [, sessions] of Object.entries(classDay)) {
      const totalMins = sessions.reduce((s, a) => s + (a.type === 'Lab' ? 90 : 60), 0);
      if (totalMins > dayCapacityMins) {
        score -= (totalMins - dayCapacityMins) * 10; // Strictly penalise every minute of overflow
      }
    }

    // Penalty: faculty exceeds max hours per day
    for (const [, mins] of Object.entries(facDay)) {
      const hours = mins / 60;
      if (hours > maxFacHoursPerDay) score -= Math.floor(hours - maxFacHoursPerDay) * 80;
    }

    // Penalty: same faculty assigned to 2+ classes on same day (double booking)
    // Build faculty → day → classes map
    const facDayClasses = {};
    for (const a of individual) {
      if (!a.facultyId) continue;
      const key = `${a.facultyId}::${a.day}`;
      if (!facDayClasses[key]) facDayClasses[key] = new Set();
      facDayClasses[key].add(a.classId);
    }
    for (const [, classSet] of Object.entries(facDayClasses)) {
      if (classSet.size > 1) score -= (classSet.size - 1) * 100;
    }

    // Reward: balanced sessions spread across days
    const classDayCount = {};
    for (const a of individual) {
      const key = `${a.classId}::${a.day}`;
      classDayCount[key] = (classDayCount[key] || 0) + 1;
    }
    const allClassIds = [...new Set(individual.map(a => a.classId))];
    for (const classId of allClassIds) {
      const counts = this.workingDays.map(d => classDayCount[`${classId}::${d}`] || 0);
      const avg = counts.reduce((s,c) => s+c, 0) / counts.length;
      const variance = counts.reduce((s,c) => s + Math.pow(c - avg, 2), 0) / counts.length;
      score -= Math.floor(variance) * 10; // penalise uneven spread
    }

    return Math.max(0, score);
  }

  select(population) {
    const size = Math.min(5, population.length);
    const tournament = Array.from({ length: size }, () => population[Math.floor(Math.random() * population.length)]);
    return tournament.sort((a, b) => b.fitness - a.fitness)[0].genes;
  }

  crossover(p1, p2) {
    if (Math.random() > this.crossoverRate || p1.length < 2) return [p1, p2];
    const pt = Math.floor(Math.random() * p1.length);
    return [[...p1.slice(0, pt), ...p2.slice(pt)], [...p2.slice(0, pt), ...p1.slice(pt)]];
  }

  mutate(genes) {
    return genes.map((g) => {
      if (Math.random() > this.mutationRate) return g;
      const slot = this.randomSlot(g.type);
      const day = this.randomDay();
      let classroomId = g.classroomId, labId = g.labId, labPart = g.labPart;
      if (Math.random() < 0.4) {
        if (g.type === 'Theory') { const r = this.randomClassroom(g.studentCount); if (r) classroomId = r._id.toString(); }
        else { const { lab, labPart: lp } = this.randomLab(); if (lab) { labId = lab._id.toString(); labPart = lp; } }
      }
      return { ...g, day, startTime: slot?.startTime, endTime: slot?.endTime, classroomId, labId, labPart };
    });
  }

  extractConflicts(genes) {
    const conflicts = [];
    for (let i = 0; i < genes.length; i++) {
      const a = genes[i];
      if (!a.startTime) { conflicts.push({ conflictType: 'algorithm', severity: 'high', description: `No slot found for ${a.subjectCode} (${a.className})`, resolved: false }); continue; }
      
      for (let j = 0; j < i; j++) {
        const b = genes[j];
        if (b.day !== a.day || !b.startTime) continue;
        if (!slotsOverlap(a.startTime, a.endTime, b.startTime, b.endTime)) continue;

        if (a.facultyId && a.facultyId === b.facultyId) conflicts.push({ conflictType: 'faculty', severity: 'high', description: `Faculty ${a.facultyId} double booked on ${a.day} at ${a.startTime}`, resolved: false });
        if (a.classId === b.classId) conflicts.push({ conflictType: 'algorithm', severity: 'high', description: `Class ${a.className} double booked on ${a.day} at ${a.startTime}`, resolved: false });
      }
    }
    return conflicts;
  }

  async run(progressCallback) {
    const sessions = this.buildSessionList();
    if (!sessions.length) return { assignments: [], conflicts: [], fitness: 0 };

    let population = Array.from({ length: this.populationSize }, () => {
      const genes = this.createIndividual(sessions);
      const fitness = this.calcFitness(genes);
      return { genes, fitness };
    });

    population.sort((a, b) => b.fitness - a.fitness);
    let best = population[0];

    for (let gen = 0; gen < this.generations; gen++) {
      const eliteCount = Math.max(1, Math.floor(this.populationSize * this.elitismRate));
      const next = population.slice(0, eliteCount);

      while (next.length < this.populationSize) {
        const p1 = this.select(population);
        const p2 = this.select(population);
        const [c1, c2] = this.crossover(p1, p2);
        const m1 = this.mutate(c1); const m2 = this.mutate(c2);
        next.push({ genes: m1, fitness: this.calcFitness(m1) });
        if (next.length < this.populationSize) next.push({ genes: m2, fitness: this.calcFitness(m2) });
      }

      population = next.sort((a, b) => b.fitness - a.fitness);
      if (population[0].fitness > best.fitness) best = population[0];

      if (progressCallback && gen % 10 === 0) {
        progressCallback({ generation: gen + 1, totalGenerations: this.generations, bestFitness: best.fitness, avgFitness: population.reduce((s, i) => s + i.fitness, 0) / population.length });
      }
      if (best.fitness >= 995) break;
    }

    return { assignments: best.genes, conflicts: this.extractConflicts(best.genes), fitness: best.fitness };
  }
}

module.exports = GeneticAlgorithmScheduler;
