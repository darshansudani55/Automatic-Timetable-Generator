const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/report.controller');

router.use(protect);

router.get('/dashboard', ctrl.getDashboardStats);
router.get('/audit-logs', ctrl.getAuditLogs);
router.get('/timetable/:timetableId/faculty-workload', ctrl.getFacultyWorkload);
router.get('/timetable/:timetableId/class/:classId', ctrl.getClassTimetable);
router.get('/timetable/:timetableId/classroom-utilization', ctrl.getClassroomUtilization);
router.get('/timetable/:timetableId/lab-utilization', ctrl.getLabUtilization);

module.exports = router;
