import mongoose from 'mongoose';

const AssessmentItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Assessment name is required'],
    trim: true,
  },
  score: {
    type: Number,
    required: [true, 'Score is required'],
    min: [0, 'Score cannot be negative'],
  },
  maxScore: {
    type: Number,
    required: [true, 'Max score is required'],
    min: [1, 'Max score must be at least 1'],
  },
  weightage: {
    type: Number,
    required: [true, 'Weightage is required'],
    min: [0, 'Weightage cannot be negative'],
    max: [100, 'Weightage cannot exceed 100'],
  },
}, { _id: false });

const PredictionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  courseName: {
    type: String,
    default: 'General Coursework',
    trim: true,
  },
  semester: {
    type: String,
    default: 'Current Semester',
    trim: true,
  },
  mode: {
    type: String,
    enum: ['weighted', 'target_planner'],
    default: 'weighted',
  },
  assessments: {
    type: [AssessmentItemSchema],
    required: true,
    validate: {
      validator: function(v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: 'At least one assessment is required for a prediction',
    },
  },
  predictedGrade: {
    type: Number,
    required: true,
    min: [0, 'Predicted grade cannot be negative'],
    max: [100, 'Predicted grade cannot exceed 100'],
  },
  targetGrade: {
    type: Number,
    default: null,
  },
  requiredFinalScore: {
    type: Number,
    default: null,
  },
  letterGrade: {
    type: String,
    default: 'N/A',
  },
  cgpa10: {
    type: Number,
    default: 0,
  },
  gpaScale4: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
export default mongoose.models.Prediction || mongoose.model('Prediction', PredictionSchema);
