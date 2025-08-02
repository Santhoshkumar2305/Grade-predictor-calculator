import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db';
import Prediction from '../../../../models/Prediction';
import { authMiddleware } from '../../../../utils/authMiddleware';
import mongoose from 'mongoose';

export const DELETE = authMiddleware(async (request, { params }, userId) => {
  await dbConnect();

  try {
    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid prediction ID' }, { status: 400 });
    }
    const deletedPrediction = await Prediction.findOneAndDelete({
      _id: id,
      userId: userId,
    });
    if (!deletedPrediction) {
      return NextResponse.json({ message: 'Prediction not found or you do not have permission to delete it' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Prediction deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting prediction:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
});