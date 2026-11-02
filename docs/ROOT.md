# assets

base.yama-gara.com で配信する社内・公開ツール集。

## 認証（gate）

- サイト全体を、Pocket Core（`/root/rs-pocket-core`、`pkc.service`、127.0.0.1:8092）のログインで縛る。
- ログインできるのはテナント `yamagara`（ヤマガラテック）のユーザーだけ。
- 公開・非公開はリポジトリ直下の `access.json` だけで決める。`isPublic: true` のフォルダはログインなしで見られる。書いていないフォルダと `false` はログイン必須。
- 未ログインで非公開のページを開くと `/login.html?return_url=<元のパス>` に転送し、ログイン後に戻す。
- ログインは10日間保つ。ログアウトボタンは全ページの右上に小さく出す（ログイン中のみ）。
- ベーシック認証は使わない。

## 構成

- ツールは `assets/<ツール名>/` に1段で並べ、URLは `/<ツール名>/`。`common/` と `private/` の区別はなくした。
- 旧URL `/common/<x>`・`/private/<x>` は `/<x>` へ301で転送する（配った短縮URLや名刺のQRを壊さないため）。
- `private/` には秘密の `.env` だけが残る（配信しない）。
- 判定役は `gate/`（FastAPI、`gate.service`、127.0.0.1:1011）。nginx の `auth_request` で全リクエストを問い合わせる。
