import { get } from 'node:http';
import { getAllFlashcards } from '../../../Backend/controllers/flashCardController';
import {api} from './api';

export const flashcardApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getAllFlashcards: builder.query({
            query:() => '/flashcards/all',
            providesTags: ['Flashcard'],
        }),
        getFlashcardsByDocument: builder.query({
            query: (documentId) => `/flashcards/document/${documentId}`,
            providesTags: ['Flashcard'],
        }),
        reviewFlashcard: builder.mutation({
            query: ({ setId, cardId, performance }) => ({
                url: `/flashcards/${setId}/cards/${cardId}/review`,
                method: 'POST',
                body: { performance },
            }),
            invalidatesTags: (result, error, { setId }) => [{ type: 'Flashcard', id: setId }],
        }),
        toggleFlashcard: builder.mutation({
            query: ({ setId, cardId }) => ({
                url: `/flashcards/${setId}/cards/${cardId}/toggle`,
                method: 'PATCH',
            }),
            invalidatesTags: (result, error, { setId }) => [{ type: 'Flashcard', id: setId }],
        }),
        deleteFlashcard: builder.mutation({
            query: (id) => ({
                url: `/flashcards/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Flashcard'],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetAllFlashcardsQuery,
    useGetFlashcardsByDocumentQuery,
    useReviewFlashcardMutation,
    useToggleFlashcardMutation,
    useDeleteFlashcardMutation
} = flashcardApi;
