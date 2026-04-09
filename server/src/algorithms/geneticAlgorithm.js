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
    const facHours = new Map();

    individual.forEach((a, i) => {
      if (!a.startTime) { score -= 50; return; }
      if (a.type === 'Theory' && !a.classroomId) score -= 50;
      if (a.type === 'Lab' && !a.labId) score -= 50;

      const durationHours = (Number(a.endTime.split(':')[0]) + Number(a.endTime.split(':')[1])/60) - (Number(a.startTime.split(':')[0]) + Number(a.startTime.split(':')[1])/60);

      if (a.facultyId) {
        const fDayKey = `${a.facultyId}_${a.day}`;
        const currentHours = facHours.get(fDayKey) || 0;
        facHours.set(fDayKey, currentHours + durationHours);
        if (currentHours + durationHours > maxFacHoursPerDay) score -= 80;
      }

      for (let j = 0; j < i; j++) {
        const b = individual[j];
        if (b.day !== a.day || !b.startTime) continue;
        if (!slotsOverlap(a.startTime, a.endTime, b.startTime, b.endTime)) continue;

        if (a.facultyId && a.facultyId === b.facultyId) score -= 100;
        if (a.classId === b.classId) score -= 100;
        if (a.classroomId && a.classroomId === b.classroomId) score -= 80;
        if (a.labId && a.labId === b.labId) {
          if (!a.labPart || !b.labPart || a.labPart === b.labPart) score -= 100;
        }
      }
    });

    // Enforce No Free Slots Hard Constraint
    const classSchedules = {};
    for (const a of individual) {
        if (!a.startTime) continue;
        if (!classSchedules[a.classId]) classSchedules[a.classId] = {};
        if (!classSchedules[a.classId][a.day]) classSchedules[a.classId][a.day] = [];
        classSchedules[a.classId][a.day].push(a);
    }
    
    Object.values(classSchedules).forEach(days => {
       Object.values(days).forEach(slots => {
          slots.sort((x, y) => Number(x.startTime.replace(':','')) - Number(y.startTime.replace(':','')));
          
          if (slots.length > 0 && slots[0].startTime !== this.workingHours.startTime) {
              score -= 150;
          }

          for (let k = 0; k < slots.length - 1; k++) {
              const gapStart = slots[k].endTime;
              const gapEnd = slots[k+1].startTime;
              
              if (gapStart !== gapEnd) {
                  if (gapStart === this.workingHours.breakTime.start && gapEnd === this.workingHours.breakTime.end) {
                     // exact break transition, no penalty
                  } else {
                     score -= 150; 
                  }
              }
          }
       });
    });

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
      if (!a.startTime) { conflicts.push({ type: 'algorithm', severity: 'high', description: `No slot found for ${a.subjectCode} (${a.className})`, resolved: false }); continue; }
      
      for (let j = 0; j < i; j++) {
        const b = genes[j];
        if (b.day !== a.day || !b.startTime) continue;
        if (!slotsOverlap(a.startTime, a.endTime, b.startTime, b.endTime)) continue;

        if (a.facultyId && a.facultyId === b.facultyId) conflicts.push({ type: 'faculty', severity: 'high', description: `Faculty ${a.facultyId} double booked on ${a.day} at ${a.startTime}`, resolved: false });
        if (a.classId === b.classId) conflicts.push({ type: 'algorithm', severity: 'high', description: `Class ${a.className} double booked on ${a.day} at ${a.startTime}`, resolved: false });
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
