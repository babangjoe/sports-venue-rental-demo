import { NextRequest, NextResponse } from 'next/server';
import { readJSON } from '@/lib/json-db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const users = await readJSON('users');
    const userRecord = users.find((u: any) => u.username === username && u.is_active === 1);

    if (!userRecord) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Get role
    const roles = await readJSON('roles');
    const role = roles.find((r: any) => r.id === userRecord.role_id);

    if (!role) {
        console.error('Role not found for user:', userRecord.username);
        return NextResponse.json(
            { error: 'Configuration error: User role not found' },
            { status: 500 }
        );
    }

    const user = {
        ...userRecord,
        role_name: role.role_name,
        role_id: role.id
    };

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role_name,
        roleId: user.role_id
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set HTTP-only cookie
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role_name,
        roleId: user.role_id
      }
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    });

    return response;

  } catch (error) {
    console.error('Login error details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
