import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { 
  User,
  Wallet, 
  Upload,
  FileText,
  Camera,
  CheckCircle,
  Clock,
  XCircle,
  Copy,
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  AlertTriangle,
  Users,
  Gift,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  Shield,
  TrendingUp
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Profile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [salesData, setSalesData] = useState<{date: string; value: number}[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      refreshProfile();
      fetchSalesData();
    }
  }, [user]);

  const fetchSalesData = async () => {
    if (!user) return;
    
    try {
      // Fetch user's PDF sales (when someone bought their PDFs)
      const { data: purchases } = await supabase
        .from('pdf_purchases')
        .select('amount, created_at, product_id')
        .order('created_at', { ascending: true });
      
      // Get user's products
      const { data: myProducts } = await supabase
        .from('pdf_products')
        .select('id')
        .eq('user_id', user.id);
      
      const myProductIds = new Set(myProducts?.map(p => p.id) || []);
      
      // Filter purchases of user's products
      const mySales = purchases?.filter(p => myProductIds.has(p.product_id)) || [];
      
      // Calculate total sales
      const total = mySales.reduce((sum, sale) => sum + (sale.amount * 0.85), 0);
      setTotalSales(total);
      
      // Group by date for chart
      const salesByDate: Record<string, number> = {};
      mySales.forEach(sale => {
        const date = new Date(sale.created_at).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' });
        salesByDate[date] = (salesByDate[date] || 0) + (sale.amount * 0.85);
      });
      
      // Convert to array for chart
      const chartData = Object.entries(salesByDate).map(([date, value]) => ({ date, value }));
      
      // Add empty data if no sales
      if (chartData.length === 0) {
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          chartData.push({
            date: d.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' }),
            value: 0
          });
        }
      }
      
      setSalesData(chartData);
    } catch (error) {
      console.error('Error fetching sales data:', error);
    }
  };

  const copyIban = () => {
    if (profile?.iban_virtual) {
      navigator.clipboard.writeText(profile.iban_virtual);
      setCopied(true);
      toast.success("IBAN copiado!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFileUpload = async (file: File, type: 'document' | 'selfie') => {
    if (!user) return;
    
    setUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${type}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('kyc-documents')
        .getPublicUrl(fileName);
      
      const updateField = type === 'document' ? 'kyc_document_url' : 'kyc_selfie_url';
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [updateField]: publicUrl, kyc_status: 'pending' })
        .eq('user_id', user.id);
      
      if (updateError) throw updateError;
      
      toast.success(`${type === 'document' ? 'Documento' : 'Selfie'} enviado para análise do admin`);
      refreshProfile();
    } catch (error: any) {
      toast.error(`Erro ao enviar ${type === 'document' ? 'documento' : 'selfie'}`);
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const canTransact = profile?.kyc_status === 'approved';

  const getKycStatusInfo = () => {
    switch (profile?.kyc_status) {
      case 'approved':
        return { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', label: 'Aprovado' };
      case 'rejected':
        return { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Rejeitado' };
      default:
        return { icon: Clock, color: 'text-warning', bg: 'bg-warning/10', label: 'Pendente' };
    }
  };

  const kycStatus = getKycStatusInfo();
  const KycIcon = kycStatus.icon;

  return (
    <div className="min-h-screen bg-background pt-16 pb-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-white mb-6 shadow-lg"
        >
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User size={36} className="text-white" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="font-display text-2xl font-bold">
                {profile?.full_name || 'Usuário'}
              </h1>
              <p className="text-white/80 text-sm flex items-center gap-1 mt-1">
                <Mail size={14} />
                {user?.email}
              </p>
              {profile?.phone && (
                <p className="text-white/80 text-sm flex items-center gap-1 mt-0.5">
                  <Phone size={14} />
                  {profile.phone}
                </p>
              )}
            </div>
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 ${
              profile?.kyc_status === 'approved' 
                ? 'bg-white/20 text-white' 
                : 'bg-warning/80 text-white'
            }`}>
              <Shield size={12} />
              {profile?.kyc_status === 'approved' ? 'Verificado' : 'Pendente'}
            </div>
          </div>
          
          {/* Balance Display */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl">
              <p className="text-white/70 text-xs mb-1">Saldo Real</p>
              <p className="text-2xl font-display font-bold">
                {(profile?.balance || 0).toLocaleString('pt-AO')} <span className="text-sm text-white/70">AOA</span>
              </p>
            </div>
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl">
              <p className="text-white/70 text-xs mb-1">Saldo Bônus</p>
              <p className="text-2xl font-display font-bold text-warning">
                {(profile?.bonus_balance || 0).toLocaleString('pt-AO')} <span className="text-sm text-white/70">AOA</span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* IBAN Card */}
        <GlassCard className="mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CreditCard className="text-primary" size={20} />
            </div>
            <div>
              <p className="font-semibold text-foreground">IBAN Virtual PayVendas</p>
              <p className="text-xs text-muted-foreground">Sua conta exclusiva</p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-secondary border border-border">
            <div className="flex items-center justify-between">
              <code className="text-lg font-mono font-bold text-foreground tracking-wider">
                {profile?.iban_virtual || 'Carregando...'}
              </code>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={copyIban}
                className="text-primary h-9 px-3"
              >
                {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
              </Button>
            </div>
          </div>
        </GlassCard>

        {/* Quick Actions */}
        <GlassCard className="mb-4">
          <h3 className="font-display font-semibold text-foreground mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-3 gap-3">
            <Link to="/carteira">
              <Button 
                variant="outline"
                className="w-full flex flex-col items-center py-5 h-auto border-success/30 hover:bg-success/5"
              >
                <ArrowDownLeft size={22} className="mb-2 text-success" />
                <span className="text-xs font-medium">Depositar</span>
              </Button>
            </Link>
            <Link to="/carteira">
              <Button 
                variant="outline"
                className="w-full flex flex-col items-center py-5 h-auto border-warning/30 hover:bg-warning/5"
              >
                <ArrowUpRight size={22} className="mb-2 text-warning" />
                <span className="text-xs font-medium">Sacar</span>
              </Button>
            </Link>
            <Link to="/carteira">
              <Button 
                variant="outline"
                className="w-full flex flex-col items-center py-5 h-auto border-primary/30 hover:bg-primary/5"
              >
                <Send size={22} className="mb-2 text-primary" />
                <span className="text-xs font-medium">Transferir</span>
              </Button>
            </Link>
          </div>
        </GlassCard>

        {/* KYC Section */}
        <GlassCard className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-foreground">Verificação KYC</h3>
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${kycStatus.bg} ${kycStatus.color}`}>
              <KycIcon size={14} />
              {kycStatus.label}
            </div>
          </div>

          {profile?.kyc_status !== 'approved' && (
            <div className="rounded-xl p-4 bg-warning/5 border border-warning/20 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-warning shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-medium text-foreground">Verificação Necessária</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Envie seus documentos para aprovação do admin. Após aprovação, você recebe 1.000 Kz de bônus!
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {/* Document Upload */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="text-primary" size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">BI / Passaporte</p>
                  <p className="text-xs text-muted-foreground">
                    {profile?.kyc_document_url ? '✓ Enviado para análise' : 'Documento não enviado'}
                  </p>
                </div>
              </div>
              <input
                ref={documentInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'document');
                }}
              />
              <Button 
                variant={profile?.kyc_document_url ? "outline" : "default"}
                size="sm"
                disabled={uploading || profile?.kyc_status === 'approved'}
                onClick={() => documentInputRef.current?.click()}
                className={!profile?.kyc_document_url ? "bg-primary hover:bg-primary/90" : ""}
              >
                <Upload size={14} className="mr-1.5" />
                {profile?.kyc_document_url ? 'Reenviar' : 'Enviar'}
              </Button>
            </div>

            {/* Selfie Upload */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Camera className="text-primary" size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Selfie de Verificação</p>
                  <p className="text-xs text-muted-foreground">
                    {profile?.kyc_selfie_url ? '✓ Enviada para análise' : 'Selfie não enviada'}
                  </p>
                </div>
              </div>
              <input
                ref={selfieInputRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'selfie');
                }}
              />
              <Button 
                variant={profile?.kyc_selfie_url ? "outline" : "default"}
                size="sm"
                disabled={uploading || profile?.kyc_status === 'approved'}
                onClick={() => selfieInputRef.current?.click()}
                className={!profile?.kyc_selfie_url ? "bg-primary hover:bg-primary/90" : ""}
              >
                <Camera size={14} className="mr-1.5" />
                {profile?.kyc_selfie_url ? 'Reenviar' : 'Tirar'}
              </Button>
            </div>
          </div>
        </GlassCard>

        {/* Referral Card */}
        <Link to="/afiliados">
          <GlassCard className="cursor-pointer hover:border-primary/50 transition-all mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Gift className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground">Programa de Afiliados</h3>
                  <p className="text-sm text-muted-foreground">
                    Ganhe 5% de comissão por indicado
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-primary">{profile?.referral_count || 0}</p>
                <p className="text-xs text-muted-foreground">Indicados</p>
              </div>
            </div>
          </GlassCard>
        </Link>

        {/* Sales Chart */}
        <GlassCard className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <TrendingUp className="text-success" size={20} />
              </div>
              <div>
                <p className="font-semibold text-foreground">Vendas de E-books</p>
                <p className="text-xs text-muted-foreground">Suas vendas recentes</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-success">{totalSales.toLocaleString('pt-AO')}</p>
              <p className="text-xs text-muted-foreground">AOA ganhos</p>
            </div>
          </div>
          
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number) => [`${value.toLocaleString('pt-AO')} AOA`, 'Vendas']}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--success))" 
                  strokeWidth={2}
                  fill="url(#salesGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Account Info */}
        <GlassCard>
          <h3 className="font-display font-semibold text-foreground mb-4">Informações da Conta</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div className="flex items-center gap-3">
                <User size={16} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Nome Completo</span>
              </div>
              <span className="text-sm font-medium text-foreground">{profile?.full_name || '-'}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Telefone</span>
              </div>
              <span className="text-sm font-medium text-foreground">{profile?.phone || '-'}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Email</span>
              </div>
              <span className="text-sm font-medium text-foreground">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div className="flex items-center gap-3">
                <CreditCard size={16} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">IBAN</span>
              </div>
              <span className="text-sm font-mono font-bold text-primary">{profile?.iban_virtual || '-'}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Users size={16} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Código de Referência</span>
              </div>
              <span className="text-sm font-mono font-bold text-primary">{profile?.referral_code || '-'}</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default Profile;
