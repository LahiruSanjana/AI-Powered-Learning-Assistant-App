import { api } from './api';

export const aiApi = api.injectEndpoints({
    endpoints: (builder) => ({
        generateFlashcards: builder.mutation({
            query: ({ documentId, count = 10 }) => ({
                url: '/ai/generate-flashcards',
                method: 'POST',
                body: { documentId, count },
            }),
            invalidatesTags: ['Flashcard'],
        }),
        generateQuiz: builder.mutation({
            query: ({ documentId, numQuestions = 10, title }) => ({
                url: '/ai/generate-quiz',
                method: 'POST',
                body: { documentId, numQuestions, title },
            }),
            invalidatesTags: ['Quiz'],
        }),
        generateSummary: builder.mutation({
            query: ({ documentId }) => ({
                url: '/ai/generate-summary',
                method: 'POST',
                body: { documentId },
            }),
            invalidatesTags: ['Document'],
        }),
        chatWithDocument: builder.mutation({
            query: ({ documentId, message }) => ({
                url: '/ai/chat',
                method: 'POST',
                body: { documentId, message },
            }),
            invalidatesTags: ['Document'],
        }),
        explainConcept: builder.mutation({
            query: ({ documentId, concept }) => ({
                url: '/ai/explain',
                method: 'POST',
                body: { documentId, concept },
            }),
            invalidatesTags: ['Document'],
        }),
        getChatHistory: builder.query({
            query: (documentId) => `/ai/chat-history/${documentId}`,
            providesTags: ['Document'],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGenerateFlashcardsMutation,
    useGenerateQuizMutation,
    useGenerateSummaryMutation,
    useChatWithDocumentMutation,
    useExplainConceptMutation,
    useGetChatHistoryQuery,
} = aiApi;