import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight">gittinglish</h1>
        <p className="text-text-muted text-base">
          Git のコミットメッセージで使う頻出英動詞を、間隔反復 (SM-2)
          で身につける学習ドリル。
        </p>
      </header>

      <section aria-labelledby="features" className="flex flex-col gap-3">
        <h2 id="features" className="text-lg font-semibold">
          特徴
        </h2>
        <ul className="text-text-muted list-disc space-y-1 pl-5 text-sm">
          <li>四択 / 自由入力 / 単語語義の 3 モード</li>
          <li>SM-2 アルゴリズムで「忘れかけのタイミング」だけ復習</li>
          <li>無料・広告なし・アクセス解析なし</li>
        </ul>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          to="/signup"
          className="text-text-inverted hover:bg-accent-hover inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 text-sm font-medium transition-colors"
        >
          サインアップ
        </Link>
        <Link
          to="/login"
          className="bg-bg-muted text-text border-border hover:bg-bg-hover inline-flex items-center justify-center rounded-md border px-6 py-3 text-sm font-medium transition-colors"
        >
          ログイン
        </Link>
      </div>

      <footer className="text-text-muted mt-8 flex gap-4 border-t pt-6 text-xs">
        <Link to="/privacy" className="hover:underline">
          プライバシーポリシー
        </Link>
        <Link to="/terms" className="hover:underline">
          利用規約
        </Link>
        <span className="ml-auto">© kazaminn</span>
      </footer>
    </main>
  );
}
