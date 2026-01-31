import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wallet, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Share2,
  X,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ProfessionalTradingChart } from "@/components/trading/ProfessionalTradingChart";
import { useAuth } from "@/hooks/useAuth";
import { BottomNavigation } from "@/components/navigation/BottomNavigation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import biolosLogo from "@/assets/biolos-logo.png";

const Trading = () => {
  const { user, profile } = useAuth();
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [demoBalance, setDemoBalance] = useState(10000);
  const [showPostPrompt, setShowPostPrompt] = useState(false);
  const [lastTradeResult, setLastTradeResult] = useState<{ isWin: boolean; amount: number; pair: string } | null>(null);
  const [postContent, setPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const currentBalance = isDemoMode ? demoBalance : (profile?.balance || 0);

  const handleTradeComplete = (isWin: boolean, amount: number, pair: string) => {
    if (!isDemoMode && user && profile?.kyc_status === 'approved') {
      setLastTradeResult({ isWin, amount, pair });
      setPostContent(isWin 
        ? `Acabei de lucrar ${amount.toLocaleString('pt-AO')} AOA em ${pair}! 🚀💰`
        : `Perdi ${amount.toLocaleString('pt-AO')} AOA em ${pair} 📉 Faz parte do jogo!`
      );
      setShowPostPrompt(true);
    }
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
    <div className="min-h-screen bg-[#0a0e14] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0c1018] border-b border-white/5">
        <div className="flex items-center gap-3">
          <img src={biolosLogo} alt="BIOLOS" className="h-8" />
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
          
          {/* Mode Toggle */}
          <button
            onClick={() => setIsDemoMode(!isDemoMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              isDemoMode 
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            <Zap size={14} />
            {isDemoMode ? 'DEMO' : 'REAL'}
          </button>
        </div>
      </div>

      {/* Risk Warning */}
      <div className="px-4 py-2 bg-rose-500/10 border-b border-rose-500/20">
        <div className="flex items-center justify-center gap-2">
          <AlertTriangle className="text-rose-400" size={14} />
          <p className="text-xs text-rose-300">
            <span className="font-semibold">AVISO:</span> Trading envolve riscos. Invista com responsabilidade.
          </p>
        </div>
      </div>

      {/* Demo Mode Banner */}
      <AnimatePresence>
        {isDemoMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20"
          >
            <p className="text-xs text-center text-amber-400">
              🎮 Modo Demo - Pratique sem risco com dinheiro virtual
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trading Chart - Full height */}
      <div className="flex-1 min-h-0 pb-16">
        <ProfessionalTradingChart 
          isDemoMode={isDemoMode} 
          balance={currentBalance}
          onBalanceChange={(newBalance) => {
            if (isDemoMode) {
              setDemoBalance(newBalance);
            }
          }}
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

      <BottomNavigation />
    </div>
  );
};

export default Trading;
