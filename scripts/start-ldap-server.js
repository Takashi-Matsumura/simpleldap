const SimpleLDAPServer = require('../lib/ldap-server');

async function startServer() {
  console.log('🔧 Starting Simple LDAP Server...');
  
  const ldapServer = new SimpleLDAPServer({
    port: 3389,
    baseDN: 'dc=example,dc=com',
    usersDN: 'ou=users,dc=example,dc=com'
  });

  try {
    await ldapServer.start();
    
    console.log('');
    console.log('🌟 LDAP Server is ready!');
    console.log('');
    console.log('📝 Test credentials:');
    console.log('   Admin: admin@example.com / admin123');
    console.log('   User:  user@example.com / user123');
    console.log('   Test:  test@example.com / test123');
    console.log('');
    console.log('🔗 Connection details:');
    console.log('   Host: localhost');
    console.log('   Port: 3389');
    console.log('   Base DN: dc=example,dc=com');
    console.log('   Users DN: ou=users,dc=example,dc=com');
    console.log('');
    console.log('⚡ Press Ctrl+C to stop the server');

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\\n🛑 Shutting down LDAP server...');
      await ldapServer.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\\n🛑 Shutting down LDAP server...');
      await ldapServer.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start LDAP server:', error.message);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合
if (require.main === module) {
  startServer();
}

module.exports = { startServer };