'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { evaluationsApi, goalsApi } from '@/lib/api';
import Navbar from '@/components/Navbar';

interface EvaluationCycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  selfEvaluationStart: string;
  selfEvaluationEnd: string;
  managerEvaluationStart: string;
  managerEvaluationEnd: string;
  status: string;
}

interface Evaluation {
  id: string;
  type: string;
  status: string;
  overallRating: number | null;
  overallComment: string | null;
  submittedAt: string | null;
  evaluator: {
    firstName: string;
    lastName: string;
  };
  evaluatee: {
    firstName: string;
    lastName: string;
  };
  cycle: {
    name: string;
  };
}

interface Goal {
  id: string;
  title: string;
  progressPercentage: number;
}

const statusLabels: Record<string, string> = {
  draft: '下書き',
  in_progress: '進行中',
  submitted: '提出済み',
  reviewed: 'レビュー済み',
  finalized: '確定済み',
};

const typeLabels: Record<string, string> = {
  self: '自己評価',
  manager: '上司評価',
  peer: '同僚評価',
};

const ratingLabels: Record<number, string> = {
  1: 'D - 期待を大きく下回る',
  2: 'C - 期待を下回る',
  3: 'B - 期待通り',
  4: 'A - 期待を上回る',
  5: 'S - 期待を大きく上回る',
};

