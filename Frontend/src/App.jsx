import React from 'react'
import { BrowserRouter,Routes,Route,Navigate } from 'react-router-dom';
import RegisterPage from './pages/Auth/RegisterPage';
import Login from './pages/Auth/LoginPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import DocumentListPage from './pages/Documents/DocumentListPage';
import DashboardDetailsPage from './pages/documents/Documentsdetailspage';
import FlashCardList from './pages/FlashCard/FlashCardList';
import FlashCardPage from './pages/FlashCard/FlashCardPage';
import QuizzesTakePage from './pages/Quizzes/QuizzesTakePage';
import QuizzesResultsPage from './pages/Quizzes/QuizzesResultsPage';
import ProfilePage from './pages/Profile/ProfilePage';
import ProtectedRoute from './component/auth/ProtectedRoute';



function App() {
 
  const isAuthenticated = false; // Replace with your actual authentication logic
  const loading = false; // Replace with your actual loading state

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-700" />
          <h2 className="text-lg font-semibold text-slate-800">Getting things ready</h2>
          <p className="mt-2 text-sm text-slate-600">Please wait a moment while we load your learning dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
          } />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute/>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/documents" element={<DocumentListPage />} />
          <Route path="/documents/:id" element={<DashboardDetailsPage />} />
          <Route path="/flashcards" element={<FlashCardList />} />
          <Route path="/flashcards/:id" element={<FlashCardPage />} />
          <Route path="/quizzes/take" element={<QuizzesTakePage />} />
          <Route path="/quizzes/results" element={<QuizzesResultsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>


        <Route path="*" element={<div>Profile Page</div>} />

      </Routes>
    </BrowserRouter>
  )
}

export default App
