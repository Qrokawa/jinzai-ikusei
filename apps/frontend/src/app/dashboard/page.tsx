'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import Navbar from '@/components/Navbar';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
            <div className="text-sm text-gray-600">
              ようこそ、{user.lastName} {user.firstName} さん
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Goals Card */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">目標管理</h3>
            <p className="text-gray-600 mb-4">今期の目標を設定・管理します</p>
            <Link href="/goals" className="btn-primary inline-block">
              目標一覧へ
            </Link>
          </div>

          {/* Evaluation Card */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">評価</h3>
            <p className="text-gray-600 mb-4">自己評価・上司評価を行います</p>
            <Link href="/evaluations" className="btn-primary inline-block">
              評価タスクへ
            </Link>
          </div>

          {/* Learning Card */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">研修</h3>
            <p className="text-gray-600 mb-4">研修コースを受講します</p>
            <Link href="/courses" className="btn-primary inline-block">
              コース一覧へ
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="card col-span-full">
            <h3 className="text-lg font-semibold mb-4">クイック統計</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-primary-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-primary-600">3</div>
                <div className="text-sm text-gray-600">設定中の目標</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">5</div>
                <div className="text-sm text-gray-600">完了した研修</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">2</div>
                <div className="text-sm text-gray-600">受講中の研修</div>
              </div>
            </div>
          </div>

          {/* Recommended Courses */}
          <div className="card col-span-full lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">推奨研修</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">リーダーシップ基礎講座</div>
                  <div className="text-sm text-gray-500">推奨理由: スキルギャップを解消するため</div>
                </div>
                <button className="btn-secondary text-sm">受講開始</button>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">プロジェクト管理入門</div>
                  <div className="text-sm text-gray-500">推奨理由: 次の等級に必要なスキル</div>
                </div>
                <button className="btn-secondary text-sm">受講開始</button>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">最近のアクティビティ</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-500">●</span>
                <span>目標「新規顧客獲得」の進捗を更新</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">●</span>
                <span>研修「営業基礎」を完了</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500">●</span>
                <span>上司からフィードバックを受信</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