export default function EvaluationsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [cycles, setCycles] = useState<EvaluationCycle[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSelfEvalModal, setShowSelfEvalModal] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<EvaluationCycle | null>(null);
  const [selfEvalData, setSelfEvalData] = useState({
    overallRating: 3,
    overallComment: '',
    goalRatings: {} as Record<string, number>,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    fetchData();
  }, [isAuthenticated, router]);

  const fetchData = async () => {
    try {
      const [cyclesData, evaluationsData, goalsData] = await Promise.all([
        evaluationsApi.getCycles(),
        evaluationsApi.getEvaluations(),
        goalsApi.getMyGoals(),
      ]);
      setCycles(cyclesData);
      setEvaluations(evaluationsData);
      setGoals(goalsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSelfEvaluation = (cycle: EvaluationCycle) => {
    setSelectedCycle(cycle);
    const initialRatings: Record<string, number> = {};
    goals.forEach((goal) => {
      initialRatings[goal.id] = 3;
    });
    setSelfEvalData({
      overallRating: 3,
      overallComment: '',
      goalRatings: initialRatings,
    });
    setShowSelfEvalModal(true);
  };

  const handleSubmitSelfEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCycle) return;

    try {
      await evaluationsApi.createEvaluation({
        cycleId: selectedCycle.id,
        type: 'self',
        overallRating: selfEvalData.overallRating,
        overallComment: selfEvalData.overallComment,
        goalRatings: selfEvalData.goalRatings,
      });
      setShowSelfEvalModal(false);
      fetchData();
      alert('自己評価を提出しました');
    } catch (error) {
      console.error('Failed to submit evaluation:', error);
      alert('評価の提出に失敗しました');
    }
  };

  const getActiveCycle = () => {
    return cycles.find((c) => c.status === 'active');
  };

  const canStartSelfEvaluation = (cycle: EvaluationCycle) => {
    const now = new Date();
    const start = new Date(cycle.selfEvaluationStart);
    const end = new Date(cycle.selfEvaluationEnd);
    return now >= start && now <= end;
  };

  const hasSelfEvaluation = (cycleId: string) => {
    return evaluations.some((e) => e.cycle?.name && e.type === 'self');
  };

  if (!isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
  }

  const activeCycle = getActiveCycle();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">評価管理</h1>

          {loading ? (
            <div className="text-center py-12">読み込み中...</div>
          ) : (
            <div className="space-y-6">
              {/* Current Evaluation Cycle */}
              {activeCycle && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold mb-4">現在の評価サイクル</h2>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-blue-900">{activeCycle.name}</h3>
                        <p className="text-sm text-blue-700 mt-1">
                          期間:{' '}
                          {new Date(activeCycle.startDate).toLocaleDateString('ja-JP')} 〜{' '}
                          {new Date(activeCycle.endDate).toLocaleDateString('ja-JP')}
                        </p>
                        <p className="text-sm text-blue-700 mt-1">
                          自己評価期間:{' '}
                          {new Date(activeCycle.selfEvaluationStart).toLocaleDateString('ja-JP')} 〜{' '}
                          {new Date(activeCycle.selfEvaluationEnd).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                      <div>
                        {canStartSelfEvaluation(activeCycle) &&
                          !hasSelfEvaluation(activeCycle.id) && (
                            <button
                              onClick={() => handleStartSelfEvaluation(activeCycle)}
                              className="btn-primary"
                            >
                              自己評価を開始
                            </button>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* My Evaluations */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold">評価履歴</h2>
                </div>
                {evaluations.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    評価履歴がありません
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {evaluations.map((evaluation) => (
                      <li key={evaluation.id} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-3">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {typeLabels[evaluation.type] || evaluation.type}
                              </span>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {statusLabels[evaluation.status] || evaluation.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">
                              評価者: {evaluation.evaluator.lastName} {evaluation.evaluator.firstName}
                            </p>
                            {evaluation.overallRating && (
                              <p className="text-sm font-medium text-gray-900 mt-1">
                                総合評価: {ratingLabels[evaluation.overallRating]}
                              </p>
                            )}
                            {evaluation.overallComment && (
                              <p className="text-sm text-gray-600 mt-1">
                                {evaluation.overallComment}
                              </p>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {evaluation.submittedAt
                              ? new Date(evaluation.submittedAt).toLocaleDateString('ja-JP')
                              : '未提出'}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Goals Summary for Evaluation */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold">評価対象の目標</h2>
                </div>
                {goals.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    設定済みの目標がありません
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {goals.map((goal) => (
                      <li key={goal.id} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{goal.title}</h4>
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                                <span>進捗率</span>
                                <span>{goal.progressPercentage}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-primary-600 h-2 rounded-full"
                                  style={{ width: `${goal.progressPercentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Self Evaluation Modal */}
      {showSelfEvalModal && selectedCycle && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">自己評価 - {selectedCycle.name}</h2>
            <form onSubmit={handleSubmitSelfEvaluation} className="space-y-6">
              {/* Goal Ratings */}
              <div>
                <h3 className="text-lg font-medium mb-4">目標別評価</h3>
                <div className="space-y-4">
                  {goals.map((goal) => (
                    <div key={goal.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium">{goal.title}</span>
                        <span className="text-sm text-gray-500">
                          進捗: {goal.progressPercentage}%
                        </span>
                      </div>
                      <select
                        value={selfEvalData.goalRatings[goal.id] || 3}
                        onChange={(e) =>
                          setSelfEvalData({
                            ...selfEvalData,
                            goalRatings: {
                              ...selfEvalData.goalRatings,
                              [goal.id]: Number(e.target.value),
                            },
                          })
                        }
                        className="input-field"
                      >
                        {Object.entries(ratingLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Overall Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  総合自己評価
                </label>
                <select
                  value={selfEvalData.overallRating}
                  onChange={(e) =>
                    setSelfEvalData({ ...selfEvalData, overallRating: Number(e.target.value) })
                  }
                  className="input-field"
                >
                  {Object.entries(ratingLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Overall Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  総合コメント
                </label>
                <textarea
                  value={selfEvalData.overallComment}
                  onChange={(e) =>
                    setSelfEvalData({ ...selfEvalData, overallComment: e.target.value })
                  }
                  rows={5}
                  className="input-field"
                  placeholder="今期の成果、課題、改善点などを記載してください..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowSelfEvalModal(false)}
                  className="btn-secondary"
                >
                  キャンセル
                </button>
                <button type="submit" className="btn-primary">
                  提出
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
