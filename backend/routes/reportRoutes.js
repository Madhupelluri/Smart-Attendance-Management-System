const express = require('express');
const router = express.Router();
const {
  getClassReport,
  getMonthlyReport,
  getLowAttendanceReport,
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/class', getClassReport);
router.get('/monthly', getMonthlyReport);
router.get('/low-attendance', getLowAttendanceReport);

module.exports = router;