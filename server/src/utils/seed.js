/**
 * Seed Script — populates the database with sample data for testing
 * Run: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User.model');
const Department = require('../models/Department.model');
const Faculty = require('../models/Faculty.model');
const Subject = require('../models/Subject.model');
const Classroom = require('../models/Classroom.model');
const Lab = require('../models/Lab.model');
const Class = require('../models/Class.model');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/timetable_db';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Drop the entire database to clear old indexes
    await mongoose.connection.db.dropDatabase();
    console.log('🗑️  Dropped existing database to clear old data and indexes');

    // --- Admin User ---
    const adminUser = await User.create({
      fullName: 'System Administrator',
      email: 'admin@timetable.com',
      password: 'Admin@1234',
      role: 'admin',
      phone: '9876543210',
    });
    console.log('👤 Admin user created: admin@timetable.com / Admin@1234');

    // --- Departments ---
    const [cse, ece, mech] = await Department.insertMany([
      { departmentCode: 'CSE', departmentName: 'Computer Science & Engineering', hodName: 'Dr. Arjun Sharma', contactEmail: 'hod.cse@college.edu', contactPhone: '9812345678', createdBy: adminUser._id },
      { departmentCode: 'ECE', departmentName: 'Electronics & Communication Engineering', hodName: 'Dr. Priya Nair', contactEmail: 'hod.ece@college.edu', contactPhone: '9823456789', createdBy: adminUser._id },
      { departmentCode: 'MECH', departmentName: 'Mechanical Engineering', hodName: 'Dr. Ravi Kumar', contactEmail: 'hod.mech@college.edu', contactPhone: '9834567890', createdBy: adminUser._id },
    ]);
    console.log('🏢 Departments created');

    // --- Faculty ---
    const [f1, f2, f3, f4, f5, f6, f7, f8] = await Faculty.insertMany([
      { facultyId: 'FAC001', fullName: 'Dr. Suresh Iyer', email: 'suresh.iyer@college.edu', phone: '9801111111', department: cse._id, designation: 'Professor', specialization: ['Data Structures', 'Algorithms'], maxWeeklyHours: 20 },
      { facultyId: 'FAC002', fullName: 'Prof. Anita Verma', email: 'anita.verma@college.edu', phone: '9802222222', department: cse._id, designation: 'Associate Professor', specialization: ['DBMS', 'SQL'], maxWeeklyHours: 22 },
      { facultyId: 'FAC003', fullName: 'Dr. Karthik Menon', email: 'karthik.menon@college.edu', phone: '9803333333', department: cse._id, designation: 'Assistant Professor', specialization: ['Operating Systems', 'Linux'], maxWeeklyHours: 25 },
      { facultyId: 'FAC004', fullName: 'Dr. Lakshmi Rao', email: 'lakshmi.rao@college.edu', phone: '9804444444', department: cse._id, designation: 'Assistant Professor', specialization: ['Computer Networks', 'Security'], maxWeeklyHours: 25 },
      { facultyId: 'FAC005', fullName: 'Prof. Vijay Pillai', email: 'vijay.pillai@college.edu', phone: '9805555555', department: cse._id, designation: 'Lecturer', specialization: ['Python', 'Web Dev'], maxWeeklyHours: 28 },
      { facultyId: 'FAC006', fullName: 'Dr. Meenal Joshi', email: 'meenal.joshi@college.edu', phone: '9806666666', department: ece._id, designation: 'Professor', specialization: ['Digital Electronics', 'VLSI'], maxWeeklyHours: 20 },
      { facultyId: 'FAC007', fullName: 'Prof. Dinesh Chandra', email: 'dinesh.chandra@college.edu', phone: '9807777777', department: ece._id, designation: 'Associate Professor', specialization: ['Signals', 'Communications'], maxWeeklyHours: 22 },
      { facultyId: 'FAC008', fullName: 'Dr. Padma Krishnan', email: 'padma.krishnan@college.edu', phone: '9808888888', department: mech._id, designation: 'Professor', specialization: ['Thermodynamics', 'Fluid Mechanics'], maxWeeklyHours: 20 },
    ]);
    console.log('👨‍🏫 Faculty created');

    // --- Subjects (CSE Sem 3) ---
    const [ds, dbms, os, cn, python] = await Subject.insertMany([
      { subjectCode: 'CS301', subjectName: 'Data Structures', department: cse._id, credits: 4, semester: 3 },
      { subjectCode: 'CS302', subjectName: 'Database Management Systems', department: cse._id, credits: 4, semester: 3 },
      { subjectCode: 'CS303', subjectName: 'Operating Systems', department: cse._id, credits: 3, semester: 3 },
      { subjectCode: 'CS304', subjectName: 'Computer Networks', department: cse._id, credits: 3, semester: 3 },
      { subjectCode: 'CS305', subjectName: 'Python Programming', department: cse._id, credits: 2, semester: 3 },
    ]);

    // CSE Sem 5 subjects
    const [coa, ml, se, cd] = await Subject.insertMany([
      { subjectCode: 'CS501', subjectName: 'Computer Organization & Architecture', department: cse._id, credits: 4, semester: 5 },
      { subjectCode: 'CS502', subjectName: 'Machine Learning', department: cse._id, credits: 4, semester: 5 },
      { subjectCode: 'CS503', subjectName: 'Software Engineering', department: cse._id, credits: 3, semester: 5 },
      { subjectCode: 'CS504', subjectName: 'Compiler Design', department: cse._id, credits: 3, semester: 5 },
    ]);
    console.log('📚 Subjects created');

    // --- Classrooms ---
    const [r101, r102, r103, r201, r202] = await Classroom.insertMany([
      { roomNumber: 'A101', roomName: 'Lecture Hall A', building: 'Block A', floor: '1', capacity: 70, roomType: 'Lecture Hall', facilities: ['Projector', 'AC'] },
      { roomNumber: 'A102', roomName: 'Classroom A102', building: 'Block A', floor: '1', capacity: 60, roomType: 'Smart Classroom', facilities: ['Smart Board', 'AC', 'Projector'] },
      { roomNumber: 'A103', roomName: 'Classroom A103', building: 'Block A', floor: '1', capacity: 60, roomType: 'Classroom', facilities: ['Projector'] },
      { roomNumber: 'B201', roomName: 'Lecture Hall B', building: 'Block B', floor: '2', capacity: 80, roomType: 'Lecture Hall', facilities: ['Projector', 'AC', 'Audio System'] },
      { roomNumber: 'B202', roomName: 'Seminar Hall', building: 'Block B', floor: '2', capacity: 100, roomType: 'Auditorium', facilities: ['Projector', 'AC', 'Audio System', 'Microphone'] },
    ]);
    console.log('🏫 Classrooms created');

    // --- Labs ---
    const [lab1, lab2] = await Lab.insertMany([
      {
        labCode: 'CPL01', labName: 'Computer Programming Lab', department: cse._id,
        building: 'Block A', floor: '2', capacity: 60, labType: 'Computer Lab',
        hasParts: true, allowSimultaneousUse: true,
        parts: [
          { partName: 'Part A', capacity: 30, location: 'Block A, Floor 2, Wing Left' },
          { partName: 'Part B', capacity: 30, location: 'Block A, Floor 2, Wing Right' },
        ],
        equipment: ['30 Dell Desktops', 'Server', 'Networking Equipment'],
      },
      {
        labCode: 'NETL01', labName: 'Networking Lab', department: cse._id,
        building: 'Block B', floor: '3', capacity: 30, labType: 'Computer Lab',
        hasParts: false, allowSimultaneousUse: false,
        equipment: ['Cisco Routers', 'Switches', '30 Workstations'],
      },
    ]);
    console.log('🔬 Labs created');

    // --- Classes ---
    const [cse3a, cse3b, cse5a] = await Class.insertMany([
      {
        className: 'CSE-3A',
        department: cse._id, semester: 3, section: 'A',
        academicYear: '2024-2025', studentCount: 60,
        subjects: [
          { subject: ds._id, faculty: f1._id, labFaculty: f5._id },
          { subject: dbms._id, faculty: f2._id, labFaculty: f2._id },
          { subject: os._id, faculty: f3._id, labFaculty: f3._id },
          { subject: cn._id, faculty: f4._id },
          { subject: python._id, faculty: f5._id },
        ],
      },
      {
        className: 'CSE-3B',
        department: cse._id, semester: 3, section: 'B',
        academicYear: '2024-2025', studentCount: 58,
        subjects: [
          { subject: ds._id, faculty: f1._id, labFaculty: f5._id },
          { subject: dbms._id, faculty: f2._id, labFaculty: f2._id },
          { subject: os._id, faculty: f3._id, labFaculty: f3._id },
          { subject: cn._id, faculty: f4._id },
          { subject: python._id, faculty: f5._id },
        ],
      },
      {
        className: 'CSE-5A',
        department: cse._id, semester: 5, section: 'A',
        academicYear: '2024-2025', studentCount: 55,
        subjects: [
          { subject: coa._id, faculty: f1._id, labFaculty: f3._id },
          { subject: ml._id, faculty: f2._id, labFaculty: f5._id },
          { subject: se._id, faculty: f4._id },
          { subject: cd._id, faculty: f3._id },
        ],
      },
    ]);
    console.log('🎓 Classes created');

    console.log('\n✅ ========== SEED COMPLETE ==========');
    console.log('🔑 Admin Login:');
    console.log('   Email   : admin@timetable.com');
    console.log('   Password: Admin@1234');
    console.log('=====================================\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
