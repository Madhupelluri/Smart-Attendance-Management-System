const Attendance = require('../models/Attendance');
const Student = require('../models/Student');

// @desc    Get class-wise attendance report for a date range
// @route   GET /api/reports/class
// @access  Admin, Teacher
const getClassReport = async (req, res, next) => {
  try {
    const { class: className, section, startDate, endDate } = req.query;

    if (!className || !section) {
      return res.status(400).json({ success: false, message: 'Class and section are required' });
    }

    const sd = new Date(startDate || new Date().setDate(new Date().getDate() - 30));
    const ed = new Date(endDate || new Date());
    sd.setHours(0, 0, 0, 0);
    ed.setHours(23, 59, 59, 999);

    const students = await Student.find({ class: className, section, isActive: true }).sort({
      rollNumber: 1,
    });

    const attendanceRecords = await Attendance.find({
      class: className,
      section,
      date: { $gte: sd, $lte: ed },
    });

    const report = students.map((student) => {
      const records = attendanceRecords.filter(
        (r) => r.studentId.toString() === student._id.toString()
      );
      const present = records.filter((r) => r.status === 'Present').length;
      const absent = records.filter((r) => r.status === 'Absent').length;
      const late = records.filter((r) => r.status === 'Late').length;
      const total = records.length;

      return {
        student: {
          id: student._id,
          rollNumber: student.rollNumber,
          name: student.name,
        },
        present,
        absent,
        late,
        total,
        rate: total > 0 ? ((present / total) * 100).toFixed(1) : 'N/A',
      };
    });

    // Working days in range
    const workingDays = await Attendance.distinct('date', {
      class: className,
      section,
      date: { $gte: sd, $lte: ed },
    });

    res.json({
      success: true,
      data: {
        class: className,
        section,
        startDate: sd,
        endDate: ed,
        workingDays: workingDays.length,
        totalStudents: students.length,
        report,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get monthly summary report
// @route   GET /api/reports/monthly
// @access  Admin
const getMonthlyReport = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth() + 1;

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const summary = await Attendance.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { class: '$class', section: '$section' },
          totalRecords: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] } },
        },
      },
      { $sort: { '_id.class': 1, '_id.section': 1 } },
    ]);

    res.json({
      success: true,
      data: {
        year: y,
        month: m,
        summary: summary.map((s) => ({
          class: s._id.class,
          section: s._id.section,
          totalRecords: s.totalRecords,
          present: s.present,
          absent: s.absent,
          late: s.late,
          rate:
            s.totalRecords > 0 ? ((s.present / s.totalRecords) * 100).toFixed(1) : 0,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get low attendance students (below threshold)
// @route   GET /api/reports/low-attendance
// @access  Admin
const getLowAttendanceReport = async (req, res, next) => {
  try {
    const threshold = parseFloat(req.query.threshold) || 75;
    const days = parseInt(req.query.days) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const records = await Attendance.aggregate([
      { $match: { date: { $gte: startDate } } },
      {
        $group: {
          _id: '$studentId',
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
        },
      },
      {
        $addFields: {
          rate: { $multiply: [{ $divide: ['$present', '$total'] }, 100] },
        },
      },
      { $match: { rate: { $lt: threshold } } },
      { $sort: { rate: 1 } },
    ]);

    const studentIds = records.map((r) => r._id);
    const students = await Student.find({ _id: { $in: studentIds } });

    const result = records.map((r) => {
      const student = students.find((s) => s._id.toString() === r._id.toString());
      return {
        student: student
          ? { name: student.name, rollNumber: student.rollNumber, class: student.class, section: student.section }
          : null,
        present: r.present,
        total: r.total,
        absent: r.total - r.present,
        rate: r.rate.toFixed(1),
      };
    }).filter((r) => r.student !== null);

    res.json({ success: true, count: result.length, threshold, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { getClassReport, getMonthlyReport, getLowAttendanceReport };