import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Copy, Share2, Gift, TrendingUp, CheckCircle, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      fetchReferrals();
    }
  }, [user]);

  const fetchReferrals = async () => {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch referred profiles
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

  const copyReferralCode = async () => {
    if (!profile?.referral_code) return;
    
    const referralLink = `${window.location.origin}/registro?ref=${profile.referral_code}`;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Link de referência copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erro ao copiar link');
    }
  };

  const shareReferral = async () => {
    if (!profile?.referral_code) return;
    
    const referralLink = `${window.location.origin}/registro?ref=${profile.referral_code}`;
    const shareText = `🚀 Junte-se ao BIOLOS - a melhor plataforma de trading de Angola! Use meu código de referência e comece a lucrar: ${referralLink}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'BIOLOS - Trading Platform',
          text: shareText,
          url: referralLink
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast.error('Erro ao compartilhar');
        }
      }
    } else {
      copyReferralCode();
    }
  };

  const totalEarnings = (profile as any)?.referral_earnings || 0;
  const totalReferrals = referrals.length;
  const activeReferrals = referrals.filter(r => r.status === 'active').length;

  return (
    <AppLayout>
      <div className="min-h-screen bg-background pb-24">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Programa de Afiliados
            </h1>
            <p className="text-muted-foreground">
              Convide amigos e ganhe 5% de comissão em cada lucro deles!
            </p>
          </motion.div>

          {/* Referral Code Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-primary/20">
                    <Gift className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Seu Código de Referência</p>
                    <p className="text-2xl font-bold text-primary font-mono">
                      {profile?.referral_code || 'Carregando...'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={copyReferralCode}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copiado!' : 'Copiar Link'}
                </Button>
                <Button
                  onClick={shareReferral}
                  className="flex-1 gap-2 btn-neon"
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
            className="grid grid-cols-3 gap-4 mb-6"
          >
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-4 text-center">
                <Users className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{totalReferrals}</p>
                <p className="text-xs text-muted-foreground">Total Indicados</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-4 text-center">
                <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{activeReferrals}</p>
                <p className="text-xs text-muted-foreground">Ativos</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">
                  {totalEarnings.toLocaleString('pt-AO')}
                </p>
                <p className="text-xs text-muted-foreground">AOA Ganhos</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* How it Works */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />
                  Como Funciona
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">1</div>
                  <p className="text-sm text-muted-foreground">Compartilhe seu link de referência com amigos</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">2</div>
                  <p className="text-sm text-muted-foreground">Eles se registram usando seu código</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">3</div>
                  <p className="text-sm text-muted-foreground">Ganhe 5% de comissão em cada lucro que eles obtiverem no trading!</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Referrals List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-lg font-semibold text-foreground mb-4">Seus Indicados</h2>
            
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-card/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : referrals.length === 0 ? (
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Você ainda não tem indicados. Compartilhe seu link e comece a ganhar!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {referrals.map((referral) => (
                  <Card key={referral.id} className="bg-card/50 border-border/50">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {referral.referred_profile?.full_name || 'Usuário'}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {referral.status === 'active' ? (
                              <span className="flex items-center gap-1 text-green-500">
                                <CheckCircle className="w-3 h-3" /> Ativo
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-yellow-500">
                                <Clock className="w-3 h-3" /> Pendente
                              </span>
                            )}
                            <span>•</span>
                            <span>{new Date(referral.created_at).toLocaleDateString('pt-AO')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-500">
                          +{referral.commission_earned?.toLocaleString('pt-AO') || 0} AOA
                        </p>
                        <p className="text-xs text-muted-foreground">Comissão</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Referrals;
