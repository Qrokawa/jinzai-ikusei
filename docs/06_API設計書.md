# API設計書

## 1. 概要

本ドキュメントは、人事評価・研修統合プラットフォームのRESTful API設計を定義します。OpenAPI 3.0仕様に準拠し、一貫性のあるAPI設計を行います。

---

## 2. API設計原則

### 2.1 RESTful設計ガイドライン
- リソース指向のURL設計
- HTTPメソッドの適切な使用
- ステートレスな通信
- 統一的なレスポンス形式
- HATEOAS（必要に応じて）

### 2.2 命名規則
- URLはケバブケース（例: `/evaluation-cycles`）
- リソース名は複数形
- パラメータはキャメルケース（例: `userId`）
- ネストは2階層まで

### 2.3 バージョニング
- URLパスにバージョンを含める（例: `/api/v1/`）
- メジャーバージョンのみ管理

---

## 3. 共通仕様

### 3.1 ベースURL
```
https://api.{tenant}.platform.example.com/api/v1
```

### 3.2 認証
全てのAPIリクエストにはJWTトークンが必要:

```http
Authorization: Bearer <jwt_token>
```

### 3.3 共通ヘッダー

| ヘッダー | 必須 | 説明 |
|---------|------|------|
| Authorization | Yes | Bearer トークン |
| Content-Type | Yes | application/json |
| Accept | No | application/json |
| X-Request-ID | No | リクエスト追跡ID |
| X-Tenant-ID | No | テナントID（サブドメインから自動判定） |

### 3.4 HTTPステータスコード

| コード | 意味 | 使用場面 |
|--------|------|----------|
| 200 | OK | 成功（取得、更新） |
| 201 | Created | リソース作成成功 |
| 204 | No Content | 削除成功 |
| 400 | Bad Request | リクエスト不正 |
| 401 | Unauthorized | 認証エラー |
| 403 | Forbidden | 権限エラー |
| 404 | Not Found | リソース未発見 |
| 409 | Conflict | 競合エラー |
| 422 | Unprocessable Entity | バリデーションエラー |
| 429 | Too Many Requests | レート制限超過 |
| 500 | Internal Server Error | サーバーエラー |

### 3.5 レスポンス形式

**成功レスポンス:**
```json
{
  "data": {
    "id": "uuid",
    "type": "resource_type",
    "attributes": { ... }
  },
  "meta": {
    "timestamp": "2025-01-01T00:00:00Z",
    "requestId": "req_123"
  }
}
```

**一覧レスポンス:**
```json
{
  "data": [
    { "id": "uuid", "type": "resource_type", "attributes": { ... } }
  ],
  "meta": {
    "totalCount": 100,
    "page": 1,
    "perPage": 20,
    "totalPages": 5
  },
  "links": {
    "self": "/api/v1/resources?page=1",
    "next": "/api/v1/resources?page=2",
    "prev": null
  }
}
```

**エラーレスポンス:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力値が不正です",
    "details": [
      {
        "field": "email",
        "message": "有効なメールアドレスを入力してください"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-01-01T00:00:00Z",
    "requestId": "req_123"
  }
}
```

### 3.6 ページネーション

```http
GET /api/v1/users?page=2&perPage=20&sort=-createdAt
```

| パラメータ | デフォルト | 最大 | 説明 |
|-----------|-----------|------|------|
| page | 1 | - | ページ番号 |
| perPage | 20 | 100 | 1ページの件数 |
| sort | -createdAt | - | ソート（-は降順） |

### 3.7 フィルタリング

```http
GET /api/v1/courses?category=leadership&difficulty=intermediate
GET /api/v1/evaluations?status=pending,in_progress
GET /api/v1/goals?createdAt[gte]=2025-01-01
```

---

## 4. 認証API

### 4.1 ログイン

```http
POST /api/v1/auth/login
```

**リクエスト:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**レスポンス (200):**
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIs...",
    "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2...",
    "expiresIn": 3600,
    "tokenType": "Bearer",
    "user": {
      "id": "user_uuid",
      "email": "user@example.com",
      "firstName": "太郎",
      "lastName": "田中",
      "roles": ["employee"]
    }
  }
}
```

### 4.2 トークンリフレッシュ

```http
POST /api/v1/auth/refresh
```

**リクエスト:**
```json
{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2..."
}
```

### 4.3 ログアウト

```http
POST /api/v1/auth/logout
```

