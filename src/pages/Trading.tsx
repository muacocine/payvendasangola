import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wallet, 
  TrendingUp,
  TrendingDown,
  Share2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ProfessionalTradingChart } from "@/components/trading/ProfessionalTradingChart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
const payvendasLogo = "/assets/payvendas-logo.png";

const Trading = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [showPostPrompt, setShowPostPrompt] = useState(false);
  const [lastTradeResult, setLastTradeResult] = useState<{ isWin: boolean; amount: number; pair: string } | null>(null);
  const [postContent, setPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const currentBalance = profile?.balance || 0;

  const handleTradeComplete = (isWin: boolean, amount: number, pair: string) => {
    if (user && profile?.kyc_status === 'approved') {
      setLastTradeResult({ isWin, amount, pair });
      setPostContent(isWin 
        ? `Acabei de lucrar ${amount.toLocaleString('pt-AO')} AOA em ${pair}!`
        : `Perdi ${amount.toLocaleString('pt-AO')} AOA em ${pair}. Faz parte do jogo!`
      );
      setShowPostPrompt(true);
      refreshProfile();
    }
  };

  const handleBalanceChange = (newBalance: number) => {
    // Balance is updated in real-time via the chart component
    refreshProfile();
  };

  const handlePublishResult = async () => {
    if (!user || !lastTradeResult) return;

    setIsPosting(true);

    const { error } = await supabase
      .from('feed_posts')
      .insert({
        user_id: user.id,
        content: postContent,
        profit_amount: lastTradeResult.amount,
        is_profit: lastTradeResult.isWin
      });

    if (error) {
      toast.error("Erro ao publicar");
    } else {
      toast.success("Resultado publicado no feed!");
    }

    setIsPosting(false);
    setShowPostPrompt(false);
    setLastTradeResult(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0e14] flex flex-col pt-14 pb-20 md:pb-0">
      {/* Balance Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0c1018] border-b border-white/5">
        <div className="flex items-center gap-3">
          <img src={payvendasLogo} alt="PayVendas" className="h-7" />
        </div>
        
        <div className="flex items-center gap-3">
          {/* Balance */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
            <Wallet className="text-primary" size={18} />
            <span className="font-mono font-bold text-white text-sm">
              {currentBalance.toLocaleString('pt-AO')}
            </span>
            <span className="text-white/50 text-xs">AOA</span>
          </div>
          
          {/* Real Mode Badge */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <TrendingUp size={14} />
            REAL
          </div>
        </div>
      </div>

      {/* Trading Chart - Full height */}
      <div className="flex-1 min-h-0 pb-16">
        <ProfessionalTradingChart 
          isDemoMode={false} 
          balance={currentBalance}
          onBalanceChange={handleBalanceChange}
          onTradeComplete={handleTradeComplete}
        />
      </div>

      {/* Post Result Modal */}
      <AnimatePresence>
        {showPostPrompt && lastTradeResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#12161f] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-white text-lg">Compartilhar Resultado</h3>
                <button 
                  onClick={() => setShowPostPrompt(false)}
                  className="text-white/40 hover:text-white p-1"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Result Badge */}
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl mb-4 ${
                lastTradeResult.isWin 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {lastTradeResult.isWin ? (
                  <TrendingUp size={18} />
                ) : (
                  <TrendingDown size={18} />
                )}
                <span className="font-bold font-mono">
                  {lastTradeResult.isWin ? '+' : '-'}{lastTradeResult.amount.toLocaleString('pt-AO')} AOA
                </span>
                <span className="text-sm opacity-80">em {lastTradeResult.pair}</span>
              </div>

              <Textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="Escreva algo sobre sua operação..."
                className="mb-4 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                rows={3}
              />

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowPostPrompt(false)}
                  className="flex-1 border-white/10 text-white/60 hover:text-white hover:bg-white/5"
                >
                  Não, obrigado
                </Button>
                <Button
                  onClick={handlePublishResult}
                  disabled={isPosting}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                >
                  <Share2 size={16} className="mr-2" />
                  Publicar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Trading;
