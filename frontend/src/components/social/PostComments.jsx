import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader, Trash2, CornerDownRight } from 'lucide-react';
import { postService } from '../../services/postService';
import { useAuthStore } from '../../store/authStore';
import { useAuthModalStore } from '../../store/authModalStore';
import { timeAgo } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function PostComments({ postId, onNewComment }) {
  const [comments,  setComments]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [text,      setText]      = useState('');
  const [sending,   setSending]   = useState(false);
  const [replyTo,   setReplyTo]   = useState(null); // { id, name }
  const inputRef = useRef(null);

  const { isAuthenticated, user } = useAuthStore();
  const openAuth = useAuthModalStore((s) => s.open);

  useEffect(() => {
    postService.getComments(postId, { limit: 20 })
      .then(({ data }) => setComments(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId]);

  const handleSend = async () => {
    if (!isAuthenticated) { openAuth('Sign in to comment'); return; }
    if (!text.trim()) return;
    setSending(true);
    try {
      const body = { content: text.trim() };
      if (replyTo) body.parentId = replyTo.id;
      const { data } = await postService.addComment(postId, body);
      const newComment = data.data;

      if (replyTo) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyTo.id
              ? { ...c, replies: [...(c.replies || []), newComment] }
              : c
          )
        );
      } else {
        setComments((prev) => [newComment, ...prev]);
      }
      onNewComment?.();
      setText('');
      setReplyTo(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post comment');
    } finally { setSending(false); }
  };

  const handleDelete = async (commentId, parentId = null) => {
    try {
      await postService.deleteComment(postId, commentId);
      if (parentId) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId
              ? { ...c, replies: (c.replies || []).filter((r) => r.id !== commentId) }
              : c
          )
        );
      } else {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch { toast.error('Could not delete comment'); }
  };

  const triggerReply = (comment) => {
    setReplyTo({ id: comment.id, name: comment.user?.firstName });
    setText(`@${comment.user?.firstName} `);
    inputRef.current?.focus();
  };

  return (
    <div className="border-t border-orange-50 bg-brand-bg/30">
      {/* Comment list */}
      <div className="max-h-72 overflow-y-auto px-4 py-3 space-y-4 scrollbar-hide">
        {loading ? (
          <div className="flex justify-center py-4"><Loader size={18} className="animate-spin text-brand-muted" /></div>
        ) : comments.length === 0 ? (
          <p className="text-center text-xs text-brand-muted py-4">No comments yet. Be the first!</p>
        ) : (
          comments.map((comment) => (
            <CommentRow
              key={comment.id}
              comment={comment}
              currentUserId={user?.id}
              onDelete={handleDelete}
              onReply={triggerReply}
            />
          ))
        )}
      </div>

      {/* Reply indicator */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden px-4 pb-1"
          >
            <div className="flex items-center gap-2 bg-primary/5 rounded-lg px-3 py-1.5 text-xs text-primary">
              <CornerDownRight size={12} />
              <span>Replying to <strong>{replyTo.name}</strong></span>
              <button onClick={() => { setReplyTo(null); setText(''); }} className="ml-auto text-brand-muted hover:text-red-500">✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 flex items-center gap-3 border-t border-orange-50">
        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
          {user?.avatar
            ? <img src={user.avatar} alt="" className="w-full h-full object-cover rounded-full" />
            : <span className="text-primary font-bold text-xs">{user?.firstName?.[0] || '?'}</span>
          }
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder={isAuthenticated ? 'Add a comment…' : 'Sign in to comment…'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => { if (!isAuthenticated) openAuth('Sign in to comment'); }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          className="flex-1 bg-white border border-orange-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary-dark transition-all disabled:opacity-50"
        >
          {sending ? <Loader size={15} className="animate-spin" /> : <Send size={15} />}
        </button>
      </div>
    </div>
  );
}

function CommentRow({ comment, currentUserId, onDelete, onReply, depth = 0 }) {
  const isOwner = comment.user?.id === currentUserId;

  return (
    <div className={depth > 0 ? 'ml-8' : ''}>
      <div className="flex items-start gap-2.5 group">
        <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          {comment.user?.avatar
            ? <img src={comment.user.avatar} alt="" className="w-full h-full object-cover rounded-full" />
            : <span className="text-primary font-bold text-xs">{comment.user?.firstName?.[0]}</span>
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 shadow-card">
            <p className="text-xs font-semibold text-brand-dark mb-0.5">
              {comment.user?.firstName} {comment.user?.lastName}
            </p>
            <p className="text-sm text-brand-dark leading-relaxed">{comment.content}</p>
          </div>
          <div className="flex items-center gap-3 mt-1 px-1">
            <span className="text-xs text-brand-muted">{timeAgo(comment.createdAt)}</span>
            {depth === 0 && (
              <button onClick={() => onReply(comment)}
                className="text-xs text-brand-muted hover:text-primary transition-colors font-medium">
                Reply
              </button>
            )}
            {isOwner && (
              <button onClick={() => onDelete(comment.id, comment.parent?.id)}
                className="text-xs text-brand-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                <Trash2 size={11} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {comment.replies?.filter((r) => !r.isDeleted).map((reply) => (
        <CommentRow
          key={reply.id}
          comment={reply}
          currentUserId={currentUserId}
          onDelete={(id) => onDelete(id, comment.id)}
          onReply={onReply}
          depth={1}
        />
      ))}
    </div>
  );
}
