# LDAP調査レポート

## 1. LDAPとは

### 1.1 基本概念
LDAP（Lightweight Directory Access Protocol）は、ネットワーク上のユーザー情報や機器情報などを管理する「ディレクトリサービス」にアクセスするための標準プロトコルです。

**ディレクトリサービス**とは：
- ネットワーク上の様々なリソース（ユーザー、機器、サービスなど）の情報を一元管理する仕組み
- 電話帳のような階層的なデータ構造で情報を管理
- 読み取りが多く、書き込みが少ない用途に最適化されている

### 1.2 歴史と背景
- 1990年代初頭に開発
- ITU-T勧告のX.500 Directory Access Protocolの軽量版として設計
- TCP/IPネットワーク上で動作するよう設計され、インターネットの普及とともに広まった

## 2. LDAPの技術的な仕組み

### 2.1 プロトコルの動作
1. **接続**: クライアントはTCP/UDPポート389（通常）または636（LDAPS）でLDAPサーバーに接続
2. **認証**: シンプル認証（ユーザー名/パスワード）またはSASL（Kerberosなど）で認証
3. **操作**: クライアントは操作要求を送信し、サーバーはレスポンスを返す
4. **非同期通信**: クライアントは複数のリクエストを同時に送信可能

### 2.2 データ構造
LDAPはツリー構造（DIT: Directory Information Tree）でデータを管理：

```
dc=example,dc=com                    # ドメインコンポーネント（ルート）
├── ou=users                        # 組織単位
│   ├── cn=john.doe                 # 共通名（ユーザー）
│   └── cn=jane.smith
└── ou=groups
    └── cn=administrators
```

**主な属性タイプ**：
- **dc** (Domain Component): ドメイン名の構成要素
- **ou** (Organizational Unit): 組織単位
- **cn** (Common Name): 共通名
- **uid** (User ID): ユーザーID
- **mail**: メールアドレス
- **sn** (Surname): 姓
- **givenName**: 名

### 2.3 主な操作
- **bind**: サーバーへの認証
- **search**: エントリの検索
- **add**: 新しいエントリの追加
- **delete**: エントリの削除
- **modify**: エントリの属性を変更
- **compare**: エントリの属性値を比較

### 2.4 LDIF形式
LDIF（LDAP Data Interchange Format）は、LDAPデータを表現するテキスト形式：

```ldif
dn: cn=john.doe,ou=users,dc=example,dc=com
objectClass: inetOrgPerson
cn: john.doe
sn: Doe
givenName: John
mail: john.doe@example.com
uid: jdoe
```

## 3. セキュリティ

### 3.1 認証方式
- **匿名バインド**: 認証なし（読み取り専用アクセスに使用）
- **シンプルバインド**: ユーザー名とパスワードで認証
- **SASL**: より高度な認証メカニズム（Kerberos、DIGEST-MD5など）

### 3.2 暗号化
- **LDAPS**: SSL/TLSを使用した暗号化通信（ポート636）
- **StartTLS**: 既存の接続をTLSで暗号化

## 4. 実装方法（Node.js）

### 4.1 利用可能なライブラリ
1. **ldapjs**: 最も人気のあるNode.js用LDAPライブラリ
   - クライアント/サーバー両方の機能を提供
   - Express.jsのようなAPI設計
   - イベント駆動型アーキテクチャ

2. **ldap-authentication**: シンプルな認証に特化したライブラリ
3. **ldapts**: TypeScript対応のLDAPクライアント

### 4.2 ldapjsの基本的な使い方

**インストール**:
```bash
npm install ldapjs
```

**基本的なクライアントコード例**:
```javascript
const ldap = require('ldapjs');

// クライアントの作成
const client = ldap.createClient({
  url: 'ldap://localhost:389'
});

// サーバーへの接続（バインド）
client.bind('cn=admin,dc=example,dc=com', 'password', (err) => {
  if (err) {
    console.error('Bind error:', err);
    return;
  }
  
  // ユーザーの検索
  const opts = {
    filter: '(uid=jdoe)',
    scope: 'sub',
    attributes: ['cn', 'mail']
  };
  
  client.search('ou=users,dc=example,dc=com', opts, (err, res) => {
    res.on('searchEntry', (entry) => {
      console.log('Found:', entry.object);
    });
  });
});
```

## 5. 実用例とユースケース

### 5.1 一般的な用途
1. **統合認証システム**: 
   - Active Directory
   - OpenLDAP
   - 企業の統合認証基盤

2. **アプリケーション連携**:
   - メールサーバー
   - VPNサーバー
   - Webアプリケーション

3. **デバイス管理**:
   - ネットワーク機器の設定管理
   - プリンターの管理

### 5.2 メリット
- 標準化されたプロトコル
- 階層的なデータ構造で組織構造を自然に表現
- 読み取り性能が高い
- 複数のアプリケーションで共有可能

### 5.3 デメリット
- 書き込み性能は相対的に低い
- 複雑なクエリには向かない
- スキーマ定義が厳格

## 6. 簡単なLDAP実装プロジェクトの方向性

このプロジェクトでは、以下のような簡単なLDAPサーバー/クライアントを実装することを提案します：

### 6.1 実装内容案
1. **簡易LDAPサーバー**:
   - メモリベースのユーザーストレージ
   - 基本的な認証機能
   - ユーザーの追加/検索/更新/削除

2. **管理用Webインターフェース**:
   - Next.jsを使用したWebUI
   - ユーザー一覧表示
   - ユーザー情報の編集
   - LDAP接続テスト機能

3. **認証デモ**:
   - LDAPを使用したログイン機能
   - セッション管理
   - アクセス制御のデモ

### 6.2 技術スタック
- **バックエンド**: Node.js + ldapjs
- **フロントエンド**: Next.js（既存のプロジェクト）
- **データストレージ**: メモリ（開発用）またはJSONファイル
- **API**: REST APIまたはNext.js API Routes

このような実装により、LDAPの基本的な概念と動作を理解しながら、実用的なアプリケーションを作成できます。