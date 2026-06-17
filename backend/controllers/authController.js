const Admin = require('../models/Admin');
const Teacher = require('../models/Teacher');
const generateToken = require('../utils/generateToken');

// @desc    Login admin
// @route   POST /api/auth/admin/login
// @access  Public
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(admin._id, 'admin');

    res.json({
      success: true,
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: 'admin',
        schoolName: admin.schoolName,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login teacher
// @route   POST /api/auth/teacher/login
// @access  Public
const teacherLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const teacher = await Teacher.findOne({ email, isActive: true }).select('+password');
    if (!teacher) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await teacher.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(teacher._id, 'teacher');

    res.json({
      success: true,
      token,
      user: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        role: 'teacher',
        subject: teacher.subject,
        assignedClasses: teacher.assignedClasses,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (error) {
    next(error);
  }
};

module.exports = { adminLogin, teacherLogin, getMe };