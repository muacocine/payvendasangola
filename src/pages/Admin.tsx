import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock,
  Search,
  RefreshCw,
  LogOut,
  Eye,
  DollarSign,
  ArrowLeft,
  TrendingUp,
  FileText,
  Wallet,
  Ban,
  CreditCard,
  ArrowDownUp,
  BarChart3
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import biolosLogo from "@/assets/biolos-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  balance: number;
  bonus_balance: number;
  total_profit: number;
  kyc_status: string;
  kyc_document_url: string | null;
  kyc_selfie_url: string | null;
  iban_virtual: string | null;
  wallet_activated: boolean;
  pwa_installed: boolean;
  created_at: string;
}

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  status: string;
  method: string | null;
  created_at: string;
  description: string | null;
  user_name?: string;
}

interface PdfProduct {
  id: string;
  user_id: string;
  title: string;
  price: number;
  status: string;
  created_at: string;
  user_name?: string;
}

interface Trade {
  id: string;
  user_id: string;
  pair: string;
  direction: string;
  amount: number;
  is_win: boolean | null;
  profit_loss: number | null;
  admin_commission: number | null;
  created_at: string;
}

// Admin email
const ADMIN_EMAIL = 'isaacmuaco582@gmail.com';

const Admin = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pdfProducts, setPdfProducts] = useState<PdfProduct[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState("users");
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingKyc: 0,
    approvedKyc: 0,
    totalBalance: 0,
    pendingTransactions: 0,
    pendingPdfs: 0,
    totalCommissions: 0,
    totalTrades: 0
  });

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/trading");
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchAllData();
    }
  }, [isAdmin]);

  const fetchAllData = async () => {
    setLoadingData(true);
    await Promise.all([
      fetchUsers(),
      fetchTransactions(),
      fetchPdfProducts(),
      fetchTrades()
    ]);
    setLoadingData(false);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      setUsers(data as UserProfile[]);
      updateStats(data);
    }
    
    if (error) {
      toast.error("Erro ao carregar usuários");
    }
  };

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (data) {
      // Fetch user names
      const userIds = [...new Set(data.map(t => t.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const transactionsWithNames = data.map(t => ({
        ...t,
        user_name: profiles?.find(p => p.user_id === t.user_id)?.full_name || 'Usuário'
      }));

      setTransactions(transactionsWithNames);
    }
  };

  const fetchPdfProducts = async () => {
    const { data } = await supabase
      .from('pdf_products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      const userIds = [...new Set(data.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const productsWithNames = data.map(p => ({
        ...p,
        user_name: profiles?.find(pr => pr.user_id === p.user_id)?.full_name || 'Usuário'
      }));

      setPdfProducts(productsWithNames);
    }
  };

  const fetchTrades = async () => {
    const { data } = await supabase
      .from('trades')
      .select('*')
      .eq('is_demo', false)
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (data) {
      setTrades(data);
      const totalCommissions = data.reduce((sum, t) => sum + (t.admin_commission || 0), 0);
      setStats(prev => ({ ...prev, totalCommissions, totalTrades: data.length }));
    }
  };

  const updateStats = (userData: UserProfile[]) => {
    setStats(prev => ({
      ...prev,
      totalUsers: userData.length,
      pendingKyc: userData.filter(u => u.kyc_status === 'pending').length,
      approvedKyc: userData.filter(u => u.kyc_status === 'approved').length,
      totalBalance: userData.reduce((sum, u) => sum + (u.balance || 0), 0)
    }));
  };

  const updateKycStatus = async (userId: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('profiles')
      .update({ kyc_status: status })
      .eq('user_id', userId);
    
    if (error) {
      toast.error("Erro ao atualizar KYC");
    } else {
      // Send notification
      await supabase.from('notifications').insert({
        user_id: userId,
        type: status === 'approved' ? 'kyc_approved' : 'kyc_rejected',
        title: status === 'approved' ? 'KYC Aprovado!' : 'KYC Rejeitado',
        message: status === 'approved' 
          ? 'Parabéns! Sua verificação foi aprovada. Agora você pode fazer depósitos e saques.' 
          : 'Sua verificação foi rejeitada. Por favor, envie novos documentos.'
      });

      toast.success(`KYC ${status === 'approved' ? 'aprovado' : 'rejeitado'}`);
      fetchUsers();
    }
  };

  const processTransaction = async (transactionId: string, action: 'approved' | 'rejected', transaction: Transaction) => {
    // Map action to proper status
    const newStatus = action === 'approved' ? 'completed' : 'failed';
    
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status: newStatus })
        .eq('id', transactionId);

      if (error) {
        toast.error("Erro ao processar transação");
        console.error("Transaction update error:", error);
        return;
      }

      // If approving a deposit, add to user balance
      if (action === 'approved' && transaction.type === 'deposit') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('balance')
          .eq('user_id', transaction.user_id)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ balance: (profile.balance || 0) + transaction.amount })
            .eq('user_id', transaction.user_id);
        }
      }

      // If rejecting a withdrawal, refund the balance
      if (action === 'rejected' && transaction.type === 'withdrawal') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('balance')
          .eq('user_id', transaction.user_id)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ balance: (profile.balance || 0) + transaction.amount })
            .eq('user_id', transaction.user_id);
        }
      }

      // Send notification
      await supabase.from('notifications').insert({
        user_id: transaction.user_id,
        type: transaction.type,
        title: `${transaction.type === 'deposit' ? 'Depósito' : 'Levantamento'} ${action === 'approved' ? 'Aprovado' : 'Rejeitado'}`,
        message: action === 'approved' 
          ? `Sua transação de ${transaction.amount.toLocaleString('pt-AO')} AOA foi aprovada!`
          : `Sua transação de ${transaction.amount.toLocaleString('pt-AO')} AOA foi rejeitada.`
      });

      toast.success(`Transação ${action === 'approved' ? 'aprovada' : 'rejeitada'} com sucesso!`);
      fetchTransactions();
      fetchUsers();
    } catch (err) {
      console.error("Error processing transaction:", err);
      toast.error("Erro ao processar transação");
    }
  };

  const updatePdfStatus = async (productId: string, status: 'approved' | 'rejected', product: PdfProduct) => {
    const { error } = await supabase
      .from('pdf_products')
      .update({ status })
      .eq('id', productId);

    if (error) {
      toast.error("Erro ao atualizar produto");
      return;
    }

    // Send notification
    await supabase.from('notifications').insert({
      user_id: product.user_id,
      type: 'pdf_status',
      title: `PDF ${status === 'approved' ? 'Aprovado' : 'Rejeitado'}`,
      message: `Seu produto "${product.title}" foi ${status === 'approved' ? 'aprovado e está disponível na loja' : 'rejeitado'}.`
    });

    toast.success(`PDF ${status === 'approved' ? 'aprovado' : 'rejeitado'}`);
    fetchPdfProducts();
  };

  const banUser = async (userId: string, reason: string = 'Violação das regras') => {
    if (!user) return;

    const { error } = await supabase
      .from('user_bans')
      .insert({
        user_id: userId,
        banned_by: user.id,
        reason
      });

    if (error) {
      toast.error("Erro ao banir usuário");
      return;
    }

    toast.success("Usuário banido com sucesso");
    fetchUsers();
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-[#0a0f18] flex items-center justify-center">
        <div className="text-[#1e88e5] animate-pulse">Carregando...</div>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.iban_virtual?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingTransactions = transactions.filter(t => t.status === 'pending');
  const pendingPdfs = pdfProducts.filter(p => p.status === 'pending');

  return (
    <div className="min-h-screen bg-[#0a0f18]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0d1421]/95 backdrop-blur-xl border-b border-[#1e2a3a]">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <Link to="/trading">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <ArrowLeft size={20} />
              </Button>
            </Link>
            <img src={biolosLogo} alt="BIOLOS" className="h-7" />
            <span className="text-amber-500 font-bold text-sm px-2 py-0.5 bg-amber-500/20 rounded">ADMIN</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-slate-400 hover:text-white">
            <LogOut size={20} />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 max-w-6xl">
        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="font-display text-xl font-bold text-white">
            Painel Administrativo
          </h1>
          <p className="text-slate-400 text-sm">
            Gestão completa da plataforma BIOLOS
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <GlassCard className="p-3 bg-[#0d1421] border-[#1e2a3a]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Usuários</p>
                <p className="text-xl font-bold text-white">{stats.totalUsers}</p>
              </div>
              <Users className="text-[#1e88e5]" size={20} />
            </div>
          </GlassCard>

          <GlassCard className="p-3 bg-[#0d1421] border-[#1e2a3a]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">KYC Pendente</p>
                <p className="text-xl font-bold text-amber-400">{stats.pendingKyc}</p>
              </div>
              <Clock className="text-amber-500" size={20} />
            </div>
          </GlassCard>

          <GlassCard className="p-3 bg-[#0d1421] border-[#1e2a3a]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Comissões</p>
                <p className="text-xl font-bold text-emerald-400">{stats.totalCommissions.toLocaleString('pt-AO')}</p>
              </div>
              <DollarSign className="text-emerald-500" size={20} />
            </div>
          </GlassCard>

          <GlassCard className="p-3 bg-[#0d1421] border-[#1e2a3a]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Trades Reais</p>
                <p className="text-xl font-bold text-[#1e88e5]">{stats.totalTrades}</p>
              </div>
              <BarChart3 className="text-[#1e88e5]" size={20} />
            </div>
          </GlassCard>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-[#0d1421] border border-[#1e2a3a] mb-4">
            <TabsTrigger value="users" className="flex-1 data-[state=active]:bg-[#1e88e5]">
              <Users size={14} className="mr-1" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex-1 data-[state=active]:bg-[#1e88e5]">
              <ArrowDownUp size={14} className="mr-1" />
              Transações
              {pendingTransactions.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {pendingTransactions.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="pdfs" className="flex-1 data-[state=active]:bg-[#1e88e5]">
              <FileText size={14} className="mr-1" />
              PDFs
              {pendingPdfs.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {pendingPdfs.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="trades" className="flex-1 data-[state=active]:bg-[#1e88e5]">
              <TrendingUp size={14} className="mr-1" />
              Trades
            </TabsTrigger>
          </TabsList>

          {/* Search */}
          <GlassCard className="mb-4 bg-[#0d1421] border-[#1e2a3a]">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 bg-[#1e2a3a] border-[#2a3a4a] text-white"
                />
              </div>
              <Button variant="outline" size="icon" onClick={fetchAllData} className="h-10 w-10 border-[#2a3a4a]">
                <RefreshCw size={16} />
              </Button>
            </div>
          </GlassCard>

          {/* Users Tab */}
          <TabsContent value="users">
            <GlassCard className="bg-[#0d1421] border-[#1e2a3a]">
              <h2 className="font-display font-semibold text-white mb-4 text-sm">
                Gestão de Usuários
              </h2>

              <div className="space-y-3">
                {filteredUsers.map((u, index) => (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="p-3 rounded-xl bg-[#1e2a3a]/50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-white text-sm">{u.full_name || 'Sem nome'}</p>
                        <p className="text-xs text-slate-400">{u.phone || 'Sem telefone'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {u.pwa_installed && (
                          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                            PWA
                          </span>
                        )}
                        {u.wallet_activated && (
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                            <CreditCard size={10} className="inline mr-1" />
                            Cartão
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.kyc_status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                          u.kyc_status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                          'bg-amber-500/20 text-amber-400'
                        }`}>
                          {u.kyc_status === 'approved' ? <CheckCircle size={10} /> :
                           u.kyc_status === 'rejected' ? <XCircle size={10} /> :
                           <Clock size={10} />}
                          {u.kyc_status === 'approved' ? 'Aprovado' :
                           u.kyc_status === 'rejected' ? 'Rejeitado' :
                           'Pendente'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-400 mb-3">
                      <div>
                        <span className="text-slate-500">Saldo:</span>
                        <span className="ml-1 text-white">{(u.balance || 0).toLocaleString('pt-AO')} AOA</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Bônus:</span>
                        <span className="ml-1 text-amber-400">{(u.bonus_balance || 0).toLocaleString('pt-AO')} AOA</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Lucro:</span>
                        <span className={`ml-1 ${(u.total_profit || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {(u.total_profit || 0).toLocaleString('pt-AO')} AOA
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                      <code className="text-[#1e88e5]">{u.iban_virtual}</code>
                    </div>

                    {/* KYC Documents */}
                    {(u.kyc_document_url || u.kyc_selfie_url) && (
                      <div className="flex gap-2 mb-3">
                        {u.kyc_document_url && (
                          <a 
                            href={u.kyc_document_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-[#1e88e5] hover:underline flex items-center gap-1"
                          >
                            <Eye size={12} /> Documento
                          </a>
                        )}
                        {u.kyc_selfie_url && (
                          <a 
                            href={u.kyc_selfie_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-[#1e88e5] hover:underline flex items-center gap-1"
                          >
                            <Eye size={12} /> Selfie
                          </a>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      {u.kyc_status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-8"
                            onClick={() => updateKycStatus(u.user_id, 'approved')}
                          >
                            <CheckCircle size={12} className="mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white h-8"
                            onClick={() => updateKycStatus(u.user_id, 'rejected')}
                          >
                            <XCircle size={12} className="mr-1" />
                            Rejeitar
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-red-500/50 text-red-400 hover:bg-red-500/20"
                        onClick={() => banUser(u.user_id)}
                      >
                        <Ban size={12} className="mr-1" />
                        Banir
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Nenhum usuário encontrado
                </div>
              )}
            </GlassCard>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <GlassCard className="bg-[#0d1421] border-[#1e2a3a]">
              <h2 className="font-display font-semibold text-white mb-4 text-sm">
                Gestão de Transações (Depósitos/Saques)
              </h2>

              <div className="space-y-3">
                {transactions.map((t, index) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className={`p-3 rounded-xl ${
                      t.status === 'pending' ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-[#1e2a3a]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          t.type === 'deposit' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                        }`}>
                          {t.type === 'deposit' ? (
                            <ArrowDownUp className="text-emerald-400" size={16} />
                          ) : (
                            <ArrowDownUp className="text-red-400" size={16} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm">{t.user_name}</p>
                          <p className="text-xs text-slate-400">
                            {t.type === 'deposit' ? 'Depósito' : 'Saque'} via {t.method || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${t.type === 'deposit' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {t.type === 'deposit' ? '+' : '-'}{t.amount.toLocaleString('pt-AO')} AOA
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(t.created_at).toLocaleDateString('pt-AO')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        t.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                        t.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {t.status === 'completed' ? 'Aprovado' :
                         t.status === 'failed' ? 'Rejeitado' :
                         'Pendente'}
                      </span>

                      {t.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs"
                            onClick={() => processTransaction(t.id, 'approved', t)}
                          >
                            <CheckCircle size={12} className="mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white h-7 text-xs"
                            onClick={() => processTransaction(t.id, 'rejected', t)}
                          >
                            <XCircle size={12} className="mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {transactions.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    Nenhuma transação encontrada
                  </div>
                )}
              </div>
            </GlassCard>
          </TabsContent>

          {/* PDFs Tab */}
          <TabsContent value="pdfs">
            <GlassCard className="bg-[#0d1421] border-[#1e2a3a]">
              <h2 className="font-display font-semibold text-white mb-4 text-sm">
                Gestão de Produtos (PDFs)
              </h2>

              <div className="space-y-3">
                {pdfProducts.map((p, index) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className={`p-3 rounded-xl ${
                      p.status === 'pending' ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-[#1e2a3a]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                          <FileText className="text-purple-400" size={16} />
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm">{p.title}</p>
                          <p className="text-xs text-slate-400">por {p.user_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#1e88e5]">{p.price.toLocaleString('pt-AO')} AOA</p>
                        <p className="text-xs text-slate-400">
                          {new Date(p.created_at).toLocaleDateString('pt-AO')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                        p.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {p.status === 'approved' ? 'Aprovado' :
                         p.status === 'rejected' ? 'Rejeitado' :
                         'Pendente'}
                      </span>

                      {p.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs"
                            onClick={() => updatePdfStatus(p.id, 'approved', p)}
                          >
                            <CheckCircle size={12} className="mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white h-7 text-xs"
                            onClick={() => updatePdfStatus(p.id, 'rejected', p)}
                          >
                            <XCircle size={12} className="mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {pdfProducts.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    Nenhum produto encontrado
                  </div>
                )}
              </div>
            </GlassCard>
          </TabsContent>

          {/* Trades Tab */}
          <TabsContent value="trades">
            <GlassCard className="bg-[#0d1421] border-[#1e2a3a]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-white text-sm">
                  Histórico de Trades Reais
                </h2>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400">Comissões Totais:</span>
                  <span className="font-bold text-emerald-400">
                    {stats.totalCommissions.toLocaleString('pt-AO')} AOA
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {trades.map((t, index) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="p-3 rounded-xl bg-[#1e2a3a]/50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          t.direction === 'call' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                        }`}>
                          <TrendingUp className={t.direction === 'call' ? 'text-emerald-400' : 'text-red-400'} size={16} />
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm">{t.pair}</p>
                          <p className="text-xs text-slate-400">
                            {t.direction.toUpperCase()} - {t.amount.toLocaleString('pt-AO')} AOA
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${t.is_win ? 'text-emerald-400' : 'text-red-400'}`}>
                          {t.is_win ? '+' : ''}{(t.profit_loss || 0).toLocaleString('pt-AO')} AOA
                        </p>
                        {!t.is_win && t.admin_commission && t.admin_commission > 0 && (
                          <p className="text-xs text-amber-400">
                            Comissão: +{t.admin_commission.toLocaleString('pt-AO')} AOA
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {trades.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    Nenhum trade encontrado
                  </div>
                )}
              </div>
            </GlassCard>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;