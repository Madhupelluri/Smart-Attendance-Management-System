const express = require('express');
const router = express.Router();
const {
  markAttendance,
  getAttendance,
  getStudentAttendance,
  getTodayAttendance,
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/mark', markAttendance);
router.get('/', getAttendance);
router.get('/today', getTodayAttendance);
router.get('/student/:studentId', getStudentAttendance);

module.exports = router;