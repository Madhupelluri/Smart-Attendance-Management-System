const Attendance = require('../models/Attendance');
const Student = require('../models/Student');

// @desc    Mark attendance for multiple students
// @route   POST /api/attendance/mark
// @access  Teacher, Admin
const markAttendance = async (req, res, next) => {
  try {
    const { date, class: className, section, attendance } = req.body;
    // attendance: [{ studentId, status, remarks }]

    if (!attendance || !Array.isArray(attendance) || attendance.length === 0) {
      return res.status(400).json({ success: false, message: 'Attendance data is required' });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const results = [];
    const errors = [];

    for (const record of attendance) {
      try {
        const updated = await Attendance.findOneAndUpdate(
          { studentId: record.studentId, date: attendanceDate },
          {
            studentId: record.studentId,
            date: attendanceDate,
            status: record.status,
            remarks: record.remarks || '',
            markedBy: req.user._id,
            markedByModel: req.user.role === 'admin' ? 'Admin' : 'Teacher',
            class: className,
            section,
          },
          { upsert: true, new: true, runValidators: true }
        );
        results.push(updated);
      } catch (err) {
        errors.push({ studentId: record.studentId, error: err.message });
      }
    }

    res.json({
      success: true,
      message: `Attendance marked for ${results.length} students`,
      data: results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance by date and class/section
// @route   GET /api/attendance
// @access  Teacher, Admin
const getAttendance = async (req, res, next) => {
  try {
    const { date, class: className, section } = req.query;

    const filter = {};
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      filter.date = { $gte: d, $lt: next };
    }
    if (className) filter.class = className;
    if (section) filter.section = section;

    const attendance = await Attendance.find(filter)
      .populate('studentId', 'name rollNumber class section')
      .sort({ 'studentId.rollNumber': 1 });

    res.json({ success: true, count: attendance.length, data: attendance });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance history for a student
// @route   GET /api/attendance/student/:studentId
// @access  Teacher, Admin
const getStudentAttendance = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    const filter = { studentId };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const sd = new Date(startDate);
        sd.setHours(0, 0, 0, 0);
        filter.date.$gte = sd;
      }
      if (endDate) {
        const ed = new Date(endDate);
        ed.setHours(23, 59, 59, 999);
        filter.date.$lte = ed;
      }
    }

    const records = await Attendance.find(filter).sort({ date: -1 });
    const total = records.length;
    const present = records.filter((r) => r.status === 'Present').length;
    const absent = records.filter((r) => r.status === 'Absent').length;

    res.json({
      success: true,
      data: {
        records,
        summary: {
          total,
          present,
          absent,
          late: records.filter((r) => r.status === 'Late').length,
          rate: total > 0 ? ((present / total) * 100).toFixed(1) : 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get today's attendance status for a class
// @route   GET /api/attendance/today
// @access  Teacher, Admin
const getTodayAttendance = async (req, res, next) => {
  try {
    const { class: className, section } = req.query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const filter = { date: { $gte: today, $lt: tomorrow } };
    if (className) filter.class = className;
    if (section) filter.section = section;

    const attendance = await Attendance.find(filter).populate(
      'studentId',
      'name rollNumber class section'
    );

    // Get all students in class/section
    const studentFilter = { isActive: true };
    if (className) studentFilter.class = className;
    if (section) studentFilter.section = section;
    const students = await Student.find(studentFilter).sort({ rollNumber: 1 });

    // Merge
    const result = students.map((student) => {
      const record = attendance.find(
        (a) => a.studentId && a.studentId._id.toString() === student._id.toString()
      );
      return {
        student,
        attendance: record || null,
        status: record ? record.status : 'Not Marked',
      };
    });

    res.json({ success: true, count: result.length, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { markAttendance, getAttendance, getStudentAttendance, getTodayAttendance };