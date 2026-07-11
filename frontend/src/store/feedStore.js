import { create } from 'zustand';

export const useFeedStore = create((set, get) => ({
  posts:   [],
  page:    1,
  hasMore: true,
  loading: false,
  filter:  { type: '', vendorId: '', search: '' },

  setPosts:   (posts)   => set({ posts }),
  appendPosts:(posts)   => set({ posts: [...get().posts, ...posts] }),
  setPage:    (page)    => set({ page }),
  setHasMore: (v)       => set({ hasMore: v }),
  setLoading: (v)       => set({ loading: v }),
  setFilter:  (filter)  => set({ filter: { ...get().filter, ...filter }, page: 1, posts: [], hasMore: true }),
  reset:      ()        => set({ posts: [], page: 1, hasMore: true, loading: false }),

  // Optimistic like update
  toggleLike: (postId, liked, count) => {
    set({
      posts: get().posts.map((p) =>
        p.id === postId ? { ...p, likesCount: count, _liked: liked } : p
      ),
    });
  },

  // Optimistic comment count
  bumpComments: (postId, delta = 1) => {
    set({
      posts: get().posts.map((p) =>
        p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + delta } : p
      ),
    });
  },

  // Prepend new post (realtime)
  prependPost: (post) => {
    if (get().posts.find((p) => p.id === post.id)) return;
    set({ posts: [post, ...get().posts] });
  },

  removePost: (postId) => {
    set({ posts: get().posts.filter((p) => p.id !== postId) });
  },
}));