### 4.4 パスワードリセット要求

```http
POST /api/v1/auth/password-reset/request
```

**リクエスト:**
```json
{
  "email": "user@example.com"
}
```

### 4.5 パスワードリセット実行

```http
POST /api/v1/auth/password-reset/confirm
```

**リクエスト:**
```json
{
  "token": "reset_token",
  "newPassword": "newPassword123"
}
```

### 4.6 MFA設定

```http
POST /api/v1/auth/mfa/enable
```

**レスポンス:**
```json
{
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCodeUrl": "otpauth://totp/...",
    "backupCodes": ["123456", "789012", ...]
  }
}
```

---

## 5. ユーザー管理API

### 5.1 ユーザー一覧取得

```http
GET /api/v1/users
```

**クエリパラメータ:**
- `organizationId`: 組織ID
- `role`: ロール
- `status`: 状態（active, inactive）
- `search`: 名前・メール検索

**レスポンス:**
```json
{
  "data": [
    {
      "id": "user_uuid",
      "type": "user",
      "attributes": {
        "email": "user@example.com",
        "firstName": "太郎",
        "lastName": "田中",
        "employeeId": "EMP001",
        "position": "主任",
        "jobTitle": "営業",
        "organizationId": "org_uuid",
        "organizationName": "営業部",
        "managerId": "manager_uuid",
        "status": "active",
        "createdAt": "2025-01-01T00:00:00Z"
      }
    }
  ],
  "meta": {
    "totalCount": 50,
    "page": 1,
    "perPage": 20
  }
}
```

### 5.2 ユーザー詳細取得

```http
GET /api/v1/users/{userId}
```

### 5.3 ユーザー作成

```http
POST /api/v1/users
```

**リクエスト:**
```json
{
  "email": "newuser@example.com",
  "firstName": "花子",
  "lastName": "山田",
  "employeeId": "EMP002",
  "position": "課長",
  "jobTitle": "人事",
  "organizationId": "org_uuid",
  "managerId": "manager_uuid",
  "roles": ["manager"]
}
```

### 5.4 ユーザー更新

```http
PATCH /api/v1/users/{userId}
```

### 5.5 ユーザー削除（論理削除）

```http
DELETE /api/v1/users/{userId}
```

### 5.6 一括インポート

```http
POST /api/v1/users/import
Content-Type: multipart/form-data
```

---

## 6. 目標管理API

### 6.1 目標一覧取得

```http
GET /api/v1/goals
```

**クエリパラメータ:**
- `cycleId`: 評価サイクルID
- `userId`: ユーザーID
- `status`: 状態

**レスポンス:**
```json
{
  "data": [
    {
      "id": "goal_uuid",
      "type": "goal",
      "attributes": {
        "title": "新規顧客獲得",
        "description": "年間60件の新規顧客獲得",
        "successCriteria": "60件以上獲得",
        "weight": 40,
        "status": "in_progress",
        "currentProgress": 75,
        "cycleId": "cycle_uuid",
        "userId": "user_uuid",
        "approvedBy": "manager_uuid",
        "approvedAt": "2025-04-15T10:00:00Z",
        "createdAt": "2025-04-01T00:00:00Z",
        "updatedAt": "2025-06-01T00:00:00Z"
      }
    }
  ]
}
```

### 6.2 目標作成

```http
POST /api/v1/goals
```

**リクエスト:**
```json
{
  "cycleId": "cycle_uuid",
  "title": "製品知識の習得",
  "description": "主力製品5種類の深い理解",
  "successCriteria": "全製品テスト90点以上",
  "weight": 30,
  "parentGoalId": "parent_goal_uuid"
}
```

### 6.3 目標更新

```http
PATCH /api/v1/goals/{goalId}
```

### 6.4 目標承認申請

```http
POST /api/v1/goals/{goalId}/submit
```

### 6.5 目標承認

```http
POST /api/v1/goals/{goalId}/approve
```

**リクエスト:**
```json
{
  "comment": "目標内容が適切です。承認します。"
}
```

### 6.6 目標差し戻し

```http
POST /api/v1/goals/{goalId}/reject
```

**リクエスト:**
```json
{
  "comment": "達成基準をより具体的に記載してください。"
}
```

### 6.7 進捗更新

```http
POST /api/v1/goals/{goalId}/progress
```

