'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { goalsApi } from '@/lib/api';
import Navbar from '@/components/Navbar';

interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  weight: number;
  status: string;
  progressPercentage: number;
  targetValue: number | null;
  currentValue: number | null;
  startDate: string;
  endDate: string;
  createdAt: string;
}

const statusLabels: Record<string, string> = {
  draft: '下書き',
  pending_approval: '承認待ち',
  approved: '承認済み',
  in_progress: '進行中',
  completed: '完了',
  rejected: '差し戻し',
};

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  pending_approval: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-green-100 text-green-800',
  completed: 'bg-purple-100 text-purple-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function GoalsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'performance',
    weight: 20,
    targetValue: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    fetchGoals();
  }, [isAuthenticated, router]);

  const fetchGoals = async () => {
    try {
      const data = await goalsApi.getMyGoals();
      setGoals(data);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await goalsApi.createGoal({
        ...newGoal,
        targetValue: newGoal.targetValue ? Number(newGoal.targetValue) : null,
      });
      setShowCreateModal(false);
      setNewGoal({
        title: '',
        description: '',
        category: 'performance',
        weight: 20,
        targetValue: '',
        startDate: '',
        endDate: '',
      });
      fetchGoals();
    } catch (error) {
      console.error('Failed to create goal:', error);
      alert('目標の作成に失敗しました');
    }
  };

  const handleSubmitGoal = async (goalId: string) => {
    try {
      await goalsApi.submitGoal(goalId);
      fetchGoals();
    } catch (error) {
      console.error('Failed to submit goal:', error);
      alert('目標の提出に失敗しました');
    }
  };

  if (!isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">目標管理</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              新規目標作成
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">読み込み中...</div>
          ) : goals.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500 mb-4">目標がまだ設定されていません</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
              >
                最初の目標を作成
              </button>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {goals.map((goal) => (
                  <li key={goal.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">{goal.title}</h3>
                          <p className="mt-1 text-sm text-gray-500">{goal.description}</p>
                        </div>
                        <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[goal.status]}`}
                          >
                            {statusLabels[goal.status]}
                          </span>
                          {goal.status === 'draft' && (
                            <button
                              onClick={() => handleSubmitGoal(goal.id)}
                              className="btn-secondary text-sm"
                            >
                              提出
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                          <span>進捗率</span>
                          <span>{goal.progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-primary-600 h-2.5 rounded-full"
                            style={{ width: `${goal.progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                        <span>ウェイト: {goal.weight}%</span>
                        <span>
                          期間: {new Date(goal.startDate).toLocaleDateString('ja-JP')} 〜{' '}
                          {new Date(goal.endDate).toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>

      {/* Create Goal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h2 className="text-xl font-semibold mb-4">新規目標作成</h2>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">タイトル</label>
                <input
                  type="text"
                  required
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">説明</label>
                <textarea
                  required
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  rows={3}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">カテゴリ</label>
                <select
                  value={newGoal.category}
                  onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                  className="input-field"
                >
                  <option value="performance">業績目標</option>
                  <option value="skill">スキル目標</option>
                  <option value="behavior">行動目標</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">ウェイト (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={newGoal.weight}
                    onChange={(e) => setNewGoal({ ...newGoal, weight: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">目標値</label>
                  <input
                    type="number"
                    value={newGoal.targetValue}
                    onChange={(e) => setNewGoal({ ...newGoal, targetValue: e.target.value })}
                    className="input-field"
                    placeholder="任意"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">開始日</label>
                  <input
                    type="date"
                    required
                    value={newGoal.startDate}
                    onChange={(e) => setNewGoal({ ...newGoal, startDate: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">終了日</label>
                  <input
                    type="date"
                    required
                    value={newGoal.endDate}
                    onChange={(e) => setNewGoal({ ...newGoal, endDate: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  キャンセル
                </button>
                <button type="submit" className="btn-primary">
                  作成
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
