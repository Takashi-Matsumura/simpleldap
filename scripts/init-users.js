const UserManager = require('../lib/user-manager');
const fs = require('fs');
const path = require('path');

async function initializeUsers(force = false) {
  console.log('Initializing test users...');
  
  const userManager = new UserManager();

  // 強制リセットオプション
  if (force) {
    console.log('🗑️ Force mode: Removing existing user data...');
    const dataPath = path.join(process.cwd(), 'data', 'users.json');
    if (fs.existsSync(dataPath)) {
      fs.unlinkSync(dataPath);
      console.log('✓ Existing user data removed');
    }
    // UserManagerを再初期化
    userManager.data = { users: {}, config: {} };
  }

  // テストユーザーの定義
  const testUsers = [
    {
      email: 'admin@example.com',
      password: 'admin123',
      attributes: {
        cn: 'Administrator',
        givenName: 'Admin',
        sn: 'User',
        telephoneNumber: '123-456-7890',
        role: 'admin'
      }
    },
    {
      email: 'user@example.com',
      password: 'user123',
      attributes: {
        cn: 'Regular User',
        givenName: 'Regular',
        sn: 'User',
        telephoneNumber: '987-654-3210',
        role: 'user'
      }
    },
    {
      email: 'test@example.com',
      password: 'test123',
      attributes: {
        cn: 'Test User',
        givenName: 'Test',
        sn: 'User',
        role: 'user'
      }
    }
  ];

  try {
    for (const userData of testUsers) {
      try {
        // ユーザーが既に存在するかチェック
        const existingUser = userManager.getUserByEmail(userData.email);
        
        if (existingUser) {
          console.log(`⚠️ User already exists: ${userData.email} (skipping)`);
          continue;
        }

        // ユーザーの追加
        await userManager.addUser(userData.email, userData.password, userData.attributes);
        console.log(`✓ User created: ${userData.email} / ${userData.password}`);
        
      } catch (error) {
        if (error.message === 'User already exists') {
          console.log(`⚠️ User already exists: ${userData.email} (skipping)`);
        } else {
          throw error;
        }
      }
    }

    // 統計情報の表示
    const stats = userManager.getStats();
    console.log('\n📊 User Statistics:');
    console.log(`   Total Users: ${stats.totalUsers}`);
    console.log(`   Admin Users: ${stats.adminUsers}`);
    console.log(`   Regular Users: ${stats.regularUsers}`);

    console.log('\n✅ User initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Error initializing users:', error.message);
    process.exit(1);
  }
}

// コマンドライン引数の処理
function parseArgs() {
  const args = process.argv.slice(2);
  return {
    force: args.includes('--force') || args.includes('-f'),
    help: args.includes('--help') || args.includes('-h')
  };
}

// ヘルプメッセージの表示
function showHelp() {
  console.log(`
📖 init-users.js - Initialize test users for SimpleLDAP

Usage:
  npm run init-users [options]
  node scripts/init-users.js [options]

Options:
  --force, -f    Force reset all user data before initialization
  --help, -h     Show this help message

Examples:
  npm run init-users              # Initialize users (skip existing)
  npm run init-users -- --force   # Reset and initialize all users
  
Default test users:
  admin@example.com / admin123 (Admin)
  user@example.com / user123 (User)
  test@example.com / test123 (User)
`);
}

// スクリプトが直接実行された場合
if (require.main === module) {
  const { force, help } = parseArgs();
  
  if (help) {
    showHelp();
    process.exit(0);
  }
  
  initializeUsers(force);
}

module.exports = { initializeUsers };