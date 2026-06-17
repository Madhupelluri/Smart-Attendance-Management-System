const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const Admin = require('../models/Admin');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');

const connectDB = require('../config/db');

const seed = async () => {
  await connectDB();

  try {
    // Clear existing data
    await Promise.all([
      Admin.deleteMany({}),
      Teacher.deleteMany({}),
      Student.deleteMany({}),
      Attendance.deleteMany({}),
    ]);
    console.log('🗑  Cleared existing data');

    // Create Admin
    const admin = await Admin.create({
      name: 'Principal Sharma',
      email: 'admin@smartschool.edu',
      password: 'admin123',
      schoolName: 'Smart Public School',
    });
    console.log('✅ Admin created:', admin.email);

    // Create Teachers
    const teachersData = [
      { name: 'Mrs. Priya Mehta', email: 'priya@smartschool.edu', password: 'teacher123', subject: 'Mathematics', assignedClasses: [{ class: '10', section: 'A' }, { class: '10', section: 'B' }] },
      { name: 'Mr. Rajesh Kumar', email: 'rajesh@smartschool.edu', password: 'teacher123', subject: 'Science', assignedClasses: [{ class: '9', section: 'A' }, { class: '9', section: 'B' }] },
      { name: 'Ms. Anita Singh', email: 'anita@smartschool.edu', password: 'teacher123', subject: 'English', assignedClasses: [{ class: '8', section: 'A' }] },
    ];
    const teachers = await Teacher.create(teachersData);
    console.log(`✅ ${teachers.length} teachers created`);

    // Create Students
    const studentsData = [
      // Class 10-A
      { rollNumber: '10A01', name: 'Aarav Patel', class: '10', section: 'A' },
      { rollNumber: '10A02', name: 'Diya Sharma', class: '10', section: 'A' },
      { rollNumber: '10A03', name: 'Rohan Verma', class: '10', section: 'A' },
      { rollNumber: '10A04', name: 'Priya Nair', class: '10', section: 'A' },
      { rollNumber: '10A05', name: 'Arjun Gupta', class: '10', section: 'A' },
      // Class 10-B
      { rollNumber: '10B01', name: 'Kavya Reddy', class: '10', section: 'B' },
      { rollNumber: '10B02', name: 'Siddharth Joshi', class: '10', section: 'B' },
      { rollNumber: '10B03', name: 'Neha Iyer', class: '10', section: 'B' },
      // Class 9-A
      { rollNumber: '9A01', name: 'Vikas Mishra', class: '9', section: 'A' },
      { rollNumber: '9A02', name: 'Ananya Pillai', class: '9', section: 'A' },
      { rollNumber: '9A03', name: 'Karan Singh', class: '9', section: 'A' },
      { rollNumber: '9A04', name: 'Meera Krishnan', class: '9', section: 'A' },
      // Class 9-B
      { rollNumber: '9B01', name: 'Aditya Rao', class: '9', section: 'B' },
      { rollNumber: '9B02', name: 'Shreya Desai', class: '9', section: 'B' },
      // Class 8-A
      { rollNumber: '8A01', name: 'Nikhil Tiwari', class: '8', section: 'A' },
      { rollNumber: '8A02', name: 'Ishaan Kapoor', class: '8', section: 'A' },
      { rollNumber: '8A03', name: 'Tanvi Bhat', class: '8', section: 'A' },
    ];
    const students = await Student.create(studentsData);
    console.log(`✅ ${students.length} students created`);

    // Create Attendance for the last 10 days
    const attendanceData = [];
    const statuses = ['Present', 'Present', 'Present', 'Present', 'Absent']; // 80% present rate

    for (let dayOffset = 9; dayOffset >= 0; dayOffset--) {
      const date = new Date();
      date.setDate(date.getDate() - dayOffset);
      date.setHours(0, 0, 0, 0);

      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      for (const student of students) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        attendanceData.push({
          studentId: student._id,
          date,
          status,
          class: student.class,
          section: student.section,
          markedBy: teachers[0]._id,
          markedByModel: 'Teacher',
        });
      }
    }

    await Attendance.insertMany(attendanceData, { ordered: false });
    console.log(`✅ ${attendanceData.length} attendance records created`);

    console.log('\n🎉 Seeding completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin  → Email: admin@smartschool.edu   | Password: admin123');
    console.log('Teacher→ Email: priya@smartschool.edu   | Password: teacher123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  }
};

seed();