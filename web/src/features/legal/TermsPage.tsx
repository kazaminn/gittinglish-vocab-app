import { Link } from 'react-router-dom';

export function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-2 text-2xl font-bold tracking-tight">
        利用規約 / Terms of Use
      </h1>
      <p className="text-text-muted mb-8 text-xs">最終更新日: 2026年4月30日</p>

      <article className="text-text space-y-6 text-sm leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-semibold">はじめに</h2>
          <p>
            このページは、<code>gittinglish</code> (以下、本サービス)
            を使うときの基本的なルールを書いたものです。個人開発の小さなサービスなので、必要なことを必要な分だけ書いています。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">サービスの内容</h2>
          <p>
            Git や開発業務でよく使う英語動詞をドリル形式で学べる、Web ベースの学習ツールです。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">利用条件</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              ログインには Google アカウント、GitHub アカウント、または Email/Password
              での認証が必要です。
            </li>
            <li>13 歳以上の方を想定しています（年齢確認はしていません）。</li>
            <li>利用は無料です。</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">やめてほしいこと</h2>
          <p>以下の行為はおやめください。</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>不正アクセスや、サーバーに過剰な負荷をかける行為</li>
            <li>他のユーザーや運営への迷惑行為</li>
            <li>法令に違反する行為</li>
            <li>本サービスのコードやコンテンツを断りなく転載すること</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">学習データの取り扱い</h2>
          <p>
            ドリル利用中の学習進捗データは、ユーザー個人の学習体験のためだけに使います。詳しくは{' '}
            <Link to="/privacy" className="underline">
              プライバシーポリシー
            </Link>{' '}
            を見てください。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">動作とコンテンツについて</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              本サービスはそのままの状態で提供されています。完璧な動作や、特定の学習効果を保証するものではありません。
            </li>
            <li>
              本サービスを使ったことで何か損害が発生しても、運営は責任を負えません。
            </li>
            <li>
              サービスの内容は予告なく変更したり、提供を停止したりすることがあります。
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">サービスの停止・終了</h2>
          <p>
            運営の判断で本サービスを停止または終了することがあります。終了する場合は、できる限り事前にお知らせします。
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">規約の変更</h2>
          <p>
            このページの内容は変更されることがあります。重要な変更があった場合は、本サービス内でお知らせします。
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
