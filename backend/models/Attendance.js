const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student ID is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['Present', 'Absent', 'Late', 'Excused'],
        message: 'Status must be Present, Absent, Late, or Excused',
      },
      required: [true, 'Status is required'],
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'markedByModel',
    },
    markedByModel: {
      type: String,
      enum: ['Teacher', 'Admin'],
      default: 'Teacher',
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
    class: {
      type: String,
      required: true,
    },
    section: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Compound unique index: one record per student per day
AttendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

// Index for date-range queries
AttendanceSchema.index({ date: 1, class: 1, section: 1 });

module.exports = mongoose.model('Attendance', AttendanceSchema);