const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { adminLogin, teacherLogin, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/admin/login', loginValidation, validate, adminLogin);
router.post('/teacher/login', loginValidation, validate, teacherLogin);
router.get('/me', protect, getMe);

module.exports = router;