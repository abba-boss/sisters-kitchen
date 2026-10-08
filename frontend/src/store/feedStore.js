import { create } from 'zustand';
export const useFeedStore = create((set, get) => ({
  posts: [], page: 1, hasMore: true, loading: false,
  filter: { type: '', vendorId: '', search: '' },
  setPosts:    (posts) => set({ posts }),
  appendPosts: (posts) => set({ posts: [...get().posts, ...posts] }),
  setPage:     (p) => set({ page: p }),
  setHasMore:  (v) => set({ hasMore: v }),
  setLoading:  (v) => set({ loading: v }),
  setFilter:   (f) => set({ filter: { ...get().filter, ...f }, page: 1, posts: [], hasMore: true }),
  reset:       () => set({ posts: [], page: 1, hasMore: true, loading: false }),
  toggleLike:  (id, liked, count) => set({ posts: get().posts.map(p => p.id === id ? { ...p, likesCount: count, _liked: liked } : p) }),
  bumpComments:(id, d = 1) => set({ posts: get().posts.map(p => p.id === id ? { ...p, commentsCount: (p.commentsCount || 0) + d } : p) }),
  prependPost: (post) => { if (get().posts.find(p => p.id === post.id)) return; set({ posts: [post, ...get().posts] }); },
  removePost:  (id) => set({ posts: get().posts.filter(p => p.id !== id) }),
}));