**リクエスト:**
```json
{
  "progressPercentage": 80,
  "comment": "8月末時点で48件獲得。順調に進捗。"
}
```

### 6.8 進捗履歴取得

```http
GET /api/v1/goals/{goalId}/progress-history
```

---

## 7. 評価API

### 7.1 評価サイクル一覧

```http
GET /api/v1/evaluation-cycles
```

### 7.2 評価サイクル作成

```http
POST /api/v1/evaluation-cycles
```

**リクエスト:**
```json
{
  "name": "2025年度上期評価",
  "startDate": "2025-04-01",
  "endDate": "2025-09-30",
  "evaluationStartDate": "2025-10-01",
  "evaluationEndDate": "2025-10-31",
  "settings": {
    "enableSelfEvaluation": true,
    "enable360Evaluation": false,
    "requireManagerApproval": true
  }
}
```

### 7.3 評価一覧取得

```http
GET /api/v1/evaluations
```

**クエリパラメータ:**
- `cycleId`: 評価サイクルID
- `evaluateeId`: 被評価者ID
- `evaluatorId`: 評価者ID
- `type`: 評価タイプ（self, manager, peer）
- `status`: 状態

### 7.4 自己評価作成

```http
POST /api/v1/evaluations
```

**リクエスト:**
```json
{
  "cycleId": "cycle_uuid",
  "evaluationType": "self",
  "scores": [
    {
      "goalId": "goal_uuid",
      "score": 4,
      "achievementPercentage": 85,
      "comment": "目標を概ね達成。予定より2件多く獲得。"
    }
  ],
  "overallComment": "上半期は新規顧客獲得に注力し成果を上げた。"
}
```

### 7.5 評価更新

```http
PATCH /api/v1/evaluations/{evaluationId}
```

### 7.6 評価提出

```http
POST /api/v1/evaluations/{evaluationId}/submit
```

### 7.7 部下の評価待ち一覧

```http
GET /api/v1/evaluations/pending
```

### 7.8 360度評価依頼

```http
POST /api/v1/evaluations/360/request
```

**リクエスト:**
```json
{
  "cycleId": "cycle_uuid",
  "evaluateeId": "user_uuid",
  "evaluatorIds": ["peer1_uuid", "peer2_uuid"],
  "deadline": "2025-10-20",
  "isAnonymous": true
}
```

---

## 8. 研修（LMS）API

### 8.1 コース一覧取得

```http
GET /api/v1/courses
```

**クエリパラメータ:**
- `category`: カテゴリ
- `difficulty`: 難易度
- `isPublished`: 公開状態
- `search`: キーワード検索
- `tags`: タグ（カンマ区切り）

**レスポンス:**
```json
{
  "data": [
    {
      "id": "course_uuid",
      "type": "course",
      "attributes": {
        "title": "リーダーシップ基礎講座",
        "description": "リーダーシップの基本を学ぶ",
        "category": "leadership",
        "difficulty": "intermediate",
        "estimatedDuration": 180,
        "thumbnailUrl": "https://cdn.example.com/thumbnails/course1.jpg",
        "lessonsCount": 10,
        "enrollmentCount": 150,
        "averageRating": 4.5,
        "tags": ["リーダーシップ", "マネジメント"],
        "isPublished": true,
        "createdAt": "2025-01-01T00:00:00Z"
      }
    }
  ]
}
```

### 8.2 コース詳細取得

```http
GET /api/v1/courses/{courseId}
```

**レスポンス:**
```json
{
  "data": {
    "id": "course_uuid",
    "type": "course",
    "attributes": {
      "title": "リーダーシップ基礎講座",
      "description": "...",
      "objectives": ["リーダーの役割を理解する", "..."],
      "prerequisites": [],
      "lessons": [
        {
          "id": "lesson_uuid",
          "title": "リーダーシップとは",
          "duration": 15,
          "sortOrder": 1,
          "isMandatory": true,
          "contents": [
            {
              "id": "content_uuid",
              "type": "video",
              "title": "イントロダクション",
              "duration": 10
            }
          ]
        }
      ],
      "skills": [
        {
          "skillId": "skill_uuid",
          "skillName": "リーダーシップ",
          "levelGain": 1
        }
      ]
    }
  }
}
```

### 8.3 コース作成（管理者）

```http
POST /api/v1/courses
```

