const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');

const deptCtrl = require('../controllers/department.controller');
const facultyCtrl = require('../controllers/faculty.controller');
const subjectCtrl = require('../controllers/subject.controller');
const classroomCtrl = require('../controllers/classroom.controller');
const labCtrl = require('../controllers/lab.controller');
const classCtrl = require('../controllers/class.controller');

router.use(protect);

// Departments
router.get('/departments', deptCtrl.getAll);
router.get('/departments/:id', deptCtrl.getOne);
router.post('/departments', deptCtrl.create);
router.put('/departments/:id', deptCtrl.update);
router.delete('/departments/:id', deptCtrl.remove);
router.patch('/departments/:id/toggle', deptCtrl.toggleStatus);

// Faculty
router.get('/faculty', facultyCtrl.getAll);
router.get('/faculty/:id', facultyCtrl.getOne);
router.post('/faculty', facultyCtrl.create);
router.put('/faculty/:id', facultyCtrl.update);
router.delete('/faculty/:id', facultyCtrl.remove);
router.patch('/faculty/:id/toggle', facultyCtrl.toggleStatus);
router.get('/faculty/department/:departmentId', facultyCtrl.getByDepartment);

// Subjects
router.get('/subjects', subjectCtrl.getAll);
router.get('/subjects/:id', subjectCtrl.getOne);
router.post('/subjects', subjectCtrl.create);
router.put('/subjects/:id', subjectCtrl.update);
router.delete('/subjects/:id', subjectCtrl.remove);
router.get('/subjects/department/:departmentId', subjectCtrl.getByDepartment);
router.get('/subjects/calc-sessions/:credits', subjectCtrl.calculateSessions);

// Classrooms
router.get('/classrooms', classroomCtrl.getAll);
router.get('/classrooms/available', classroomCtrl.getAvailable);
router.get('/classrooms/:id', classroomCtrl.getOne);
router.post('/classrooms', classroomCtrl.create);
router.put('/classrooms/:id', classroomCtrl.update);
router.delete('/classrooms/:id', classroomCtrl.remove);

// Labs
router.get('/labs', labCtrl.getAll);
router.get('/labs/available', labCtrl.getAvailable);
router.get('/labs/:id', labCtrl.getOne);
router.post('/labs', labCtrl.create);
router.put('/labs/:id', labCtrl.update);
router.delete('/labs/:id', labCtrl.remove);

// Classes
router.get('/classes', classCtrl.getAll);
router.get('/classes/:id', classCtrl.getOne);
router.post('/classes', classCtrl.create);
router.put('/classes/:id', classCtrl.update);
router.delete('/classes/:id', classCtrl.remove);
router.get('/classes/department/:departmentId', classCtrl.getByDepartment);

module.exports = router;
