import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle2, XCircle } from 'lucide-react';
import Spinner from '../../components/Spinner';
import { Button } from '../../components/ui/button';
import { useDeleteQuizResultMutation, useGetQuizResultsQuery } from '@/services/quizApi';

const QuizzesResultsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const quizId = searchParams.get('quizId');

  const { data, isLoading, isError } = useGetQuizResultsQuery(quizId, { skip: !quizId });
  const [deleteQuizResult, { isLoading: isDeleting }] = useDeleteQuizResultMutation();

  const quiz = data?.data?.quiz;
  const results = Array.isArray(data?.data?.results) ? data.data.results : [];
  const correctCount = results.filter((result) => result.isCorrect).length;
  const total = results.length;
  const scorePercent = total ? Math.round((correctCount / total) * 100) : 0;

  const handleDelete = async () => {
    if (!quizId) {
      return;
    }
    try {
      await deleteQuizResult(quizId).unwrap();
      toast.success('Quiz result deleted.');
      navigate('/documents');
    } catch {
      toast.error('Failed to delete quiz result.');
    }
  };

  if (!quizId) {
    return <p className="text-sm text-red-600">Quiz ID is missing.</p>;
  }

  if (isLoading) {
    return <Spinner label="Loading quiz results..." />;
  }

  if (isError || !quiz) {
    return <p className="text-sm text-red-600">Failed to load quiz results.</p>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800">{quiz.title}</h2>
        <p className="mt-1 text-sm text-slate-600">Document: {quiz.document?.title || 'Unknown'}</p>
        <p className="mt-4 text-3xl font-bold text-slate-800">{scorePercent}%</p>
        <p className="mt-1 text-sm text-slate-600">Correct: {correctCount} / {total}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" className="border-slate-300">
            <Link to="/documents">Back to Documents</Link>
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete Result'}
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        {results.map((item) => (
          <article key={item.questionIndex} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              {item.isCorrect ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <p className="font-semibold text-slate-800">Question {item.questionIndex + 1}</p>
            </div>
            <p className="text-sm text-slate-800">{item.question}</p>
            <p className="mt-2 text-sm text-slate-700">Your answer: <span className="font-medium">{item.selectedAnswer || 'Not answered'}</span></p>
            <p className="mt-1 text-sm text-slate-700">Correct answer: <span className="font-medium">{item.correctAnswer}</span></p>
            {item.explanation ? (
              <p className="mt-2 rounded-md bg-slate-50 p-2 text-sm text-slate-600">{item.explanation}</p>
            ) : null}
          </article>
        ))}
      </section>
    </div>
  );
};

export default QuizzesResultsPage;