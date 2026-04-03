import { api } from "./api";

export const documentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    uploadDocument: builder.mutation({
        query: (formData) => ({
            url: '/documents/upload',
            method: 'POST',
            body: formData,
        }),
        invalidatesTags: ['Document'],
    }),
    getDocuments: builder.query({
        query: () => '/documents',
        providesTags: ['Document'],
    }),
    getDocumentById: builder.query({
        query: (id) => `/documents/${id}`,
        providesTags: (result, error, id) => [{ type: 'Document', id }],
    }),
    deleteDocument: builder.mutation({
        query: (id) => ({
            url: `/documents/delete/${id}`,
            method: 'DELETE',
        }),
        invalidatesTags: (result, error, id) => [{ type: 'Document', id }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useUploadDocumentMutation,
  useGetDocumentsQuery,
  useGetDocumentByIdQuery,
  useDeleteDocumentMutation
} = documentApi;