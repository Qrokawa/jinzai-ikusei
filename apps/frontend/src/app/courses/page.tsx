'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { coursesApi } from '@/lib/api';
import Navbar from '@/components/Navbar';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  estimatedDuration: number;
  thumbnailUrl: string | null;
  isPublished: boolean;
  instructor: {
    firstName: string;
    lastName: string;
  } | null;
  _count?: {
    lessons: number;
    enrollments: number;
  };
}

interface Enrollment {
  id: string;
  status: string;
  progressPercentage: number;
  startedAt: string;
  completedAt: string | null;
  course: Course;
}

const levelLabels: Record<string, string> = {
  beginner: '初級',
  intermediate: '中級',
  advanced: '上級',
};

const categoryLabels: Record<string, string> = {
  leadership: 'リーダーシップ',
  technical: '技術',
  communication: 'コミュニケーション',
  compliance: 'コンプライアンス',
  sales: '営業',
  management: 'マネジメント',
};

export default function CoursesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'catalog' | 'my'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    fetchData();
  }, [isAuthenticated, router]);

  const fetchData = async () => {
    try {
      const [coursesData, enrollmentsData] = await Promise.all([
        coursesApi.getCourses(),
        coursesApi.getMyEnrollments(),
      ]);
      setCourses(coursesData);
      setMyEnrollments(enrollmentsData);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    try {
      await coursesApi.enrollCourse(courseId);
      alert('コースに登録しました');
      fetchData();
    } catch (error) {
      console.error('Failed to enroll:', error);
      alert('登録に失敗しました');
    }
  };

  const isEnrolled = (courseId: string) => {
    return myEnrollments.some((e) => e.course.id === courseId);
  };

  const filteredCourses = selectedCategory
    ? courses.filter((c) => c.category === selectedCategory)
    : courses;

  if (!isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">研修コース</h1>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('catalog')}
                className={`${
                  activeTab === 'catalog'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                コースカタログ
              </button>
              <button
                onClick={() => setActiveTab('my')}
                className={`${
                  activeTab === 'my'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                受講中のコース ({myEnrollments.length})
              </button>
            </nav>
          </div>

          {loading ? (
            <div className="text-center py-12">読み込み中...</div>
          ) : activeTab === 'catalog' ? (
            <>
              {/* Category Filter */}
              <div className="mb-6">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input-field max-w-xs"
                >
                  <option value="">すべてのカテゴリ</option>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Course Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <div key={course.id} className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="h-40 bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center">
                      <span className="text-white text-4xl">📚</span>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {categoryLabels[course.category] || course.category}
                        </span>
                        <span className="text-xs text-gray-500">
                          {levelLabels[course.level] || course.level}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.title}</h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span>⏱️ {course.estimatedDuration}分</span>
                        <span>📖 {course._count?.lessons || 0}レッスン</span>
                      </div>
                      {isEnrolled(course.id) ? (
                        <button className="w-full btn-secondary" disabled>
                          登録済み
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEnroll(course.id)}
                          className="w-full btn-primary"
                        >
                          受講登録
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {filteredCourses.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <p className="text-gray-500">該当するコースがありません</p>
                </div>
              )}
            </>
          ) : (
            /* My Enrollments */
            <div className="space-y-4">
              {myEnrollments.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <p className="text-gray-500 mb-4">受講中のコースはありません</p>
                  <button onClick={() => setActiveTab('catalog')} className="btn-primary">
                    コースカタログを見る
                  </button>
                </div>
              ) : (
                myEnrollments.map((enrollment) => (
                  <div key={enrollment.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {enrollment.course.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {enrollment.course.description}
                        </p>
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                            <span>進捗率</span>
                            <span>{enrollment.progressPercentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-green-600 h-2.5 rounded-full"
                              style={{ width: `${enrollment.progressPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="mt-3 text-sm text-gray-500">
                          開始日:{' '}
                          {new Date(enrollment.startedAt).toLocaleDateString('ja-JP')}
                          {enrollment.completedAt && (
                            <span className="ml-4">
                              完了日:{' '}
                              {new Date(enrollment.completedAt).toLocaleDateString('ja-JP')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <button className="btn-primary">学習を続ける</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
