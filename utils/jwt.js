import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export function signToken(payload, expiresIn = '1d') {
  if (!JWT_SECRET)
    throw new Error('JWT_SECRET is not defined in environment variables.');
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token) {
  if (!JWT_SECRET)
    throw new Error('JWT_SECRET is not defined in environment variables.');
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    return null;
  }
}
