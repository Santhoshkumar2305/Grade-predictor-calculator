import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/db';
import Prediction from '../../../models/Prediction';
import { authMiddleware } from '../../../utils/authMiddleware';

export const POST = authMiddleware(async (request, context, userId) => {
  try {
    await dbConnect(); 

    const currentUserId = request.userId || userId;
    if (!currentUserId) {
      return NextResponse.json({ message: 'User unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      assessments,
      predictedGrade,
      courseName,
      semester,
      mode,
      targetGrade,
      requiredFinalScore,
    } = body;

    if (!assessments || !Array.isArray(assessments) || assessments.length === 0 || predictedGrade === undefined || isNaN(predictedGrade)) {
      return NextResponse.json({ message: 'Invalid prediction data provided' }, { status: 400 });
    }

    // Sanitize and validate assessment items
    const parsedAssessments = [];
    let totalWeightage = 0;

    for (const item of assessments) {
      const name = item.name ? String(item.name).trim() : '';
      const score = Number(item.score);
      const maxScore = Number(item.maxScore);
      const weightage = Number(item.weightage);

      if (!name) {
        return NextResponse.json({ message: 'All assessments must have a name' }, { status: 400 });
      }
      if (isNaN(score) || score < 0) {
        return NextResponse.json({ message: `Invalid score for assessment "${name}"` }, { status: 400 });
      }
      if (isNaN(maxScore) || maxScore <= 0) {
        return NextResponse.json({ message: `Max score must be greater than 0 for assessment "${name}"` }, { status: 400 });
      }
      if (isNaN(weightage) || weightage < 0 || weightage > 100) {
        return NextResponse.json({ message: `Weightage must be between 0 and 100 for assessment "${name}"` }, { status: 400 });
      }

      totalWeightage += weightage;
      parsedAssessments.push({ name, score, maxScore, weightage });
    }

    if (totalWeightage > 100.01) {
      return NextResponse.json({ message: 'Total weightage cannot exceed 100%' }, { status: 400 });
    }

    const numericPredictedGrade = Math.min(100, Math.max(0, Number(Number(predictedGrade).toFixed(2))));
    const { getGradeDetails } = await import('../../../utils/gradeUtils');
    const gradeDetails = getGradeDetails(numericPredictedGrade);

    const newPrediction = await Prediction.create({
      userId: currentUserId,
      courseName: courseName ? String(courseName).trim() : 'General Coursework',
      semester: semester ? String(semester).trim() : 'Current Semester',
      mode: mode === 'target_planner' ? 'target_planner' : 'weighted',
      assessments: parsedAssessments,
      predictedGrade: numericPredictedGrade,
      targetGrade: targetGrade !== undefined && targetGrade !== null && !isNaN(targetGrade) ? Number(targetGrade) : null,
      requiredFinalScore: requiredFinalScore !== undefined && requiredFinalScore !== null && !isNaN(requiredFinalScore) ? Number(requiredFinalScore) : null,
      letterGrade: gradeDetails.letter,
      cgpa10: Number(gradeDetails.cgpa10),
      gpaScale4: Number(gradeDetails.cgpa10),
    });

    return NextResponse.json({
      message: 'Prediction saved successfully',
      predictionId: newPrediction._id,
      gradeDetails,
    }, { status: 201 });
  } catch (error) {
    console.error('Error saving prediction:', error);
    if (error.name === 'MongooseServerSelectionError' || error.name === 'MongoNetworkError') {
      return NextResponse.json({ message: 'Database connection failed. Please ensure your IP address is whitelisted in MongoDB Atlas or check connection settings.' }, { status: 503 });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return NextResponse.json({ message: messages.join(', ') }, { status: 400 });
    }
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
});
