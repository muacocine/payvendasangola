import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Copy, Share2, Gift, TrendingUp, CheckCircle, Clock, Link as LinkIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";

interface Referral {
  id: string;
  referred_id: string;
  status: string;
  commission_earned: number;
  created_at: string;
  activated_at: string | null;
  referred_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

const Referrals = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      refreshProfile();
      fetchReferrals();
    }
  }, [user]);

  const fetchReferrals = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const referralsWithProfiles = await Promise.all(
        (data || []).map(async (ref) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', ref.referred_id)
            .single();
          
          return {
            ...ref,
            referred_profile: profileData
          };
        })
      );

      setReferrals(referralsWithProfiles);
    } catch (error) {
      console.error('Error fetching referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate unique referral link with UUID
  const referralLink = profile?.referral_code 
    ? `${window.location.origin}/registro?ref=${profile.referral_code}`
    : '';

  const copyReferralLink = async () => {
    if (!referralLink) return;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Link de afiliado copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erro ao copiar link');
    }
  };

  const shareReferral = async () => {
    if (!referralLink) return;
    
    const shareText = `🚀 Junte-se ao PayVendas - Ganhe dinheiro com trading!\n\nUse meu link e comece agora: ${referralLink}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PayVendas - Trading Platform',
          text: shareText,
          url: referralLink
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          copyReferralLink();
        }
      }
    } else {
      copyReferralLink();
    }
  };

  const totalEarnings = profile?.referral_earnings || 0;
  const totalReferrals = profile?.referral_count || 0;
  const activeReferrals = referrals.filter(r => r.status === 'active').length;

  return (
    <div className="min-h-screen bg-background pt-16 pb-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-display font-bold text-foreground mb-1">
            Programa de Afiliados
          </h1>
          <p className="text-muted-foreground text-sm">
            Convide amigos e ganhe 5% de comissão em cada lucro!
          </p>
        </motion.div>

        {/* Referral Link Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <GlassCard className="bg-gradient-to-br from-primary to-primary/80 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-white/20">
                <LinkIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Seu Link Único de Afiliado</p>
                <p className="text-lg font-bold font-mono">
                  {profile?.referral_code || 'Carregando...'}
                </p>
              </div>
            </div>

            {/* Full Link Display */}
            <div className="p-3 bg-white/10 rounded-xl mb-4 break-all">
              <code className="text-sm text-white/90">
                {referralLink || 'Gerando link...'}
              </code>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={copyReferralLink}
                variant="secondary"
                className="flex-1 gap-2 bg-white/20 hover:bg-white/30 text-white border-0"
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado!' : 'Copiar'}
              </Button>
              <Button
                onClick={shareReferral}
                className="flex-1 gap-2 bg-white text-primary hover:bg-white/90"
              >
                <Share2 className="w-4 h-4" />
                Compartilhar
              </Button>
            </div>
          </GlassCard>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          <GlassCard className="text-center py-4">
            <Users className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-display font-bold text-foreground">{totalReferrals}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </GlassCard>

          <GlassCard className="text-center py-4">
            <CheckCircle className="w-6 h-6 text-success mx-auto mb-2" />
            <p className="text-2xl font-display font-bold text-foreground">{activeReferrals}</p>
            <p className="text-xs text-muted-foreground">Ativos</p>
          </GlassCard>

          <GlassCard className="text-center py-4">
            <TrendingUp className="w-6 h-6 text-warning mx-auto mb-2" />
            <p className="text-xl font-display font-bold text-foreground">
              {totalEarnings.toLocaleString('pt-AO')}
            </p>
            <p className="text-xs text-muted-foreground">AOA</p>
          </GlassCard>
        </motion.div>

        {/* How it Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <Gift className="w-5 h-5 text-primary" />
              <h2 className="font-display font-semibold text-foreground">Como Funciona</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">1</div>
                <div>
                  <p className="font-medium text-foreground text-sm">Compartilhe seu link</p>
                  <p className="text-xs text-muted-foreground">Envie para amigos via WhatsApp, Facebook, etc.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">2</div>
                <div>
                  <p className="font-medium text-foreground text-sm">Eles se registram</p>
                  <p className="text-xs text-muted-foreground">Usando seu link único de afiliado</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">3</div>
                <div>
                  <p className="font-medium text-foreground text-sm">Ganhe comissões</p>
                  <p className="text-xs text-muted-foreground">5% de cada lucro que eles obtiverem!</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Referrals List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="font-display font-semibold text-foreground mb-4">Seus Indicados</h2>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-secondary rounded-xl animate-pulse" />
              ))}
            </div>
          ) : referrals.length === 0 ? (
            <GlassCard className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">Nenhum indicado ainda</p>
              <p className="text-sm text-muted-foreground">Compartilhe seu link e comece a ganhar!</p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <GlassCard key={referral.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {referral.referred_profile?.full_name || 'Usuário'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {referral.status === 'active' ? (
                            <span className="flex items-center gap-1 text-success">
                              <CheckCircle className="w-3 h-3" /> Ativo
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-warning">
                              <Clock className="w-3 h-3" /> Pendente
                            </span>
                          )}
                          <span>•</span>
                          <span>{new Date(referral.created_at).toLocaleDateString('pt-AO')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-success">
                        +{(referral.commission_earned || 0).toLocaleString('pt-AO')} AOA
                      </p>
                      <p className="text-xs text-muted-foreground">Comissão</p>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Referrals;
