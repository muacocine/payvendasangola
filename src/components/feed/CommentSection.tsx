import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
}

interface CommentSectionProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  onCommentCountChange?: (count: number) => void;
}

export const CommentSection = ({ postId, isOpen, onClose, onCommentCountChange }: CommentSectionProps) => {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, postId]);

  const fetchComments = async () => {
    const { data } = await supabase
      .from('post_comments')
      .select(`
        id,
        content,
        user_id,
        created_at
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (data) {
      // Fetch user profiles for comments
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      const commentsWithUsers = data.map(comment => {
        const userProfile = profiles?.find(p => p.user_id === comment.user_id);
        return {
          ...comment,
          user_name: userProfile?.full_name || 'Usuário',
          user_avatar: userProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user_id}`
        };
      });

      setComments(commentsWithUsers);
      onCommentCountChange?.(commentsWithUsers.length);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setIsLoading(true);

    const { error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content: newComment.trim()
      });

    if (error) {
      toast.error("Erro ao comentar");
    } else {
      setNewComment("");
      fetchComments();
      toast.success("Comentário adicionado!");
    }

    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="mt-3 pt-3 border-t border-border"
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-foreground">Comentários ({comments.length})</h4>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-muted">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        {/* Comments List */}
        <div className="space-y-3 max-h-48 overflow-y-auto mb-3">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              Seja o primeiro a comentar
            </p>
          ) : (
            comments.map((comment, index) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-2"
              >
                <img
                  src={comment.user_avatar}
                  alt={comment.user_name}
                  className="w-7 h-7 rounded-full bg-muted flex-shrink-0"
                />
                <div className="flex-1 bg-muted/50 rounded-xl px-3 py-2">
                  <p className="text-xs font-medium text-foreground">{comment.user_name}</p>
                  <p className="text-sm text-foreground mt-0.5">{comment.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(comment.created_at).toLocaleString('pt-AO', { 
                      day: '2-digit', 
                      month: 'short', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Comment Input */}
        {user ? (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <img
              src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
              alt="Your avatar"
              className="w-8 h-8 rounded-full bg-muted flex-shrink-0"
            />
            <div className="flex-1 flex gap-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escreva um comentário..."
                className="flex-1 h-9 text-sm"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                size="sm" 
                disabled={!newComment.trim() || isLoading}
                className="h-9 px-3"
              >
                <Send size={14} />
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground text-center">
            Faça login para comentar
          </p>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
