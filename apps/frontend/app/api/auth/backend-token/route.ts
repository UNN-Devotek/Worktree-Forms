import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import jwt from 'jsonwebtoken';

const isProduction = process.env.NODE_ENV === 'production';

// @ts-ignore
export const GET = auth(async (req: any) => {
  if (!req.auth || !req.auth.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET missing in frontend env');
    return NextResponse.json({ error: 'Server Config Error' }, { status: 500 });
  }

  // Sign a backend-compatible JWT (same payload shape the backend authenticate middleware expects)
  const token = jwt.sign(
    {
      sub: req.auth.user.id,
      email: req.auth.user.email,
      systemRole: req.auth.user.systemRole || 'MEMBER',
    },
    secret,
    { algorithm: 'HS256', expiresIn: '15m' }
  );

  const response = NextResponse.json({ success: true });
  response.cookies.set('access_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60,
    secure: isProduction,
  });

  return response;
});
