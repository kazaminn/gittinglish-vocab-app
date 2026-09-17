import { Link } from 'react-router-dom';

export function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-2 text-2xl font-bold tracking-tight">
        プライバシーポリシー / Privacy Policy
      </h1>
      <p className="text-text-muted mb-8 text-xs">最終更新日: 2026年9月17日</p>

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

        <section className="space-y-2">
          <h2 className="text-base font-semibold">ログイン方法</h2>
          <p>本サービスへのログインには、次のいずれかの方法を使います。</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Kazamitte ID (<code>https://auth.kazamitte.com</code>) — kazamitte
              系サービス共通の、外部の認証サービスです。Kazamitte ID
              自体はログイン手段として Google アカウントまたは GitHub
              アカウントでのサインインに対応していますが、これは Kazamitte ID
              とそれらのサービスとの間のやり取りであり、本サービスが Google や
              GitHub と直接情報をやり取りすることはありません。
            </li>
            <li>
              ID・パスワードでのログイン — 本サービス内で発行する ID
              とパスワードのみで利用でき、メールアドレスの入力は求めません。
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold">取得する情報</h2>
          <p>ログインや利用にあたって、以下の情報を取得します。</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border text-xs">
              <thead className="bg-bg-muted">
                <tr>
                  <th className="border border-border px-3 py-2 text-left">
                    種類
                  </th>
                  <th className="border border-border px-3 py-2 text-left">
                    いつ取得
                  </th>
                  <th className="border border-border px-3 py-2 text-left">
                    何に使う
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-border px-3 py-2">表示名</td>
                  <td className="border border-border px-3 py-2">
                    サインアップ時・設定変更時
                  </td>
                  <td className="border border-border px-3 py-2">画面表示</td>
                </tr>
                <tr>
                  <td className="border border-border px-3 py-2">
                    学習進捗データ
                  </td>
                  <td className="border border-border px-3 py-2">
                    ドリル利用時
                  </td>
                  <td className="border border-border px-3 py-2">
                    進捗の保存・復習スケジュールの計算
                  </td>
                </tr>
                <tr>
                  <td className="border border-border px-3 py-2">
                    認証セッション Cookie
                  </td>
                  <td className="border border-border px-3 py-2">ログイン時</td>
                  <td className="border border-border px-3 py-2">
                    ログイン状態の維持
                  </td>
                </tr>
                <tr>
                  <td className="border border-border px-3 py-2">
                    IP アドレス・ユーザーエージェント
                  </td>
                  <td className="border border-border px-3 py-2">ログイン時</td>
                  <td className="border border-border px-3 py-2">
                    ログインセッションの管理
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-sm font-semibold">メールアドレスについて</h3>
          <p>
            本サービスは、ログイン方法にかかわらず、ユーザーの実際のメールアドレスを取得・保持しません。Kazamitte
            ID
            でログインした場合もメールアドレスは受け取らず、ID・パスワードでサインアップする場合も入力を求めません。
          </p>

          <h3 className="text-sm font-semibold">表示名について</h3>
          <p>
            表示名は、サインアップ時または設定画面でユーザー自身が入力したものです。Kazamitte
            ID や、その先の Google・GitHub
            のプロフィール名がそのまま使われることはありません。
          </p>

          <h3 className="text-sm font-semibold">学習進捗データについて</h3>
          <p>
            ドリルを解いた記録、回答内容、正誤、復習タイミング計算用の数値、日々の学習状況などです。学習体験のためだけに使います。
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
            本サービスの実行環境・データの保管・ログイン認証には、以下の外部サービスを利用しています。
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Kazamitte ID — ログイン認証 (https://auth.kazamitte.com)</li>
            <li>Email/Password 認証 (better-auth, サーバー内処理)</li>
            <li>Vercel — 本サービスのホスティング</li>
            <li>Turso — 学習データ等を保管するデータベース</li>
          </ul>
          <p>これら以外の第三者にユーザーの情報を渡すことはありません。</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">セッションについて</h2>
          <p>ログインには、独立した 2 つのセッションが関わります。</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              本サービス (Gittinglish) のセッション — ログイン状態の維持に使う
              HttpOnly Cookie です。
            </li>
            <li>
              Kazamitte ID 側のセッション — auth.kazamitte.com
              上で管理される、別のセッションです。
            </li>
          </ul>
          <p>
            本サービスからログアウトしても、Kazamitte ID
            側のセッションは終了しません。また、Kazamitte ID
            からログアウトしても、その先の Google・GitHub
            のログイン状態は終了しません。共有の端末を使っている場合は、それぞれ個別にログアウトしてください（ログアウト後の画面から
            Kazamitte ID のログアウトへ進めます）。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">
            ブラウザに保存する情報 (localStorage)
          </h2>
          <p>
            本サービスは、以下の情報をブラウザの localStorage
            に保存します。これらはブラウザの外に送信されることはありません。
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>テーマ (ライト / ダーク / システム) の設定</li>
            <li>文字サイズ・文字の太さ・1 回のドリルの問題数などの表示設定</li>
            <li>
              学習進捗データ、進行中のドリルセッションの状態
              (ユーザーごと、ブラウザ内のキャッシュ)
            </li>
          </ul>
          <p>
            パスワードやログイン用のトークン・セッション情報を localStorage
            に保存することはありません。ユーザーごとの学習進捗と進行中のドリルセッションの情報は、そのユーザーがログアウトすると、このブラウザから削除されます。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">どのくらい保管するか</h2>
          <p>
            アカウントが存在する間、情報は保管されます。アカウントの削除方法は下記「ユーザーができること」を参照してください。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">Cookie</h2>
          <p>
            本サービスは、ログイン状態の維持のために HttpOnly な Cookie を 1
            つ使います。アクセス解析や広告のための Cookie
            は使っていません。Kazamitte ID 側のセッション Cookie は
            auth.kazamitte.com
            上で管理されており、本サービスが直接扱うことはありません。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">ユーザーができること</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              アカウントの削除 —
              設定画面から、ユーザー自身の操作でいつでも削除できます。削除すると、本サービスのアカウント、学習データ、ログインセッション、Kazamitte
              ID との連携情報が削除されます。Kazamitte ID
              自体は本サービスとは別のサービスであり、他の kazamitte
              系サービスでも使われているため、削除されません。
            </li>
            <li>
              Kazamitte ID の連携解除 — アカウントを削除せずに、Kazamitte ID
              との連携だけを設定画面から解除できます。Kazamitte ID
              が唯一のログイン方法になっている間は解除できません（先にパスワードを設定してください）。
            </li>
            <li>取得情報の開示依頼</li>
          </ul>
          <p>
            取得情報の開示については <code>contact@kazamitte.com</code>{' '}
            までご連絡ください。
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