**リクエスト:**
```json
{
  "title": "新人営業研修",
  "description": "営業の基礎を学ぶ",
  "category": "sales",
  "difficulty": "beginner",
  "estimatedDuration": 120,
  "tags": ["営業", "新人研修"],
  "prerequisites": [],
  "skillIds": ["skill_uuid"]
}
```

### 8.4 コース登録（受講開始）

```http
POST /api/v1/courses/{courseId}/enroll
```

**レスポンス:**
```json
{
  "data": {
    "id": "enrollment_uuid",
    "type": "enrollment",
    "attributes": {
      "courseId": "course_uuid",
      "status": "enrolled",
      "progressPercentage": 0,
      "enrolledAt": "2025-06-01T10:00:00Z",
      "deadline": null
    }
  }
}
```

### 8.5 マイコース一覧

```http
GET /api/v1/enrollments
```

**クエリパラメータ:**
- `status`: enrolled, in_progress, completed, expired
- `sort`: -enrolledAt, -progressPercentage

### 8.6 受講進捗更新

```http
POST /api/v1/enrollments/{enrollmentId}/lessons/{lessonId}/progress
```

**リクエスト:**
```json
{
  "progressPercentage": 100,
  "timeSpent": 900,
  "lastPosition": 600
}
```

### 8.7 動画視聴ログ

```http
POST /api/v1/enrollments/{enrollmentId}/lessons/{lessonId}/watch-log
```

**リクエスト:**
```json
{
  "startPosition": 0,
  "endPosition": 300,
  "watchDuration": 300
}
```

### 8.8 コンテンツURL取得（署名付き）

```http
GET /api/v1/contents/{contentId}/url
```

**レスポンス:**
```json
{
  "data": {
    "url": "https://cdn.example.com/videos/video1.mp4?signature=...",
    "expiresAt": "2025-06-01T12:00:00Z"
  }
}
```

### 8.9 テスト取得

```http
GET /api/v1/courses/{courseId}/tests/{testId}
```

### 8.10 テスト回答提出

```http
POST /api/v1/tests/{testId}/attempts
```

**リクエスト:**
```json
{
  "answers": [
    {
      "questionId": "question_uuid",
      "answer": "A"
    },
    {
      "questionId": "question_uuid",
      "answer": ["A", "C"]
    }
  ]
}
```

**レスポンス:**
```json
{
  "data": {
    "id": "attempt_uuid",
    "type": "test_attempt",
    "attributes": {
      "score": 85,
      "totalPoints": 100,
      "passingScore": 70,
      "passed": true,
      "attemptNumber": 1,
      "submittedAt": "2025-06-01T11:30:00Z"
    }
  }
}
```

### 8.11 研修一括割り当て

```http
POST /api/v1/courses/{courseId}/assign
```

**リクエスト:**
```json
{
  "userIds": ["user1_uuid", "user2_uuid"],
  "organizationId": "org_uuid",
  "deadline": "2025-12-31",
  "sendNotification": true
}
```

---

## 9. スキル管理API

### 9.1 スキル一覧

```http
GET /api/v1/skills
```

### 9.2 ユーザースキル取得

```http
GET /api/v1/users/{userId}/skills
```

**レスポンス:**
```json
{
  "data": [
    {
      "skillId": "skill_uuid",
      "skillName": "リーダーシップ",
      "categoryName": "ソフトスキル",
      "currentLevel": 3,
      "targetLevel": 5,
      "maxLevel": 5,
      "assessedAt": "2025-06-01T00:00:00Z",
      "recommendedCourses": [
        {
          "courseId": "course_uuid",
          "title": "上級リーダーシップ"
        }
      ]
    }
  ]
}
```

### 9.3 スキル更新

```http
PATCH /api/v1/users/{userId}/skills/{skillId}
```

**リクエスト:**
```json
{
  "currentLevel": 4,
  "targetLevel": 5
}
```

### 9.4 スキルギャップ分析

```http
GET /api/v1/users/{userId}/skill-gaps
```

---

## 10. 分析・レポートAPI

### 10.1 個人ダッシュボードデータ

```http
GET /api/v1/analytics/personal-dashboard
```

**レスポンス:**
```json
{
  "data": {
    "goals": {
      "total": 3,
      "completed": 1,
      "inProgress": 2,
      "averageProgress": 65
    },
    "learning": {
      "totalCourses": 12,
      "completedCourses": 5,
      "inProgressCourses": 3,
      "totalHours": 24.5,
      "thisMonthHours": 3.2
    },
    "skills": {
      "improved": 2,
      "gaps": 3
    },
    "recentActivities": [...]
  }
}
```

