import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { 
  User, Wallet, Upload, FileText, Camera, CheckCircle, Clock, XCircle, Copy,
  ArrowDownLeft, ArrowUpRight, Send, AlertTriangle, Users, Gift, Phone, Mail,
  CreditCard, Shield, TrendingUp, Sparkles, Star, Eye, ImagePlus
} from "lucide-react";
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
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      refreshProfile();
      fetchSalesData();
    }
  }, [user]);

  const fetchSalesData = async () => {
    if (!user) return;
    try {
      const { data: purchases } = await supabase
        .from('pdf_purchases')
        .select('amount, created_at, product_id')
        .order('created_at', { ascending: true });
      
      const { data: myProducts } = await supabase
        .from('pdf_products')
        .select('id')
        .eq('user_id', user.id);
      
      const myProductIds = new Set(myProducts?.map(p => p.id) || []);
      const mySales = purchases?.filter(p => myProductIds.has(p.product_id)) || [];
      const total = mySales.reduce((sum, sale) => sum + (sale.amount * 0.85), 0);
      setTotalSales(total);
      
      const salesByDate: Record<string, number> = {};
      mySales.forEach(sale => {
        const date = new Date(sale.created_at).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' });
        salesByDate[date] = (salesByDate[date] || 0) + (sale.amount * 0.85);
      });
      
      const chartData = Object.entries(salesByDate).map(([date, value]) => ({ date, value }));
      if (chartData.length === 0) {
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          chartData.push({ date: d.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' }), value: 0 });
        }
      }
      setSalesData(chartData);
    } catch (error) {
      console.error('Error fetching sales data:', error);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label} copiado!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(fileName, file);
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from('kyc-documents').getPublicUrl(fileName);
      
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('user_id', user.id);
      toast.success("Foto de perfil atualizada!");
      refreshProfile();
    } catch (error: any) {
      toast.error("Erro ao enviar foto");
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'document' | 'selfie') => {
    if (!user) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${type}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('kyc-documents').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('kyc-documents').getPublicUrl(fileName);
      const updateField = type === 'document' ? 'kyc_document_url' : 'kyc_selfie_url';
      await supabase.from('profiles').update({ [updateField]: publicUrl, kyc_status: 'pending' }).eq('user_id', user.id);
      toast.success(`${type === 'document' ? 'Documento' : 'Selfie'} enviado para análise`);
      refreshProfile();
    } catch (error: any) {
      toast.error(`Erro ao enviar ${type === 'document' ? 'documento' : 'selfie'}`);
    } finally {
      setUploading(false);
    }
  };

  const kycApproved = profile?.kyc_status === 'approved';

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background pt-16 pb-8">
      <div className="container mx-auto px-4 max-w-lg">
        
        {/* iPhone-style Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-[2rem] mb-6"
          style={{
            background: 'linear-gradient(145deg, hsl(24 95% 53%), hsl(24 90% 45%), hsl(24 85% 38%))',
            boxShadow: '0 20px 60px -15px hsl(24 95% 53% / 0.5), 0 0 0 1px hsl(24 95% 53% / 0.3)'
          }}
        >
          {/* Glass overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/10" />
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent rounded-t-[2rem]" />
          
          <div className="relative p-6 pt-8">
            {/* Avatar */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative group">
                <div className="w-28 h-28 rounded-full border-4 border-white/40 shadow-2xl overflow-hidden bg-white/20 backdrop-blur-xl">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User size={48} className="text-white/80" />
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-primary hover:scale-110 transition-transform"
                >
                  <ImagePlus size={18} />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarUpload(file);
                  }}
                />
              </div>
              <h1 className="text-2xl font-bold text-white mt-4">
                {profile?.full_name || 'Usuário'}
              </h1>
              <p className="text-white/70 text-sm mt-1">{user?.email}</p>
              
              {/* Verification Badge */}
              <div className={`mt-3 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold ${
                kycApproved 
                  ? 'bg-emerald-400/20 text-emerald-100 border border-emerald-400/30' 
                  : 'bg-amber-400/20 text-amber-100 border border-amber-400/30'
              }`}>
                {kycApproved ? <CheckCircle size={12} /> : <Clock size={12} />}
                {kycApproved ? 'Conta Verificada' : 'Verificação Pendente'}
              </div>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/15 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet size={14} className="text-white/70" />
                  <span className="text-white/70 text-xs">Saldo Real</span>
                </div>
                <p className="text-2xl font-bold text-white font-mono">
                  {(profile?.balance || 0).toLocaleString('pt-AO')}
                </p>
                <p className="text-white/50 text-xs">AOA</p>
              </div>
              <div className="bg-white/15 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Gift size={14} className="text-amber-300" />
                  <span className="text-white/70 text-xs">Bônus</span>
                </div>
                <p className="text-2xl font-bold text-amber-300 font-mono">
                  {(profile?.bonus_balance || 0).toLocaleString('pt-AO')}
                </p>
                <p className="text-white/50 text-xs">AOA</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions - iPhone style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          {[
            { icon: ArrowDownLeft, label: "Depositar", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
            { icon: ArrowUpRight, label: "Sacar", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
            { icon: Send, label: "Transferir", color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
          ].map((action, i) => (
            <Link key={i} to="/carteira">
              <motion.div
                whileTap={{ scale: 0.95 }}
                className={`${action.bg} ${action.border} border rounded-2xl p-4 flex flex-col items-center gap-2 hover:shadow-md transition-all cursor-pointer`}
                style={{ backdropFilter: 'blur(20px)' }}
              >
                <div className={`w-12 h-12 rounded-2xl ${action.bg} flex items-center justify-center`}>
                  <action.icon size={22} className={action.color} />
                </div>
                <span className="text-xs font-semibold text-foreground">{action.label}</span>
              </motion.div>
            </Link>
          ))}
        </motion.div>

        {/* IBAN Card - Glass */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-4 rounded-2xl border border-border/50 p-5 bg-card shadow-sm"
          style={{ backdropFilter: 'blur(20px)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <CreditCard className="text-primary" size={20} />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">IBAN Virtual</p>
              <p className="text-xs text-muted-foreground">PayVendas</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/70 border border-border/50">
            <code className="text-base font-mono font-bold text-foreground tracking-wide">
              {profile?.iban_virtual || '...'}
            </code>
            <button 
              onClick={() => profile?.iban_virtual && copyToClipboard(profile.iban_virtual, 'IBAN')}
              className="p-2 rounded-xl hover:bg-primary/10 text-primary transition-colors"
            >
              {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
            </button>
          </div>
        </motion.div>

        {/* Sales Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4 rounded-2xl border border-border/50 p-5 bg-card shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center">
                <TrendingUp className="text-emerald-500" size={20} />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">Ganhos com E-books</p>
                <p className="text-xs text-muted-foreground">Receita de vendas</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-emerald-500 font-mono">{totalSales.toLocaleString('pt-AO')}</p>
              <p className="text-xs text-muted-foreground">AOA</p>
            </div>
          </div>
          
          <div className="h-36 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#999' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  formatter={(value: number) => [`${value.toLocaleString('pt-AO')} AOA`, 'Vendas']}
                />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5} fill="url(#salesGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* KYC Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-4 rounded-2xl border border-border/50 p-5 bg-card shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center">
                <Shield className="text-blue-500" size={20} />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">Verificação KYC</p>
                <p className="text-xs text-muted-foreground">Segurança da conta</p>
              </div>
            </div>
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold ${
              kycApproved 
                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
            }`}>
              {kycApproved ? <CheckCircle size={12} /> : <Clock size={12} />}
              {kycApproved ? 'Aprovado' : 'Pendente'}
            </div>
          </div>

          {!kycApproved && (
            <div className="rounded-xl p-4 bg-amber-50 border border-amber-200/50 mb-4">
              <div className="flex items-start gap-3">
                <Sparkles className="text-amber-500 shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Ganhe 1.000 Kz de bônus!</p>
                  <p className="text-xs text-amber-600 mt-1">
                    Envie seus documentos e receba bônus após aprovação
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/50 border border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <FileText className="text-primary" size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">BI / Passaporte</p>
                  <p className="text-xs text-muted-foreground">
                    {profile?.kyc_document_url ? '✓ Enviado' : 'Não enviado'}
                  </p>
                </div>
              </div>
              <input ref={documentInputRef} type="file" accept="image/*,.pdf" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'document'); }} />
              <Button 
                variant={profile?.kyc_document_url ? "outline" : "default"}
                size="sm"
                disabled={uploading || kycApproved}
                onClick={() => documentInputRef.current?.click()}
                className={`rounded-xl ${!profile?.kyc_document_url ? "bg-primary hover:bg-primary/90" : ""}`}
              >
                <Upload size={14} className="mr-1.5" />
                {profile?.kyc_document_url ? 'Reenviar' : 'Enviar'}
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/50 border border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Camera className="text-primary" size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Selfie</p>
                  <p className="text-xs text-muted-foreground">
                    {profile?.kyc_selfie_url ? '✓ Enviada' : 'Não enviada'}
                  </p>
                </div>
              </div>
              <input ref={selfieInputRef} type="file" accept="image/*" capture="user" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, 'selfie'); }} />
              <Button 
                variant={profile?.kyc_selfie_url ? "outline" : "default"}
                size="sm"
                disabled={uploading || kycApproved}
                onClick={() => selfieInputRef.current?.click()}
                className={`rounded-xl ${!profile?.kyc_selfie_url ? "bg-primary hover:bg-primary/90" : ""}`}
              >
                <Camera size={14} className="mr-1.5" />
                {profile?.kyc_selfie_url ? 'Reenviar' : 'Tirar'}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Referral Card */}
        <Link to="/afiliados">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-4 rounded-2xl border border-primary/20 p-5 bg-gradient-to-r from-primary/5 to-primary/10 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Star className="text-primary" size={20} />
                </div>
                <div>
                  <p className="font-bold text-foreground text-sm">Programa de Afiliados</p>
                  <p className="text-xs text-muted-foreground">5% de comissão</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{profile?.referral_count || 0}</p>
                <p className="text-xs text-muted-foreground">Indicados</p>
              </div>
            </div>
          </motion.div>
        </Link>

        {/* Account Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl border border-border/50 p-5 bg-card shadow-sm"
        >
          <h3 className="font-bold text-foreground text-sm mb-4">Informações da Conta</h3>
          <div className="space-y-1">
            {[
              { icon: User, label: "Nome", value: profile?.full_name || '-' },
              { icon: Phone, label: "Telefone", value: profile?.phone || '-' },
              { icon: Mail, label: "Email", value: user?.email || '-' },
              { icon: CreditCard, label: "IBAN", value: profile?.iban_virtual || '-', mono: true },
              { icon: Users, label: "Referência", value: profile?.referral_code || '-', mono: true },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                <div className="flex items-center gap-3">
                  <item.icon size={16} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                </div>
                <span className={`text-sm font-medium ${item.mono ? 'font-mono text-primary' : 'text-foreground'}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
