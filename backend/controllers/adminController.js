const Admin = require('../models/Admin');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Admin
const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalTeachers, totalStudents, todayAttendance, totalAttendance] = await Promise.all([
      Teacher.countDocuments({ isActive: true }),
      Student.countDocuments({ isActive: true }),
      Attendance.countDocuments({ date: { $gte: today, $lt: tomorrow }, status: 'Present' }),
      Attendance.countDocuments({ date: { $gte: today, $lt: tomorrow } }),
    ]);

    // Weekly attendance trend (last 7 days)
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);

      const present = await Attendance.countDocuments({
        date: { $gte: day, $lt: nextDay },
        status: 'Present',
      });
      const total = await Attendance.countDocuments({ date: { $gte: day, $lt: nextDay } });

      weeklyData.push({
        date: day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        present,
        absent: total - present,
        total,
      });
    }

    // Class-wise attendance today
    const classWise = await Attendance.aggregate([
      { $match: { date: { $gte: today, $lt: tomorrow } } },
      {
        $group: {
          _id: { class: '$class', section: '$section' },
          present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
          total: { $sum: 1 },
        },
      },
      { $sort: { '_id.class': 1, '_id.section': 1 } },
    ]);

    res.json({
      success: true,
      data: {
        totalTeachers,
        totalStudents,
        todayPresent: todayAttendance,
        todayTotal: totalAttendance,
        attendanceRate:
          totalAttendance > 0 ? ((todayAttendance / totalAttendance) * 100).toFixed(1) : 0,
        weeklyData,
        classWise: classWise.map((c) => ({
          class: c._id.class,
          section: c._id.section,
          present: c.present,
          absent: c.total - c.present,
          total: c.total,
          rate: c.total > 0 ? ((c.present / c.total) * 100).toFixed(1) : 0,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };