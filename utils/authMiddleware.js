import { verifyToken } from "./jwt";
import { NextResponse } from "next/server";

export function authMiddleware(handler) {
  return async (req, ...args) => {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "No token provided or invalid token format" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { message: "Unauthorized: Invalid or expired token" },
        { status: 401 }
      );
    }
    req.userId = decoded.userId;

    return handler(req, ...args, decoded.userId);
  };
}