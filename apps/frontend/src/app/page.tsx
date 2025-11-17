import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="text-center max-w-4xl mx-auto px-4">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          人事評価・研修統合プラットフォーム
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          評価と育成をシームレスに繋ぐ、次世代型人材開発プラットフォーム
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/login"
            className="btn-primary text-lg px-8 py-3 inline-block text-center"
          >
            ログイン
          </Link>
          <Link
            href="/auth/register"
            className="btn-secondary text-lg px-8 py-3 inline-block text-center"
          >
            新規登録
          </Link>
        </div>
      </div>
    </main>
  );
}
