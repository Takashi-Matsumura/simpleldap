import { NextResponse } from 'next/server';
const UserManager = require('../../../../lib/user-manager');

const userManager = new UserManager();

// GET: 全ユーザーの取得
export async function GET() {
  try {
    const users = userManager.getAllUsers();
    const stats = userManager.getStats();

    return NextResponse.json({
      success: true,
      users: Object.keys(users).map(email => ({
        email,
        dn: users[email].dn,
        attributes: users[email].attributes
      })),
      stats
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}

// POST: 新しいユーザーの追加
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, attributes } = body;

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: 'Email and password are required'
      }, { status: 400 });
    }

    const user = await userManager.addUser(email, password, attributes);

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        email,
        dn: user.dn,
        attributes: user.attributes
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 400 });
  }
}