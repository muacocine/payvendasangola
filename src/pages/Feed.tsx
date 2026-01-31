import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Share2, Bookmark, TrendingUp, TrendingDown, MoreHorizontal, Plus, Send } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CommentSection } from "@/components/feed/CommentSection";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FeedPost {
  id: string;
  user_id: string;
  content: string;
  profit_amount: number | null;
  is_profit: boolean | null;
  likes_count: number | null;
  comments_count: number | null;
  created_at: string | null;
  user_name?: string;
  user_avatar?: string;
  user_handle?: string;
  isLiked?: boolean;
}

const formatNumber = (num: number): string => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
};

const formatTimestamp = (date: string): string => {
  const now = new Date();
  const postDate = new Date(date);
  const diffMs = now.getTime() - postDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
};

const Feed = () => {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newProfitAmount, setNewProfitAmount] = useState<number | null>(null);
  const [newIsProfit, setNewIsProfit] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPosts();
    if (user) {
      fetchUserLikes();
    }
  }, [user]);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('feed_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      // Fetch user profiles
      const userIds = [...new Set(data.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      const postsWithUsers = data.map(post => {
        const userProfile = profiles?.find(p => p.user_id === post.user_id);
        return {
          ...post,
          user_name: userProfile?.full_name || 'Trader',
          user_avatar: userProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id}`,
          user_handle: `@trader_${post.user_id.slice(0, 6)}`
        };
      });

      setPosts(postsWithUsers);
    }
  };

  const fetchUserLikes = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', user.id);

    if (data) {
      setLikedPosts(new Set(data.map(l => l.post_id)));
    }
  };

  const toggleLike = async (postId: string) => {
    if (!user) {
      toast.error("Faça login para curtir");
      return;
    }

    const isLiked = likedPosts.has(postId);

    if (isLiked) {
      await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      setLikedPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });

      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, likes_count: Math.max(0, (p.likes_count || 0) - 1) }
          : p
      ));
    } else {
      await supabase
        .from('post_likes')
        .insert({ post_id: postId, user_id: user.id });

      setLikedPosts(prev => new Set([...prev, postId]));

      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, likes_count: (p.likes_count || 0) + 1 }
          : p
      ));
    }
  };

  const handleCreatePost = async () => {
    if (!user || !newContent.trim()) return;

    setIsSubmitting(true);

    const { error } = await supabase
      .from('feed_posts')
      .insert({
        user_id: user.id,
        content: newContent.trim(),
        profit_amount: newProfitAmount,
        is_profit: newIsProfit
      });

    if (error) {
      toast.error("Erro ao publicar");
    } else {
      toast.success("Publicado com sucesso!");
      setNewContent("");
      setNewProfitAmount(null);
      setIsCreating(false);
      fetchPosts();
    }

    setIsSubmitting(false);
  };

  const updateCommentCount = (postId: string, count: number) => {
    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, comments_count: count } : p
    ));
  };

  const canPublish = profile?.kyc_status === 'approved';

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">Feed</h1>
          <p className="text-sm text-muted-foreground">Ganhos e perdas reais</p>
        </div>
        {canPublish && (
          <Button 
            size="sm" 
            className="bg-primary text-primary-foreground"
            onClick={() => setIsCreating(true)}
          >
            <Plus size={16} className="mr-1" />
            Publicar
          </Button>
        )}
      </div>

      {/* Create Post Modal */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card w-full max-w-md rounded-2xl p-4 border border-border"
            >
              <h3 className="font-semibold text-lg text-foreground mb-4">Nova Publicação</h3>
              
              <Textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Compartilhe seu resultado de trading..."
                className="mb-4"
                rows={4}
              />

              <div className="mb-4">
                <label className="text-sm text-muted-foreground mb-2 block">Resultado (opcional)</label>
                <div className="flex gap-2 mb-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={newIsProfit ? "default" : "outline"}
                    onClick={() => setNewIsProfit(true)}
                    className={newIsProfit ? "bg-success text-white" : ""}
                  >
                    <TrendingUp size={14} className="mr-1" />
                    Lucro
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={!newIsProfit ? "default" : "outline"}
                    onClick={() => setNewIsProfit(false)}
                    className={!newIsProfit ? "bg-destructive text-white" : ""}
                  >
                    <TrendingDown size={14} className="mr-1" />
                    Perda
                  </Button>
                </div>
                <input
                  type="number"
                  value={newProfitAmount || ''}
                  onChange={(e) => setNewProfitAmount(e.target.value ? Number(e.target.value) : null)}
                  placeholder="Valor em AOA"
                  className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreating(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreatePost}
                  disabled={!newContent.trim() || isSubmitting}
                  className="flex-1"
                >
                  <Send size={14} className="mr-1" />
                  Publicar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Posts List */}
      <AnimatePresence>
        {posts.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-muted-foreground">Nenhuma publicação ainda</p>
            <p className="text-sm text-muted-foreground mt-1">Seja o primeiro a compartilhar!</p>
          </GlassCard>
        ) : (
          posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="mb-4"
            >
              <GlassCard className="p-4">
                <div className="flex gap-3">
                  <img
                    src={post.user_avatar}
                    alt={post.user_name}
                    className="w-10 h-10 rounded-full bg-muted"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="font-semibold text-foreground text-sm">{post.user_name}</span>
                        <span className="text-muted-foreground text-xs">{post.user_handle}</span>
                        <span className="text-muted-foreground text-xs">· {formatTimestamp(post.created_at || '')}</span>
                      </div>
                      <button className="p-1 rounded-full hover:bg-muted text-muted-foreground">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>

                    <p className="text-foreground text-sm mt-2 whitespace-pre-wrap">{post.content}</p>

                    {post.profit_amount !== null && (
                      <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className={`inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-xl text-sm ${
                          post.is_profit
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {post.is_profit ? (
                          <TrendingUp size={16} />
                        ) : (
                          <TrendingDown size={16} />
                        )}
                        <span className="font-bold">
                          {post.is_profit ? "+" : "-"}
                          {post.profit_amount.toLocaleString('pt-AO', {
                            style: 'currency',
                            currency: 'AOA'
                          })}
                        </span>
                      </motion.div>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-2">
                      <button 
                        onClick={() => setOpenComments(openComments === post.id ? null : post.id)}
                        className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <MessageCircle size={16} />
                        <span className="text-xs">{post.comments_count || 0}</span>
                      </button>
                      <button className="flex items-center gap-1 text-muted-foreground hover:text-success transition-colors">
                        <Share2 size={16} />
                      </button>
                      <button
                        onClick={() => toggleLike(post.id)}
                        className={`flex items-center gap-1 transition-colors ${
                          likedPosts.has(post.id)
                            ? "text-destructive"
                            : "text-muted-foreground hover:text-destructive"
                        }`}
                      >
                        <Heart
                          size={16}
                          className={likedPosts.has(post.id) ? "fill-current" : ""}
                        />
                        <span className="text-xs">{post.likes_count || 0}</span>
                      </button>
                      <button className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                        <Bookmark size={16} />
                      </button>
                    </div>

                    {/* Comments Section */}
                    <CommentSection
                      postId={post.id}
                      isOpen={openComments === post.id}
                      onClose={() => setOpenComments(null)}
                      onCommentCountChange={(count) => updateCommentCount(post.id, count)}
                    />
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </AppLayout>
  );
};

export default Feed;
