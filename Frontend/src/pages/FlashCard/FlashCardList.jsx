import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BookOpen, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import Spinner from '../../components/Spinner';
import { useDeleteFlashcardMutation, useGetAllFlashcardsQuery } from '@/services/flashcardApi';

const FlashCardList = () => {
  const { data, isLoading, isError } = useGetAllFlashcardsQuery();
  const [deleteFlashcard, { isLoading: isDeleting }] = useDeleteFlashcardMutation();

  const sets = Array.isArray(data?.data) ? data.data : [];

  const handleDelete = async (id) => {
    try {
      await deleteFlashcard(id).unwrap();
      toast.success('Flashcard set deleted.');
    } catch {
      toast.error('Failed to delete flashcard set.');
    }
  };

  if (isLoading) {
    return <Spinner label="Loading flashcards..." />;
  }

  if (isError) {
    return <p className="text-sm text-red-600">Failed to load flashcards.</p>;
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-bold text-slate-800">Flashcards</h2>
        <p className="mt-1 text-sm text-slate-600">Review all generated flashcard sets.</p>
      </section>

      {sets.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-700">No flashcards found</h3>
          <p className="mt-1 text-sm text-slate-500">Generate flashcards from a document details page.</p>
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {sets.map((set) => (
            <article key={set._id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800">{set.documentId?.title || 'Untitled Document'}</h3>
              <p className="mt-1 text-sm text-slate-500">Cards: {set.cards?.length || 0}</p>

              <div className="mt-4 flex items-center gap-2">
                <Button asChild variant="outline" className="border-slate-300">
                  <Link to={`/flashcards/${set._id}`}>Start Studying</Link>
                </Button>
                <Button variant="destructive" onClick={() => handleDelete(set._id)} disabled={isDeleting}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
};

export default FlashCardList;