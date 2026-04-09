const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/timetable.controller');

router.use(protect);

router.post('/generate', ctrl.generate);
router.get('/', ctrl.getAll);
router.get('/stats', ctrl.getDashboardStats);
router.get('/:id', ctrl.getOne);
router.put('/:id/publish', ctrl.publish);
router.put('/:id/archive', ctrl.archive);
router.put('/:id/slot', ctrl.updateSlot);
router.delete('/:id', ctrl.remove);

module.exports = router;