### 10.2 チームダッシュボード

```http
GET /api/v1/analytics/team-dashboard
```

### 10.3 組織ダッシュボード

```http
GET /api/v1/analytics/organization-dashboard
```

### 10.4 評価分布レポート

```http
GET /api/v1/analytics/evaluation-distribution
```

**クエリパラメータ:**
- `cycleId`: 評価サイクルID
- `organizationId`: 組織ID
- `groupBy`: organization, jobTitle, position

### 10.5 研修効果レポート

```http
GET /api/v1/analytics/learning-effectiveness
```

### 10.6 レポートエクスポート

```http
POST /api/v1/analytics/export
```

**リクエスト:**
```json
{
  "reportType": "evaluation_summary",
  "format": "xlsx",
  "filters": {
    "cycleId": "cycle_uuid",
    "organizationId": "org_uuid"
  }
}
```

**レスポンス:**
```json
{
  "data": {
    "downloadUrl": "https://s3.../reports/report_123.xlsx",
    "expiresAt": "2025-06-01T12:00:00Z"
  }
}
```

---

## 11. 通知API

### 11.1 通知一覧取得

```http
GET /api/v1/notifications
```

**クエリパラメータ:**
- `isRead`: true/false
- `type`: evaluation, learning, goal, system

### 11.2 通知既読

```http
PATCH /api/v1/notifications/{notificationId}/read
```

### 11.3 一括既読

```http
POST /api/v1/notifications/read-all
```

### 11.4 通知設定取得

```http
GET /api/v1/notification-preferences
```

### 11.5 通知設定更新

```http
PATCH /api/v1/notification-preferences
```

**リクエスト:**
```json
{
  "emailNotifications": {
    "evaluationReminder": true,
    "goalApproval": true,
    "courseAssignment": true
  },
  "inAppNotifications": {
    "all": true
  }
}
```

---

## 12. レート制限

| エンドポイント | 制限 |
|---------------|------|
| POST /auth/login | 10 req/min/IP |
| GET /courses | 100 req/min/user |
| POST /evaluations | 30 req/min/user |
| POST /*/import | 5 req/hour/user |
| その他 | 1000 req/min/user |

レート制限超過時のレスポンス:
```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1625097600
```

---

## 13. エラーコード一覧

| コード | HTTPステータス | 説明 |
|--------|---------------|------|
| AUTH_INVALID_CREDENTIALS | 401 | 認証情報が不正 |
| AUTH_TOKEN_EXPIRED | 401 | トークン期限切れ |
| AUTH_MFA_REQUIRED | 403 | MFA認証が必要 |
| PERMISSION_DENIED | 403 | 権限なし |
| RESOURCE_NOT_FOUND | 404 | リソースが見つからない |
| VALIDATION_ERROR | 422 | 入力値検証エラー |
| GOAL_ALREADY_SUBMITTED | 409 | 目標は既に提出済み |
| EVALUATION_DEADLINE_PASSED | 422 | 評価期限超過 |
| COURSE_NOT_ENROLLED | 403 | コース未登録 |

---

## 14. OpenAPI仕様（抜粋）

```yaml
openapi: 3.0.3
info:
  title: 人事評価・研修統合プラットフォーム API
  version: 1.0.0
  description: 人事評価と研修管理を統合したプラットフォームのAPI

servers:
  - url: https://api.{tenant}.platform.example.com/api/v1
    variables:
      tenant:
        default: demo

security:
  - bearerAuth: []

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        firstName:
          type: string
        lastName:
          type: string
        employeeId:
          type: string
        position:
          type: string
        status:
          type: string
          enum: [active, inactive]

    Goal:
      type: object
      properties:
        id:
          type: string
          format: uuid
        title:
          type: string
        description:
          type: string
        weight:
          type: integer
          minimum: 0
          maximum: 100
        status:
          type: string
          enum: [draft, pending_approval, approved, in_progress, completed]

    Error:
      type: object
      properties:
        error:
          type: object
          properties:
            code:
              type: string
            message:
              type: string
            details:
              type: array
              items:
                type: object
```

---

## 15. 変更履歴

| バージョン | 日付 | 変更内容 | 変更者 |
|------------|------|----------|--------|
| 1.0 | 2025-11-17 | 初版作成 | Claude |
