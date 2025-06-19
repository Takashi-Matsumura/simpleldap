import { NextResponse } from 'next/server';
const UserManager = require('../../../../lib/user-manager');

const userManager = new UserManager();

// POST: ユーザー認証テスト
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: 'Email and password are required'
      }, { status: 400 });
    }

    // UserManagerを使用した認証
    const result = await userManager.authenticateUser(email, password);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}