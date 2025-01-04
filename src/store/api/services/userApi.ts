import { baseApi } from '../baseApi';

export interface User {
  id: string;
  email: string;
  displayName: string;
  // Add other user fields as needed
}

export interface UpdateUserRequest {
  displayName?: string;
  // Add other updatable fields
}

export const userApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getUser: build.query<User, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'GET',
      }),
      providesTags: ['User'],
    }),

    getUserByEmail: build.query<User, string>({
      query: (email) => ({
        url: `/users/by-email/${email}`,
        method: 'GET',
      }),
      providesTags: ['User'],
    }),

    updateUser: build.mutation<User, { id: string; data: UpdateUserRequest }>({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    getUsers: build.query<User[], void>({
      query: () => ({
        url: '/users',
        method: 'GET',
      }),
      providesTags: ['User'],
    }),
  }),
});

export const {
  useGetUserQuery,
  useGetUserByEmailQuery,
  useUpdateUserMutation,
  useGetUsersQuery,
} = userApi; 