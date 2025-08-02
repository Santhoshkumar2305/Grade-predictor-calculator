import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/db';
import Prediction from '../../../models/Prediction';
import { authMiddleware } from '../../../utils/authMiddleware';

export const GET = authMiddleware(async (request, context, userId) => {
  await dbConnect();

  try {
    const predictions = await Prediction.find({ userId: userId }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ predictions }, { status: 200 });

  } catch (error) {
    console.error('Error fetching prediction history:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
});