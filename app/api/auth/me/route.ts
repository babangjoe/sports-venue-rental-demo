import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { readJSON } from '@/lib/json-db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Get fresh user data from database
    const users = await readJSON('users');
    const userRecord = users.find((u: any) => u.id === decoded.userId && u.is_active === 1);

    if (!userRecord) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    const roles = await readJSON('roles');
    const role = roles.find((r: any) => r.id === userRecord.role_id);

    if (!role) {
         return NextResponse.json(
        { error: 'Role not found' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      user: {
        id: userRecord.id,
        username: userRecord.username,
        email: userRecord.email,
        fullName: userRecord.full_name,
        role: role.role_name,
        roleId: role.id
      }
    });

  } catch (error) {
    console.error('Auth verification error:', error);
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }
}
