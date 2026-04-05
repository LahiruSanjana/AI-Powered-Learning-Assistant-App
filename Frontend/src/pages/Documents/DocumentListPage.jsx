import { useEffect, useMemo, useState } from 'react';
import { Plus, Upload, Trash2, FileText, X, Eye } from 'lucide-react';
import { Button } from '../../components/ui/button';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import {
  useDeleteDocumentMutation,
  useGetDocumentsQuery,
  useUploadDocumentMutation,
} from '@/services/documentApi';
import Spinner from '../../components/Spinner';

const DocumentListPage = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const { data, isLoading, isError } = useGetDocumentsQuery();
  const [uploadDocument, { isLoading: isUploading }] = useUploadDocumentMutation();
  const [deleteDocument] = useDeleteDocumentMutation();

  const documents = useMemo(() => {
    if (Array.isArray(data?.data)) {
      return data.data;
    }
    return [];
  }, [data]);

  useEffect(() => {
    if (isError) {
      toast.error('Failed to load documents. Please try again later.', {
        duration: 5000,
      });
    }
  }, [isError]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFile(file);
      if (!uploadTitle.trim()) {
        setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle.trim()) {
      toast.error('Please select a file and provide a title.');
      return;
    }
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('title', uploadTitle);

    try {
      await uploadDocument(formData).unwrap();
      toast.success('Document uploaded successfully!');
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadTitle('');
    } catch {
      toast.error('Failed to upload document. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!selectedDoc) return;
    try {
      await deleteDocument(selectedDoc._id).unwrap();
      toast.success('Document deleted successfully!');
      setIsDeleteModalOpen(false);
      setSelectedDoc(null);
    } catch {
      toast.error('Failed to delete document. Please try again.');
    }
  };

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

  if (isLoading) {
    return <Spinner label="Loading documents..." />;
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">My Documents</h2>
          <p className="mt-1 text-sm text-slate-600">Upload notes and generate summaries, flashcards, and quizzes.</p>
        </div>

        <Button onClick={() => setIsUploadModalOpen(true)} className="bg-slate-800 text-white hover:bg-slate-700">
          <Plus className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </section>

      {isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load your documents. Please refresh and try again.
        </div>
      ) : null}

      {!isError && documents.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-700">No documents yet</h3>
          <p className="mt-1 text-sm text-slate-500">Upload your first PDF to start learning with AI tools.</p>
          <Button onClick={() => setIsUploadModalOpen(true)} className="mt-4 bg-slate-800 text-white hover:bg-slate-700">
            <Upload className="mr-2 h-4 w-4" />
            Upload Now
          </Button>
        </div>
      ) : null}

      {!isError && documents.length > 0 ? (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {documents.map((doc) => (
            <article key={doc._id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">{doc.title || 'Untitled document'}</h3>
                  <p className="mt-1 text-xs text-slate-500">Uploaded: {formatDate(doc.uploadDate || doc.createdAt)}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    doc.status === 'ready'
                      ? 'bg-emerald-100 text-emerald-700'
                      : doc.status === 'processing'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                  }`}
                >
                  {doc.status || 'unknown'}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
                <span className="rounded-md bg-slate-100 px-2 py-1">Flashcards: {doc.flashcardCount ?? 0}</span>
                <span className="rounded-md bg-slate-100 px-2 py-1">Quizzes: {doc.quizCount ?? 0}</span>
              </div>

              <div className="mt-5 flex items-center gap-2">
                <Button asChild variant="outline" className="border-slate-300">
                  <Link to={`/documents/${doc._id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setSelectedDoc(doc);
                    setIsDeleteModalOpen(true);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {isUploadModalOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Upload Document</h3>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
                aria-label="Close upload modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="document-title">
                  Title
                </label>
                <input
                  id="document-title"
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                  placeholder="Enter document title"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="document-file">
                  PDF File
                </label>
                <input
                  id="document-file"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-white hover:file:bg-slate-700"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-slate-300"
                  onClick={() => setIsUploadModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-slate-800 text-white hover:bg-slate-700" disabled={isUploading}>
                  {isUploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isDeleteModalOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-800">Delete Document</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete <span className="font-medium text-slate-800">{selectedDoc?.title}</span>? This action cannot be undone.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-slate-300"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedDoc(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default DocumentListPage;