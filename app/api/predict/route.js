import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/db';
import Prediction from '../../../models/Prediction';
import { authMiddleware } from '../../../utils/authMiddleware';

export const POST = authMiddleware(async (request, context, userId) => {
  await dbConnect(); 

  try {
    const { assessments, predictedGrade } = await request.json();
    if (!assessments || !Array.isArray(assessments) || assessments.length === 0 || predictedGrade === undefined) {
      return NextResponse.json({ message: 'Invalid prediction data provided' }, { status: 400 });
    }
    const newPrediction = await Prediction.create({
      userId: userId,
      assessments,
      predictedGrade,
    });
    return NextResponse.json({ message: 'Prediction saved successfully', predictionId: newPrediction._id }, { status: 201 });
  } catch (error) {
    console.error('Error saving prediction:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return NextResponse.json({ message: messages.join(', ') }, { status: 400 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
});
