const SimpleLDAPClient = require('../lib/ldap-client');

async function testAuthentication() {
  console.log('🧪 Starting LDAP Authentication Tests...');
  console.log('');

  const client = new SimpleLDAPClient({
    url: 'ldap://127.0.0.1:3389',
    baseDN: 'dc=example,dc=com',
    usersDN: 'ou=users,dc=example,dc=com'
  });

  // テストケース
  const testCases = [
    { email: 'admin@example.com', password: 'admin123', expected: true },
    { email: 'user@example.com', password: 'user123', expected: true },
    { email: 'test@example.com', password: 'test123', expected: true },
    { email: 'admin@example.com', password: 'wrongpassword', expected: false },
    { email: 'nonexistent@example.com', password: 'password', expected: false }
  ];

  console.log('📋 Test Cases:');
  testCases.forEach((test, index) => {
    console.log(`   ${index + 1}. ${test.email} / ${test.password} (Expected: ${test.expected ? 'SUCCESS' : 'FAIL'})`);
  });
  console.log('');

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < testCases.length; i++) {
    const test = testCases[i];
    console.log(`🔬 Test ${i + 1}: ${test.email}`);
    
    try {
      const result = await client.authenticateAndGetUser(test.email, test.password);
      
      if (result.success === test.expected) {
        console.log(`   ✅ PASS - ${result.message}`);
        if (result.success && result.user) {
          console.log(`   👤 User: ${result.user.attributes.cn} (${result.user.attributes.role})`);
        }
        passed++;
      } else {
        console.log(`   ❌ FAIL - Expected ${test.expected ? 'success' : 'failure'}, got ${result.success ? 'success' : 'failure'}`);
        console.log(`   📝 Message: ${result.message}`);
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ ERROR - ${error.message}`);
      failed++;
    }
    
    console.log('');
  }

  // 結果サマリー
  console.log('📊 Test Results:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  // 接続を切断
  client.disconnect();

  if (failed === 0) {
    console.log('');
    console.log('🎉 All tests passed! LDAP authentication is working correctly.');
    process.exit(0);
  } else {
    console.log('');
    console.log('⚠️ Some tests failed. Please check the LDAP server configuration.');
    process.exit(1);
  }
}

// 別のプロセスで実行用のテスト
async function testUserSearch() {
  console.log('🔍 Starting LDAP User Search Tests...');
  console.log('');

  const client = new SimpleLDAPClient();

  try {
    // 全ユーザー検索
    console.log('🔍 Searching for all users...');
    const allUsers = await client.searchAllUsers();
    
    if (allUsers.success) {
      console.log(`✅ Found ${allUsers.users.length} users:`);
      allUsers.users.forEach(user => {
        console.log(`   👤 ${user.attributes.cn} (${user.attributes.mail}) - ${user.attributes.role}`);
      });
    } else {
      console.log(`❌ Search failed: ${allUsers.message}`);
    }

    console.log('');

    // 特定ユーザー検索
    console.log('🔍 Searching for specific user...');
    const userSearch = await client.searchUser('admin@example.com');
    
    if (userSearch.success && userSearch.users.length > 0) {
      const user = userSearch.users[0];
      console.log(`✅ Found user: ${user.attributes.cn}`);
      console.log(`   📧 Email: ${user.attributes.mail}`);
      console.log(`   👤 Name: ${user.attributes.givenName} ${user.attributes.sn}`);
      console.log(`   📞 Phone: ${user.attributes.telephoneNumber || 'N/A'}`);
      console.log(`   🏷️ Role: ${user.attributes.role}`);
    } else {
      console.log(`❌ User search failed: ${userSearch.message}`);
    }

  } catch (error) {
    console.error('❌ Search test error:', error);
  }

  client.disconnect();
}

// コマンドライン引数の処理
const args = process.argv.slice(2);
const testType = args[0] || 'auth';

if (require.main === module) {
  if (testType === 'search') {
    testUserSearch();
  } else {
    testAuthentication();
  }
}

module.exports = { testAuthentication, testUserSearch };