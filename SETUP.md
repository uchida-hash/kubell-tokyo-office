# Belle Office セットアップ手順

## 1. 依存パッケージのインストール

```bash
cd belle-office
npm install
```

## 2. Firebase プロジェクトの設定

### 2-1. Firebase プロジェクト作成
1. [Firebase Console](https://console.firebase.google.com/) でプロジェクトを新規作成
2. **Firestore** を有効化（本番モードで作成）
3. **Authentication** > Google プロバイダーを有効化

### 2-2. Firestore セキュリティルールを適用
```bash
npm install -g firebase-tools
firebase login
firebase init firestore
# firebase.json と .firestore.rules を設定
firebase deploy --only firestore:rules
```

### 2-3. Firebase Admin SDK の鍵を取得
1. Firebase Console > プロジェクト設定 > サービスアカウント
2. 「新しい秘密鍵を生成」でJSONをダウンロード
3. JSONの内容を `.env.local` に転記

## 3. Google Cloud Console の設定

### 3-1. OAuth 2.0 クライアントID の作成
1. [GCP Console](https://console.cloud.google.com/) でプロジェクトを選択
2. APIs & Services > 認証情報 > 認証情報を作成 > OAuth クライアントID
3. アプリケーションの種類: **ウェブアプリケーション**
4. 承認済みリダイレクト URI に追加:
   - `http://localhost:3000/api/auth/callback/google`（開発）
   - `https://your-app.vercel.app/api/auth/callback/google`（本番）

### 3-2. Google Calendar API を有効化
1. APIs & Services > ライブラリ > 「Google Calendar API」を有効化
2. 社内共有カレンダーを作成し、サービスアカウントに「閲覧者」権限を付与
3. カレンダーIDを `.env.local` の `GOOGLE_CALENDAR_ID` に設定

## 4. 環境変数の設定

```bash
cp .env.local.example .env.local
# エディタで .env.local を開き、各値を設定
```

## 5. ローカル開発サーバーの起動

```bash
npm run dev
# http://localhost:3000 でアクセス
```

## 6. 最初の管理者ユーザーを設定

アプリにログイン後、Firebase Consoleから手動でisAdminを設定:

```
Firestore > users > {your-email} > isAdmin: true
```

## 7. Vercel へのデプロイ

```bash
npm install -g vercel
vercel
# 環境変数を Vercel ダッシュボードで設定
```

または GitHub にプッシュして Vercel の自動デプロイを使用。

## 8. Chatwork Webhook の設定

1. Chatwork 管理者画面 > Outgoing Webhook
2. 監視するルームを選択
3. Webhook URL: `https://your-app.vercel.app/api/chatwork/webhook`
4. トークンを `.env.local` の `CHATWORK_WEBHOOK_TOKEN` に設定
5. 管理者パネル > ユーザー管理で各ユーザーの Chatwork Account ID を設定
   - Chatwork Account ID: アカウント設定 > プロフィールのURLの数字

## 9. miive ポイントの設定

miive は現在公式 API を公開していないため、手動更新が必要です。

Firebase Console > Firestore > `miive/{employee_email}`:
```json
{
  "point": 5000,
  "expirePoint": 1000,
  "expireDate": "2026-03-31",
  "updatedAt": "2026-03-31T09:00:00.000Z"
}
```

## Firestore コレクション構造

```
users/{email}
  - uid: string (= email)
  - name: string
  - email: string
  - photo: string
  - department: string
  - isAdmin: boolean
  - chatworkAccountId: string

attendance/{YYYY-MM-DD}/participants/{email}
  - uid, name, email, photo, department, registeredAt, source?

lunch/{YYYY-MM-DD}
  - groups: Array<{members: [...]}>
  - createdAt: string
  - participantCount: number

lunch/{YYYY-MM-DD}/participants/{email}
  - uid, name, email, photo, department, registeredAt

announcements/{id}
  - title, content, priority, authorName, authorEmail
  - publishedAt, expiresAt?

miive/{email}
  - point, expirePoint, expireDate, updatedAt
```
