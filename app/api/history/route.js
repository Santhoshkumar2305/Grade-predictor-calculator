import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/db';
import Prediction from '../../../models/Prediction';
import { authMiddleware } from '../../../utils/authMiddleware';

export const GET = authMiddleware(async (request, context, userId) => {
  try {
    await dbConnect();

    const currentUserId = request.userId || userId;
    const predictions = await Prediction.find({ userId: currentUserId }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ predictions }, { status: 200 });

  } catch (error) {
    console.error('Error fetching prediction history:', error);
    if (error.name === 'MongooseServerSelectionError' || error.name === 'MongoNetworkError') {
      return NextResponse.json({ message: 'Database connection failed. Please ensure your IP address is whitelisted in MongoDB Atlas or check connection settings.' }, { status: 503 });
    }
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
});