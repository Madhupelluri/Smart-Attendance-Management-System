const Student = require('../models/Student');

// @desc    Get all students (with optional class/section filter)
// @route   GET /api/students
// @access  Admin, Teacher
const getStudents = async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.query.class) filter.class = req.query.class;
    if (req.query.section) filter.section = req.query.section;

    const students = await Student.find(filter).sort({ class: 1, section: 1, rollNumber: 1 });
    res.json({ success: true, count: students.length, data: students });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Admin, Teacher
const getStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
};

// @desc    Create student
// @route   POST /api/students
// @access  Admin
const createStudent = async (req, res, next) => {
  try {
    const { rollNumber, name, class: className, section, parentName, parentContact } = req.body;

    const existing = await Student.findOne({ rollNumber });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Roll number already exists' });
    }

    const student = await Student.create({
      rollNumber,
      name,
      class: className,
      section,
      parentName,
      parentContact,
    });

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Admin
const updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const fields = ['rollNumber', 'name', 'section', 'parentName', 'parentContact', 'isActive'];
    fields.forEach((f) => {
      if (typeof req.body[f] !== 'undefined') student[f] = req.body[f];
    });
    if (req.body.class) student.class = req.body.class;

    await student.save();
    res.json({ success: true, message: 'Student updated successfully', data: student });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Admin
const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    await student.deleteOne();
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all unique classes & sections
// @route   GET /api/students/classes
// @access  Admin, Teacher
const getClasses = async (req, res, next) => {
  try {
    const classes = await Student.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: { class: '$class', section: '$section' } } },
      { $sort: { '_id.class': 1, '_id.section': 1 } },
    ]);
    res.json({
      success: true,
      data: classes.map((c) => ({ class: c._id.class, section: c._id.section })),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getStudents, getStudent, createStudent, updateStudent, deleteStudent, getClasses };