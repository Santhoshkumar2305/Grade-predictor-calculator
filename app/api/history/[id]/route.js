import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import Prediction from '../../../../models/Prediction';
import { authMiddleware } from '../../../../utils/authMiddleware';
import mongoose from 'mongoose';

export const DELETE = authMiddleware(async (request, context, userId) => {
  try {
    await dbConnect();

    const params = context?.params ? await context.params : {};
    const { id } = params;
    const currentUserId = request.userId || userId;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid prediction ID' }, { status: 400 });
    }
    const deletedPrediction = await Prediction.findOneAndDelete({
      _id: id,
      userId: currentUserId,
    });
    if (!deletedPrediction) {
      return NextResponse.json({ message: 'Prediction not found or you do not have permission to delete it' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Prediction deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting prediction:', error);
    if (error.name === 'MongooseServerSelectionError' || error.name === 'MongoNetworkError') {
      return NextResponse.json({ message: 'Database connection failed. Please ensure your IP address is whitelisted in MongoDB Atlas or check connection settings.' }, { status: 503 });
    }
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
});

export const PUT = authMiddleware(async (request, context, userId) => {
  try {
    await dbConnect();

    const params = context?.params ? await context.params : {};
    const { id } = params;
    const currentUserId = request.userId || userId;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid prediction ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      courseName,
      semester,
      mode,
      assessments,
      predictedGrade,
      targetGrade,
      requiredFinalScore,
    } = body;

    if (!assessments || !Array.isArray(assessments) || assessments.length === 0 || predictedGrade === undefined || isNaN(predictedGrade)) {
      return NextResponse.json({ message: 'Invalid audit data provided' }, { status: 400 });
    }

    // Sanitize assessments
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
    const { getGradeDetails } = await import('../../../../utils/gradeUtils');
    const gradeDetails = getGradeDetails(numericPredictedGrade);

    const updated = await Prediction.findOneAndUpdate(
      { _id: id, userId: currentUserId },
      {
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
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json({ message: 'Audit not found or you do not have permission to edit it' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Audit updated successfully', prediction: updated }, { status: 200 });
  } catch (error) {
    console.error('Error updating prediction:', error);
    if (error.name === 'MongooseServerSelectionError' || error.name === 'MongoNetworkError') {
      return NextResponse.json({ message: 'Database connection failed. Please ensure your IP address is whitelisted in MongoDB Atlas or check connection settings.' }, { status: 503 });
    }
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
});