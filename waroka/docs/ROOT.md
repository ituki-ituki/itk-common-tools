# ROOT

## 目的

アプリ名は **ワロカ**。Walica（ワリカ）のUIを踏襲した、最もシンプルな割り勘管理アプリを作る。

## 設計思想（全Phase共通）

- 最小限・シンプル・直感的であること。
- Phase 2でDB・APIを追加するときも、この方針を守る。

## 開発ステップ

- **Phase 1（今回）**: UIのみの独立したシステム。バックエンド・DBなし。データは保存しない。コード量を最小限に絞る。
- **Phase 2**: データベースとAPIを追加する（→ TODO.md）

## 技術スタック（Phase 1）

- `frontend/index.html` ＋ `app.js` ＋ `style.css`（ビルドなし）
- Alpine.jsをCDNで読み込む。アイコンはSVGを直接書く
- `frontend/` をそのままclaude.aiのプレビューとして公開する（→ README.md）

## Phase 1の機能（詳細 → UI.md）

1. メンバー登録
2. 立て替えの記録
3. 精算結果の表示
