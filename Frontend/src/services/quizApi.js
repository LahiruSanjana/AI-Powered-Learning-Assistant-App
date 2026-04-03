import { api } from './api';

export const quizApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getQuizzesByDocument: builder.query({
      query: (documentId) => `/quiz/${documentId}`,
      providesTags: ['Quiz'],
    }),
    getQuizById: builder.query({
      query: (quizId) => `/quiz/quiz/${quizId}`,
      providesTags: (result, error, quizId) => [{ type: 'Quiz', id: quizId }],
    }),
    submitQuiz: builder.mutation({
      query: ({ quizId, answers }) => ({
        url: `/quiz/${quizId}/submit`,
        method: 'POST',
        body: { answers },
      }),
      invalidatesTags: (result, error, { quizId }) => [{ type: 'Quiz', id: quizId }, 'Progress'],
    }),
    getQuizResults: builder.query({
      query: (quizId) => `/quiz/${quizId}/results`,
      providesTags: (result, error, quizId) => [{ type: 'Quiz', id: quizId }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetQuizzesByDocumentQuery,
  useGetQuizByIdQuery,
  useSubmitQuizMutation,
  useGetQuizResultsQuery,
} = quizApi;
