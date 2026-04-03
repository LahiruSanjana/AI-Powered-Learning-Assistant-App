import { api } from "./api";

export const progressApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProgress: builder.query({
        query: () => '/progress/dashboard',
        providesTags: ['Progress'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetProgressQuery,
} = progressApi;