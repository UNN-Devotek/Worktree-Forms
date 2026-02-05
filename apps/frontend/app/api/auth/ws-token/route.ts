import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import jwt from 'jsonwebtoken';

// @ts-ignore
export const GET = auth(async (req: any) => {
  if (!req.auth || !req.auth.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use the same JWT_SECRET as backend
  const secret = process.env.JWT_SECRET;
  if (!secret) {
      console.error("JWT_SECRET missing in frontend env");
      return NextResponse.json({ error: 'Server Config Error' }, { status: 500 });
  }

  // Sign a short-lived token for WebSocket connection
  // Payload compatible with what ws-server expects or logs
  const token = jwt.sign(
    { 
        sub: req.auth.user.id,
        name: req.auth.user.name,
        email: req.auth.user.email,
        type: 'ws-auth'
    },
    secret,
    { expiresIn: '1m' } // Valid for 1 minute (connect time)
  );

  return NextResponse.json({ token });
});
