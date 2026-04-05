import React, { useMemo } from 'react';
import Spinner from '../../components/Spinner';
import { useGetProgressQuery } from '../../services/progressApi';
import toast from 'react-hot-toast';
import { FileText, BookOpen, BrainCircuit, Trophy, Star, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/button';

const DashboardPage = () => {
  const { data: progressData, isLoading, isError } = useGetProgressQuery();

  React.useEffect(() => {
    if (isError) {
      toast.error('Failed to load progress data. Please try again later.', {
        id: 'dashboard-progress-error'
      });
    }
  }, [isError]);

  if (isLoading) {
    return <Spinner />;
  }

  if (isError) {
    return <div className="text-center text-red-500">
      <p className="text-lg font-semibold">Error loading dashboard</p>
      <p className="text-sm">Please try again later.</p>
    </div>;
  }

  const overview = progressData?.data?.overview ?? {};
  const recentActivity = progressData?.data?.recentActivity ?? {};

  const recentDocuments = Array.isArray(recentActivity.documents) ? recentActivity.documents : [];
  const recentQuizzes = Array.isArray(recentActivity.quizzes) ? recentActivity.quizzes : [];

  const quizCompletionRate = useMemo(() => {
    const totalQuizzes = Number(overview.quizzes || 0);
    const completedQuizzes = Number(overview.completedQuizzes || 0);
    if (!totalQuizzes) {
      return 0;
    }
    return Math.round((completedQuizzes / totalQuizzes) * 100);
  }, [overview.completedQuizzes, overview.quizzes]);

  const stats = useMemo(() => {
    return [
      {
        label: 'Documents',
        value: overview.documents || 0,
        icon: FileText,
        gradient: 'from-blue-400 to-blue-600',
        shadowColor: 'shadow-blue-300'
      },
      {
        label: 'Flashcards',
        value: overview.totalFlashcards || 0,
        icon: BookOpen,
        gradient: 'from-green-400 to-green-600',
        shadowColor: 'shadow-green-300'
      },
      {
        label: 'Quizzes',
        value: overview.quizzes || 0,
        icon: BrainCircuit,
        gradient: 'from-purple-400 to-purple-600',
        shadowColor: 'shadow-purple-300'
      },
      {
        label: 'Average Quiz Score',
        value: `${Number(overview.averageQuizScore || 0)}%`,
        icon: Trophy,
        gradient: 'from-emerald-400 to-teal-600',
        shadowColor: 'shadow-emerald-300'
      }
    ];
  }, [overview]);

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return 'N/A';
    }
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) {
      return 'N/A';
    }
    return parsed.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
        <p className="mt-1 text-sm text-slate-600">Track your study progress and recent learning activity.</p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={`rounded-xl bg-white p-5 shadow ${item.shadowColor}`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">{item.label}</p>
                <span className={`rounded-lg bg-linear-to-r ${item.gradient} p-2 text-white`}>
                  <Icon size={18} />
                </span>
              </div>
              <p className="mt-4 text-3xl font-bold text-slate-800">{item.value}</p>
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow">
          <div className="flex items-center gap-2 text-slate-700">
            <CheckCircle2 size={18} />
            <h3 className="text-lg font-semibold">Quiz Completion</h3>
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-800">{quizCompletionRate}%</p>
          <p className="mt-1 text-sm text-slate-500">
            {overview.completedQuizzes || 0} of {overview.quizzes || 0} quizzes completed
          </p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <div className="flex items-center gap-2 text-slate-700">
            <Star size={18} />
            <h3 className="text-lg font-semibold">Starred Flashcards</h3>
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-800">{overview.starredFlashcards || 0}</p>
          <p className="mt-1 text-sm text-slate-500">
            Reviewed: {overview.reviewedFlashcards || 0}
          </p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <div className="flex items-center gap-2 text-slate-700">
            <Trophy size={18} />
            <h3 className="text-lg font-semibold">Study Streak</h3>
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-800">{overview.studyStreak || 0} days</p>
          <p className="mt-1 text-sm text-slate-500">Keep learning daily to increase your streak.</p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow">
          <h3 className="mb-3 text-lg font-semibold text-slate-800">Recent Documents</h3>
          {recentDocuments.length === 0 ? (
            <p className="text-sm text-slate-500">No recent documents found.</p>
          ) : (
            <ul className="space-y-3">
              {recentDocuments.map((doc) => (
                <div className=''>
                  <li key={doc._id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                    <div className='flex flex-col'>
                      <p className="font-medium text-slate-800">{doc.title || 'Untitled document'}</p>
                      <p className="text-xs text-slate-500">{formatDate(doc.createdAt)}</p>
                    </div>
                    <Button variant="outline" className="mt-2 bg-green-600 hover:bg-green-700 text-white">
                      View Details
                    </Button>
                  </li>
                </div>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <h3 className="mb-3 text-lg font-semibold text-slate-800">Recent Quizzes</h3>
          {recentQuizzes.length === 0 ? (
            <p className="text-sm text-slate-500">No recent quiz attempts found.</p>
          ) : (
            <ul className="space-y-3">
              {recentQuizzes.map((quiz) => (
                <div className=''>
                  <li key={quiz._id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                    <div className='flex flex-col'>
                      <p className="font-medium text-slate-800">
                        {quiz.documentId?.title || 'Quiz'}
                      </p>
                      <p className="text-xs text-slate-500">
                        Score: {Math.round(Number(quiz.score || 0))}% • {formatDate(quiz.completedAt)}
                      </p>
                    </div>
                    <Button variant="outline" className="mt-2 bg-green-600 hover:bg-green-700 text-white">
                      View Details
                    </Button>
                  </li>
                </div>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
export default DashboardPage;