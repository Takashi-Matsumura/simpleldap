import { NextResponse } from 'next/server';
const UserManager = require('../../../../../lib/user-manager');

const userManager = new UserManager();

// GET: 特定ユーザーの取得
export async function GET(request, { params }) {
  try {
    const email = decodeURIComponent(params.email);
    const user = userManager.getUserByEmail(email);

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
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
    }, { status: 500 });
  }
}

// PUT: ユーザー情報の更新
export async function PUT(request, { params }) {
  try {
    const email = decodeURIComponent(params.email);
    const body = await request.json();
    const { password, attributes } = body;

    const updates = {};
    if (password) updates.password = password;
    if (attributes) updates.attributes = attributes;

    const user = await userManager.updateUser(email, updates);

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
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

// DELETE: ユーザーの削除
export async function DELETE(request, { params }) {
  try {
    const email = decodeURIComponent(params.email);
    await userManager.deleteUser(email);

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 400 });
  }
}