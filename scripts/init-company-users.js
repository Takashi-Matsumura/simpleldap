const UserManager = require('../lib/user-manager');
const fs = require('fs');
const path = require('path');

async function initializeCompanyUsers(force = false) {
  console.log('🏢 Initializing company employees...');
  
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

  // 社員データの定義
  const companyEmployees = [
    {
      email: 'ceo@company.com',
      password: 'ceo123',
      attributes: {
        cn: '田中社長',
        givenName: '太郎',
        sn: '田中',
        role: 'admin',
        employeeNumber: 'CEO001',
        department: '経営陣',
        division: '本社',
        title: '代表取締役社長',
        employeeType: '役員',
        telephoneNumber: '03-1234-0001',
        mobile: '080-0001-0001',
        physicalDeliveryOfficeName: '東京本社',
        costCenter: 'CC-EXEC-001',
        hireDate: '2015-01-01',
        jobCode: 'CEO'
      }
    },
    {
      email: 'sales.director@company.com',
      password: 'sales123',
      attributes: {
        cn: '佐藤営業部長',
        givenName: '次郎',
        sn: '佐藤',
        role: 'manager',
        employeeNumber: 'MGR001',
        department: '営業部',
        division: '営業本部',
        title: '営業部長',
        manager: 'cn=田中社長,ou=users,dc=company,dc=com',
        employeeType: '正社員',
        telephoneNumber: '03-1234-0002',
        mobile: '080-0002-0002',
        physicalDeliveryOfficeName: '東京本社',
        costCenter: 'CC-SALES-001',
        hireDate: '2016-04-01',
        jobCode: 'SALES-DIR'
      }
    },
    {
      email: 'tanaka.sales@company.com',
      password: 'tanaka123',
      attributes: {
        cn: '田中営業課長',
        givenName: '三郎',
        sn: '田中',
        role: 'employee',
        employeeNumber: 'EMP001',
        department: '営業部',
        division: '営業本部',
        title: '営業課長',
        manager: 'cn=佐藤営業部長,ou=users,dc=company,dc=com',
        employeeType: '正社員',
        telephoneNumber: '03-1234-0101',
        mobile: '080-0101-0101',
        physicalDeliveryOfficeName: '東京本社',
        costCenter: 'CC-SALES-001',
        hireDate: '2018-07-15',
        jobCode: 'SALES-MGR'
      }
    },
    {
      email: 'yamada.sales@company.com',
      password: 'yamada123',
      attributes: {
        cn: '山田営業担当',
        givenName: '花子',
        sn: '山田',
        role: 'employee',
        employeeNumber: 'EMP002',
        department: '営業部',
        division: '営業本部',
        title: '営業担当',
        manager: 'cn=田中営業課長,ou=users,dc=company,dc=com',
        employeeType: '正社員',
        telephoneNumber: '03-1234-0102',
        mobile: '080-0102-0102',
        physicalDeliveryOfficeName: '東京本社',
        costCenter: 'CC-SALES-001',
        hireDate: '2020-04-01',
        jobCode: 'SALES-STAFF'
      }
    },
    {
      email: 'hr.manager@company.com',
      password: 'hr123',
      attributes: {
        cn: '鈴木人事部長',
        givenName: '一郎',
        sn: '鈴木',
        role: 'manager',
        employeeNumber: 'MGR002',
        department: '人事部',
        division: '管理本部',
        title: '人事部長',
        manager: 'cn=田中社長,ou=users,dc=company,dc=com',
        employeeType: '正社員',
        telephoneNumber: '03-1234-0003',
        mobile: '080-0003-0003',
        physicalDeliveryOfficeName: '東京本社',
        costCenter: 'CC-HR-001',
        hireDate: '2017-01-15',
        jobCode: 'HR-DIR',
        certifications: ['人事労務管理士', '社会保険労務士']
      }
    },
    {
      email: 'sato.hr@company.com',
      password: 'sato123',
      attributes: {
        cn: '佐藤人事担当',
        givenName: '美咲',
        sn: '佐藤',
        role: 'employee',
        employeeNumber: 'EMP003',
        department: '人事部',
        division: '管理本部',
        title: '人事担当',
        manager: 'cn=鈴木人事部長,ou=users,dc=company,dc=com',
        employeeType: '正社員',
        telephoneNumber: '03-1234-0201',
        mobile: '080-0201-0201',
        physicalDeliveryOfficeName: '東京本社',
        costCenter: 'CC-HR-001',
        hireDate: '2019-10-01',
        jobCode: 'HR-STAFF'
      }
    },
    {
      email: 'it.manager@company.com',
      password: 'it123',
      attributes: {
        cn: '高橋IT部長',
        givenName: '健太',
        sn: '高橋',
        role: 'manager',
        employeeNumber: 'MGR003',
        department: 'IT部',
        division: '技術本部',
        title: 'IT部長',
        manager: 'cn=田中社長,ou=users,dc=company,dc=com',
        employeeType: '正社員',
        telephoneNumber: '03-1234-0004',
        mobile: '080-0004-0004',
        physicalDeliveryOfficeName: '東京本社',
        costCenter: 'CC-IT-001',
        hireDate: '2016-08-01',
        jobCode: 'IT-DIR'
      }
    },
    {
      email: 'dev.lead@company.com',
      password: 'dev123',
      attributes: {
        cn: '伊藤開発リーダー',
        givenName: '拓也',
        sn: '伊藤',
        role: 'employee',
        employeeNumber: 'EMP004',
        department: 'IT部',
        division: '技術本部',
        title: '開発リーダー',
        manager: 'cn=高橋IT部長,ou=users,dc=company,dc=com',
        employeeType: '正社員',
        telephoneNumber: '03-1234-0301',
        mobile: '080-0301-0301',
        physicalDeliveryOfficeName: '東京本社',
        costCenter: 'CC-IT-001',
        hireDate: '2018-03-15',
        jobCode: 'DEV-LEAD'
      }
    },
    {
      email: 'contract.dev@company.com',
      password: 'contract123',
      attributes: {
        cn: '森契約エンジニア',
        givenName: '隆',
        sn: '森',
        role: 'employee',
        employeeNumber: 'CON001',
        department: 'IT部',
        division: '技術本部',
        title: 'エンジニア',
        manager: 'cn=伊藤開発リーダー,ou=users,dc=company,dc=com',
        employeeType: '契約社員',
        telephoneNumber: '03-1234-0302',
        mobile: '080-0302-0302',
        physicalDeliveryOfficeName: '東京本社',
        costCenter: 'CC-IT-001',
        hireDate: '2021-06-01',
        jobCode: 'DEV-ENG',
        contractEndDate: '2024-05-31'
      }
    },
    {
      email: 'osaka.sales@company.com',
      password: 'osaka123',
      attributes: {
        cn: '大阪営業所長',
        givenName: '次郎',
        sn: '大阪',
        role: 'manager',
        employeeNumber: 'OSA001',
        department: '営業部',
        division: '関西支社',
        title: '営業所長',
        manager: 'cn=佐藤営業部長,ou=users,dc=company,dc=com',
        employeeType: '正社員',
        telephoneNumber: '06-1234-0001',
        mobile: '080-0501-0501',
        physicalDeliveryOfficeName: '大阪支社',
        postalAddress: '大阪府大阪市北区梅田1-1-1',
        costCenter: 'CC-SALES-OSA',
        hireDate: '2017-10-01',
        jobCode: 'SALES-MGR'
      }
    }
  ];

  try {
    for (const employeeData of companyEmployees) {
      try {
        // ユーザーが既に存在するかチェック
        const existingUser = userManager.getUserByEmail(employeeData.email);
        
        if (existingUser) {
          console.log(`⚠️ Employee already exists: ${employeeData.email} (skipping)`);
          continue;
        }

        // 社員の追加
        await userManager.addUser(employeeData.email, employeeData.password, employeeData.attributes);
        console.log(`✓ Employee created: ${employeeData.email} (${employeeData.attributes.cn})`);
        
      } catch (error) {
        if (error.message === 'User already exists') {
          console.log(`⚠️ Employee already exists: ${employeeData.email} (skipping)`);
        } else {
          throw error;
        }
      }
    }

    // 統計情報の表示
    const stats = userManager.getStats();
    console.log('\n📊 Company Statistics:');
    console.log(`   Total Employees: ${stats.totalUsers}`);
    console.log(`   Managers/Admins: ${stats.adminUsers}`);
    console.log(`   Regular Employees: ${stats.regularUsers}`);

    // 部署別統計
    const users = userManager.getAllUsers();
    const departments = {};
    const divisions = {};
    
    Object.values(users).forEach(user => {
      const dept = user.attributes.department || '未分類';
      const div = user.attributes.division || '未分類';
      departments[dept] = (departments[dept] || 0) + 1;
      divisions[div] = (divisions[div] || 0) + 1;
    });

    console.log('\n🏢 Department Statistics:');
    Object.entries(departments).forEach(([dept, count]) => {
      console.log(`   ${dept}: ${count}名`);
    });

    console.log('\n🏭 Division Statistics:');
    Object.entries(divisions).forEach(([div, count]) => {
      console.log(`   ${div}: ${count}名`);
    });

    console.log('\n✅ Company employee initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Error initializing company employees:', error.message);
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
📖 init-company-users.js - Initialize company employees for SimpleLDAP

Usage:
  npm run init-company-users [options]
  node scripts/init-company-users.js [options]

Options:
  --force, -f    Force reset all user data before initialization
  --help, -h     Show this help message

Examples:
  npm run init-company-users              # Initialize employees (skip existing)
  npm run init-company-users -- --force   # Reset and initialize all employees
  
Sample employees:
  CEO:           ceo@company.com / ceo123
  Sales Dir:     sales.director@company.com / sales123
  Sales Staff:   tanaka.sales@company.com / tanaka123
  HR Manager:    hr.manager@company.com / hr123
  IT Manager:    it.manager@company.com / it123
  Developer:     dev.lead@company.com / dev123
`);
}

// スクリプトが直接実行された場合
if (require.main === module) {
  const { force, help } = parseArgs();
  
  if (help) {
    showHelp();
    process.exit(0);
  }
  
  initializeCompanyUsers(force);
}

module.exports = { initializeCompanyUsers };