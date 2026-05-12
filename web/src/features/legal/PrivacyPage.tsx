import { Link } from 'react-router-dom';

export function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-2 text-2xl font-bold tracking-tight">
        プライバシーポリシー / Privacy Policy
      </h1>
      <p className="text-text-muted mb-8 text-xs">最終更新日: 2026年4月30日</p>

      <article className="text-text space-y-6 text-sm leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-semibold">はじめに</h2>
          <p>
            このページは、<code>gittinglish</code> (以下、本サービス)
            がどんな情報をどう扱っているかを説明するものです。個人開発の小さなサービスなので、必要なことを必要な分だけ書いています。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">運営者</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>運営者: kazaminn</li>
            <li>連絡先: contact@kazamitte.com</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold">取得する情報</h2>
          <p>ログインや利用にあたって、以下の情報を取得します。</p>
          <div className="overflow-x-auto">
            <table className="border-border w-full border-collapse border text-xs">
              <thead className="bg-bg-muted">
                <tr>
                  <th className="border-border border px-3 py-2 text-left">
                    種類
                  </th>
                  <th className="border-border border px-3 py-2 text-left">
                    いつ取得
                  </th>
                  <th className="border-border border px-3 py-2 text-left">
                    何に使う
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border-border border px-3 py-2">
                    メールアドレス（ハッシュ化）
                  </td>
                  <td className="border-border border px-3 py-2">
                    OAuth ログイン時
                  </td>
                  <td className="border-border border px-3 py-2">
                    同じユーザーかどうかの照合
                  </td>
                </tr>
                <tr>
                  <td className="border-border border px-3 py-2">表示名</td>
                  <td className="border-border border px-3 py-2">
                    OAuth ログイン時
                  </td>
                  <td className="border-border border px-3 py-2">画面表示</td>
                </tr>
                <tr>
                  <td className="border-border border px-3 py-2">
                    学習進捗データ
                  </td>
                  <td className="border-border border px-3 py-2">
                    ドリル利用時
                  </td>
                  <td className="border-border border px-3 py-2">
                    進捗の保存・復習スケジュールの計算
                  </td>
                </tr>
                <tr>
                  <td className="border-border border px-3 py-2">
                    認証セッション Cookie
                  </td>
                  <td className="border-border border px-3 py-2">ログイン時</td>
                  <td className="border-border border px-3 py-2">
                    ログイン状態の維持
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-sm font-semibold">メールアドレスについて</h3>
          <p>
            メールアドレスはサーバーに渡る時点で{' '}
            <strong>HMAC-SHA256 によるハッシュ化</strong>
            を行います。サーバー側では元のメールアドレスを取り出せません。
          </p>
          <p>
            ハッシュ化された値は、次回以降のログインで「同じ人かどうか」を確かめるためだけに使います。
          </p>

          <h3 className="text-sm font-semibold">学習進捗データについて</h3>
          <p>
            ドリルを解いた記録、正誤、復習タイミング計算用の数値などです。学習体験のためだけに使います。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">使い道</h2>
          <p>取得した情報は以下のために使います。</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>ログイン状態の維持と、本人確認</li>
            <li>ドリル機能の提供（進捗の保存、復習タイミングの計算）</li>
            <li>不具合があった時の調査</li>
          </ul>
          <p>
            これ以外には使いません。広告・外部への販売・機械学習の学習データ化はしていません。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">外部サービス</h2>
          <p>
            ログイン認証には以下のサービスを利用しており、認証時にそれぞれの提供元と情報のやりとりがあります。
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Google OAuth (Google LLC)</li>
            <li>GitHub OAuth (GitHub, Inc.)</li>
            <li>Email/Password 認証 (better-auth, サーバー内処理)</li>
          </ul>
          <p>これら以外の第三者にユーザーの情報を渡すことはありません。</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">どのくらい保管するか</h2>
          <p>
            アカウントが存在する間、情報は保管されます。アカウントが不要になったら、
            <code>contact@kazamitte.com</code>{' '}
            までご連絡ください。停止または削除します。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">Cookie</h2>
          <p>
            ログイン状態の維持のために、HttpOnly な Cookie を 1
            つ使います。アクセス解析や広告のための Cookie は使っていません。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">ユーザーができること</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>アカウントの停止依頼</li>
            <li>データの削除依頼</li>
            <li>取得情報の開示依頼</li>
          </ul>
          <p>
            すべて <code>contact@kazamitte.com</code> までご連絡ください。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">変更について</h2>
          <p>
            本サービスの変更にあわせて、このポリシーも更新することがあります。重要な変更があった場合は、本サービス内でお知らせします。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">お問い合わせ</h2>
          <p>contact@kazamitte.com</p>
        </section>
      </article>

      <p className="mt-8 text-xs">
        <Link to="/" className="text-text-muted hover:underline">
          ← トップへ戻る
        </Link>
      </p>
    </main>
  );
}
