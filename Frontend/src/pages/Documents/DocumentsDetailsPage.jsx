import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BrainCircuit, FileText, Sparkles, MessageSquare, BookOpen, ClipboardCheck } from 'lucide-react';
import { Button } from '../../components/ui/button';
import Spinner from '../../components/Spinner';
import { useGetDocumentByIdQuery } from '@/services/documentApi';
import {
  useChatWithDocumentMutation,
  useExplainConceptMutation,
  useGenerateFlashcardsMutation,
  useGenerateQuizMutation,
  useGenerateSummaryMutation,
  useGetChatHistoryQuery,
} from '@/services/aiApi';
import { useGetFlashcardsByDocumentQuery } from '@/services/flashcardApi';
import { useGetQuizzesByDocumentQuery } from '@/services/quizApi';

const DocumentsDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [summaryText, setSummaryText] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [conceptInput, setConceptInput] = useState('');
  const [conceptExplanation, setConceptExplanation] = useState('');

  const { data: documentData, isLoading } = useGetDocumentByIdQuery(id, { skip: !id });
  const { data: flashcardData } = useGetFlashcardsByDocumentQuery(id, { skip: !id });
  const { data: quizzesData } = useGetQuizzesByDocumentQuery(id, { skip: !id });
  const { data: chatHistoryData } = useGetChatHistoryQuery(id, { skip: !id });

  const [generateSummary, { isLoading: isGeneratingSummary }] = useGenerateSummaryMutation();
  const [generateFlashcards, { isLoading: isGeneratingFlashcards }] = useGenerateFlashcardsMutation();
  const [generateQuiz, { isLoading: isGeneratingQuiz }] = useGenerateQuizMutation();
  const [chatWithDocument, { isLoading: isChatting }] = useChatWithDocumentMutation();
  const [explainConcept, { isLoading: isExplaining }] = useExplainConceptMutation();

  const document = documentData?.data;
  const flashcardSets = useMemo(() => (Array.isArray(flashcardData?.data) ? flashcardData.data : []), [flashcardData]);
  const quizzes = useMemo(() => (Array.isArray(quizzesData?.data) ? quizzesData.data : []), [quizzesData]);
  const chatHistory = useMemo(() => (Array.isArray(chatHistoryData?.data) ? chatHistoryData.data : []), [chatHistoryData]);

  const handleGenerateSummary = async () => {
    try {
      const response = await generateSummary({ documentId: id }).unwrap();
      setSummaryText(response?.data || 'No summary generated.');
      toast.success('Summary generated successfully.');
    } catch {
      toast.error('Failed to generate summary.');
    }
  };

  const handleGenerateFlashcards = async () => {
    try {
      await generateFlashcards({ documentId: id, count: 10 }).unwrap();
      toast.success('Flashcards generated successfully.');
    } catch {
      toast.error('Failed to generate flashcards.');
    }
  };

  const handleGenerateQuiz = async () => {
    try {
      const response = await generateQuiz({ documentId: id, numQuestions: 10 }).unwrap();
      const quizId = response?.data?._id;
      toast.success('Quiz generated successfully.');
      if (quizId) {
        navigate(`/quizzes/take?quizId=${quizId}`);
      }
    } catch {
      toast.error('Failed to generate quiz.');
    }
  };

  const handleChat = async (event) => {
    event.preventDefault();
    if (!chatInput.trim()) {
      return;
    }

    try {
      await chatWithDocument({ documentId: id, message: chatInput.trim() }).unwrap();
      setChatInput('');
      toast.success('Question sent to AI.');
    } catch {
      toast.error('Failed to send chat message.');
    }
  };

  const handleExplainConcept = async (event) => {
    event.preventDefault();
    if (!conceptInput.trim()) {
      return;
    }

    try {
      const response = await explainConcept({ documentId: id, concept: conceptInput.trim() }).unwrap();
      setConceptExplanation(response?.data || 'No explanation available.');
    } catch {
      toast.error('Failed to explain concept.');
    }
  };

  if (isLoading) {
    return <Spinner label="Loading document details..." />;
  }

  if (!document) {
    return <p className="text-sm text-red-600">Document not found.</p>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{document.title}</h2>
            <p className="mt-1 text-sm text-slate-500">Status: {document.status || 'unknown'}</p>
          </div>
          <Button asChild variant="outline" className="border-slate-300">
            <Link to="/documents">Back to Documents</Link>
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Button className="bg-slate-800 text-white hover:bg-slate-700" onClick={handleGenerateSummary} disabled={isGeneratingSummary || document.status !== 'ready'}>
          <Sparkles className="mr-2 h-4 w-4" />
          {isGeneratingSummary ? 'Generating Summary...' : 'Generate Summary'}
        </Button>
        <Button className="bg-slate-800 text-white hover:bg-slate-700" onClick={handleGenerateFlashcards} disabled={isGeneratingFlashcards || document.status !== 'ready'}>
          <BookOpen className="mr-2 h-4 w-4" />
          {isGeneratingFlashcards ? 'Generating Flashcards...' : 'Generate Flashcards'}
        </Button>
        <Button className="bg-slate-800 text-white hover:bg-slate-700" onClick={handleGenerateQuiz} disabled={isGeneratingQuiz || document.status !== 'ready'}>
          <ClipboardCheck className="mr-2 h-4 w-4" />
          {isGeneratingQuiz ? 'Generating Quiz...' : 'Generate Quiz'}
        </Button>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-700" />
          <h3 className="text-lg font-semibold text-slate-800">Summary</h3>
        </div>
        <p className="text-sm leading-6 text-slate-700 whitespace-pre-wrap">
          {summaryText || 'Generate a summary to view key points from this document.'}
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-slate-700" />
            <h3 className="text-lg font-semibold text-slate-800">Chat with Document</h3>
          </div>
          <form onSubmit={handleChat} className="space-y-3">
            <textarea
              rows={3}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              placeholder="Ask a question about this document"
            />
            <Button type="submit" className="bg-slate-800 text-white hover:bg-slate-700" disabled={isChatting || document.status !== 'ready'}>
              {isChatting ? 'Sending...' : 'Send'}
            </Button>
          </form>

          <div className="mt-4 space-y-2">
            {chatHistory.slice(-6).map((message, index) => (
              <div key={`${message.role}-${index}`} className="rounded-md border border-slate-200 bg-slate-50 p-2 text-sm">
                <p className="mb-1 text-xs font-medium uppercase text-slate-500">{message.role}</p>
                <p className="text-slate-700 whitespace-pre-wrap">{message.content}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-slate-700" />
            <h3 className="text-lg font-semibold text-slate-800">Explain Concept</h3>
          </div>

          <form onSubmit={handleExplainConcept} className="space-y-3">
            <input
              type="text"
              value={conceptInput}
              onChange={(e) => setConceptInput(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              placeholder="Enter a concept to explain"
            />
            <Button type="submit" className="bg-slate-800 text-white hover:bg-slate-700" disabled={isExplaining || document.status !== 'ready'}>
              {isExplaining ? 'Explaining...' : 'Explain'}
            </Button>
          </form>

          <p className="mt-4 text-sm leading-6 text-slate-700 whitespace-pre-wrap">
            {conceptExplanation || 'Ask AI to explain any concept from this document.'}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold text-slate-800">Flashcard Sets ({flashcardSets.length})</h3>
          {flashcardSets.length === 0 ? (
            <p className="text-sm text-slate-500">No flashcard sets yet.</p>
          ) : (
            <ul className="space-y-2">
              {flashcardSets.map((set) => (
                <li key={set._id} className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-sm">
                  <p className="text-slate-700">Cards: {set.cards?.length || 0}</p>
                  <Button asChild variant="outline" className="border-slate-300">
                    <Link to={`/flashcards/${set._id}`}>Study</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold text-slate-800">Quizzes ({quizzes.length})</h3>
          {quizzes.length === 0 ? (
            <p className="text-sm text-slate-500">No quizzes yet.</p>
          ) : (
            <ul className="space-y-2">
              {quizzes.map((quiz) => (
                <li key={quiz._id} className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-700">{quiz.title}</p>
                    <p className="text-xs text-slate-500">{quiz.completedAt ? 'Completed' : 'Not completed'}</p>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    className="border-slate-300"
                  >
                    <Link to={quiz.completedAt ? `/quizzes/results?quizId=${quiz._id}` : `/quizzes/take?quizId=${quiz._id}`}>
                      {quiz.completedAt ? 'View Results' : 'Take Quiz'}
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
};

export default DocumentsDetailsPage;