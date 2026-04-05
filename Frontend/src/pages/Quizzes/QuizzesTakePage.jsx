import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Spinner from '../../components/Spinner';
import { Button } from '../../components/ui/button';
import { useGetQuizByIdQuery, useSubmitQuizMutation } from '@/services/quizApi';

const QuizzesTakePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const quizId = searchParams.get('quizId');

  const { data, isLoading, isError } = useGetQuizByIdQuery(quizId, { skip: !quizId });
  const [submitQuiz, { isLoading: isSubmitting }] = useSubmitQuizMutation();

  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  const quiz = data?.data;
  const questions = useMemo(() => (Array.isArray(quiz?.questions) ? quiz.questions : []), [quiz]);
  const activeQuestion = questions[activeQuestionIndex];

  const handleSelectAnswer = (questionIndex, selectedAnswer) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: selectedAnswer }));
  };

  const handleSubmitQuiz = async () => {
    const formattedAnswers = Object.entries(answers).map(([questionIndex, selectedAnswer]) => ({
      questionIndex: Number(questionIndex),
      selectedAnswer,
    }));

    if (formattedAnswers.length === 0) {
      toast.error('Please answer at least one question.');
      return;
    }

    try {
      await submitQuiz({ quizId, answers: formattedAnswers }).unwrap();
      toast.success('Quiz submitted successfully.');
      navigate(`/quizzes/results?quizId=${quizId}`);
    } catch {
      toast.error('Failed to submit quiz.');
    }
  };

  if (!quizId) {
    return <p className="text-sm text-red-600">Quiz ID is missing. Open this page from a quiz link.</p>;
  }

  if (isLoading) {
    return <Spinner label="Loading quiz..." />;
  }

  if (isError || !quiz) {
    return <p className="text-sm text-red-600">Quiz not found.</p>;
  }

  if (quiz.completedAt) {
    return (
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-800">Quiz already completed</h2>
        <p className="text-sm text-slate-600">You have already submitted this quiz.</p>
        <Button asChild className="bg-slate-800 text-white hover:bg-slate-700">
          <Link to={`/quizzes/results?quizId=${quizId}`}>View Results</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{quiz.title}</h2>
          <p className="mt-1 text-sm text-slate-600">Question {activeQuestionIndex + 1} of {questions.length}</p>
        </div>
        <Button asChild variant="outline" className="border-slate-300">
          <Link to="/documents">Back to Documents</Link>
        </Button>
      </section>

      {activeQuestion ? (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-lg font-semibold text-slate-800">{activeQuestion.question}</p>
          <div className="space-y-2">
            {activeQuestion.options?.map((option) => {
              const isSelected = answers[activeQuestionIndex] === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelectAnswer(activeQuestionIndex, option)}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm transition ${
                    isSelected
                      ? 'border-slate-700 bg-slate-100 text-slate-800'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="outline"
          className="border-slate-300"
          onClick={() => setActiveQuestionIndex((prev) => Math.max(prev - 1, 0))}
          disabled={activeQuestionIndex === 0}
        >
          Previous
        </Button>

        {activeQuestionIndex < questions.length - 1 ? (
          <Button className="bg-slate-800 text-white hover:bg-slate-700" onClick={() => setActiveQuestionIndex((prev) => prev + 1)}>
            Next
          </Button>
        ) : (
          <Button className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={handleSubmitQuiz} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
          </Button>
        )}
      </section>
    </div>
  );
};

export default QuizzesTakePage;