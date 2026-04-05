import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Star, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/button';
import Spinner from '../../components/Spinner';
import {
  useGetAllFlashcardsQuery,
  useReviewFlashcardMutation,
  useToggleFlashcardMutation,
} from '@/services/flashcardApi';

const FlashCardPage = () => {
  const { id } = useParams();
  const { data, isLoading, isError } = useGetAllFlashcardsQuery();
  const [toggleFlashcard] = useToggleFlashcardMutation();
  const [reviewFlashcard] = useReviewFlashcardMutation();

  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const flashcardSet = useMemo(() => {
    const allSets = Array.isArray(data?.data) ? data.data : [];
    return allSets.find((item) => item._id === id) || null;
  }, [data, id]);

  const cards = flashcardSet?.cards || [];
  const currentCard = cards[index] || null;

  const goNext = () => {
    setShowAnswer(false);
    setIndex((prev) => (prev + 1 >= cards.length ? 0 : prev + 1));
  };

  const goPrevious = () => {
    setShowAnswer(false);
    setIndex((prev) => (prev - 1 < 0 ? cards.length - 1 : prev - 1));
  };

  const handleToggleStar = async () => {
    if (!currentCard || !flashcardSet) {
      return;
    }
    try {
      await toggleFlashcard({ setId: flashcardSet._id, cardId: currentCard._id }).unwrap();
      toast.success('Flashcard updated.');
    } catch {
      toast.error('Failed to update flashcard.');
    }
  };

  const handleReview = async () => {
    if (!currentCard || !flashcardSet) {
      return;
    }
    try {
      await reviewFlashcard({ setId: flashcardSet._id, cardId: currentCard._id, performance: 'good' }).unwrap();
      toast.success('Review saved.');
    } catch {
      toast.error('Failed to save review.');
    }
  };

  if (isLoading) {
    return <Spinner label="Loading flashcard set..." />;
  }

  if (isError || !flashcardSet) {
    return <p className="text-sm text-red-600">Flashcard set not found.</p>;
  }

  if (!currentCard) {
    return <p className="text-sm text-slate-600">No cards found in this set.</p>;
  }

  return (
    <div className="space-y-6">
      <section className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Study Flashcards</h2>
          <p className="mt-1 text-sm text-slate-600">{flashcardSet.documentId?.title || 'Document'} • Card {index + 1} of {cards.length}</p>
        </div>
        <Button asChild variant="outline" className="border-slate-300">
          <Link to="/flashcards">Back</Link>
        </Button>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">{showAnswer ? 'Answer' : 'Question'}</p>
        <p className="min-h-28 text-lg leading-7 text-slate-800 whitespace-pre-wrap">
          {showAnswer ? currentCard.answer : currentCard.question}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Button variant="outline" className="border-slate-300" onClick={() => setShowAnswer((prev) => !prev)}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {showAnswer ? 'Show Question' : 'Show Answer'}
          </Button>
          <Button variant="outline" className="border-slate-300" onClick={handleToggleStar}>
            <Star className={`mr-2 h-4 w-4 ${currentCard.isStarred ? 'fill-yellow-400 text-yellow-500' : ''}`} />
            {currentCard.isStarred ? 'Unstar' : 'Star'}
          </Button>
          <Button className="bg-slate-800 text-white hover:bg-slate-700" onClick={handleReview}>
            Mark Reviewed
          </Button>
        </div>
      </section>

      <section className="flex items-center justify-between">
        <Button variant="outline" className="border-slate-300" onClick={goPrevious}>Previous</Button>
        <Button className="bg-slate-800 text-white hover:bg-slate-700" onClick={goNext}>Next</Button>
      </section>
    </div>
  );
};

export default FlashCardPage;