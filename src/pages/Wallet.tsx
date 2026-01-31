import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Copy, 
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  EyeOff,
  RefreshCw,
  CreditCard,
  Shield,
  Wifi,
  Lock,
  X,
  Smartphone,
  Banknote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BottomNavigation } from "@/components/navigation/BottomNavigation";
import payvendasLogo from "@/assets/payvendas-logo.png";
import paypayLogo from "@/assets/paypay-logo.webp";
import multicaixaLogo from "@/assets/multicaixa-logo.webp";
import pliqpagLogo from "@/assets/pliqpag-logo.png";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  method: string | null;
  created_at: string;
  description: string | null;
}

const PAYMENT_METHODS = [
  { id: 'pliqpag', name: 'PliqPag (Referência)', icon: pliqpagLogo, color: 'bg-emerald-500/20' },
  { id: 'multicaixa', name: 'Multicaixa Express', icon: multicaixaLogo, color: 'bg-orange-500/20' },
  { id: 'paypay', name: 'PayPay África', icon: paypayLogo, color: 'bg-cyan-500/20' },
];

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://shpfccohqkjootsbhuua.supabase.co";

const Wallet = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState<'cartao' | 'historico'>('cartao');
  const [activatingWallet, setActivatingWallet] = useState(false);
  
  // Deposit/Withdraw modals
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(PAYMENT_METHODS[0]);
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(30);
    
    if (data) {
      setTransactions(data);
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

  const activateWallet = async () => {
    if (!user || !profile) return;
    
    if (profile.kyc_status !== 'approved') {
      toast.error("KYC aprovado necessário para ativar a carteira");
      return;
    }
    
    const totalBalance = (profile.balance || 0) + (profile.bonus_balance || 0);
    if (totalBalance < 100) {
      toast.error("Saldo insuficiente. Taxa de ativação: 100 AOA");
      return;
    }
    
    setActivatingWallet(true);
    
    try {
      const { data: session } = await supabase.auth.getSession();
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/payment-webhook/activate-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.session?.access_token}`
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao ativar carteira');
      }
      
      toast.success("Carteira ativada com sucesso!");
      refreshProfile();
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.message || "Erro ao ativar carteira");
    } finally {
      setActivatingWallet(false);
    }
  };

  const handleDeposit = async () => {
    if (!user || !profile) return;
    
    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount < 100) {
      toast.error("Valor mínimo de depósito: 100 AOA");
      return;
    }

    if (!phoneNumber || phoneNumber.length < 9) {
      toast.error("Número de telefone inválido");
      return;
    }

    setProcessing(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/payment-webhook/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.session?.access_token}`
        },
        body: JSON.stringify({
          type: 'deposit',
          amount: depositAmount,
          method: selectedMethod.name,
          phone: phoneNumber.startsWith('+244') ? phoneNumber : phoneNumber
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao processar depósito');
      }

      toast.success(
        <div className="space-y-2">
          <p className="font-semibold">Depósito solicitado!</p>
          <p className="text-xs whitespace-pre-line">{result.instructions}</p>
          {result.reference && (
            <p className="text-xs text-primary font-mono">Referência: {result.reference}</p>
          )}
        </div>,
        { duration: 15000 }
      );

      if (result.payment_url) {
        setTimeout(() => {
          window.open(result.payment_url, '_blank');
        }, 1500);
      }

      setShowDepositModal(false);
      setAmount("");
      setPhoneNumber("");
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar depósito");
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!user || !profile) return;
    
    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount < 200) {
      toast.error("Valor mínimo de levantamento: 200 AOA");
      return;
    }

    if (withdrawAmount > 200000) {
      toast.error("Valor máximo de levantamento: 200.000 AOA");
      return;
    }

    if ((profile.balance || 0) < withdrawAmount) {
      toast.error("Saldo insuficiente");
      return;
    }

    if (!phoneNumber || phoneNumber.length < 9) {
      toast.error("Número de telefone inválido");
      return;
    }

    const bonusBalance = profile.bonus_balance || 0;
    const realBalance = (profile.balance || 0) - bonusBalance;
    const totalProfit = profile.total_profit || 0;

    if (realBalance < withdrawAmount && totalProfit <= 0) {
      toast.error("Você precisa ter lucro em trading para sacar o saldo de bônus");
      return;
    }

    setProcessing(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/payment-webhook/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.session?.access_token}`
        },
        body: JSON.stringify({
          type: 'withdrawal',
          amount: withdrawAmount,
          method: selectedMethod.name,
          phone: phoneNumber
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao processar levantamento');
      }

      toast.success(
        <div className="space-y-2">
          <p className="font-semibold">Levantamento solicitado!</p>
          <p className="text-xs whitespace-pre-line">{result.instructions}</p>
          <p className="text-xs text-primary">Referência: {result.reference}</p>
        </div>,
        { duration: 10000 }
      );

      if (result.deep_link) {
        setTimeout(() => {
          window.location.href = result.deep_link;
        }, 1500);
      }

      setShowWithdrawModal(false);
      setAmount("");
      setPhoneNumber("");
      refreshProfile();
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar levantamento");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="text-emerald-500" size={14} />;
      case "pending":
        return <Clock className="text-amber-500" size={14} />;
      case "failed":
        return <XCircle className="text-red-500" size={14} />;
      default:
        return null;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownLeft className="text-emerald-500" size={16} />;
      case "withdrawal":
        return <ArrowUpRight className="text-amber-500" size={16} />;
      default:
        return <CreditCard className="text-muted-foreground" size={16} />;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'deposit': return 'Depósito';
      case 'withdrawal': return 'Levantamento';
      case 'wallet_activation': return 'Ativação Carteira';
      case 'pdf_purchase': return 'Compra PDF';
      case 'trade': return 'Trading';
      case 'chuva_sent': return 'Chuva Enviada';
      case 'chuva_received': return 'Chuva Recebida';
      default: return type;
    }
  };

  const balance = profile?.balance || 0;
  const isWalletActive = profile?.wallet_activated;
  const canActivate = profile?.kyc_status === 'approved' && !isWalletActive;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 bg-white border-b border-border">
        <h1 className="font-display text-xl font-bold text-foreground mb-1">Carteira</h1>
        <p className="text-muted-foreground text-sm">Gerencie seus fundos e cartão virtual</p>
      </div>

      {/* Balance Card */}
      <div className="px-4 py-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary via-primary to-orange-600 rounded-2xl p-5 text-white relative overflow-hidden shadow-xl shadow-primary/30"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/80 text-sm">Saldo Disponível</span>
              <button 
                onClick={() => setShowBalance(!showBalance)}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>

            <div className="text-3xl font-bold mb-6 font-mono">
              {showBalance ? `${balance.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA` : '••••••'}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                className="bg-white text-primary hover:bg-white/90 h-11 font-semibold shadow-md"
                disabled={!isWalletActive}
                onClick={() => setShowDepositModal(true)}
              >
                <ArrowDownLeft size={16} className="mr-2" />
                Depositar
              </Button>
              <Button 
                className="bg-white/20 text-white hover:bg-white/30 border border-white/30 h-11 font-semibold"
                disabled={!isWalletActive}
                onClick={() => setShowWithdrawModal(true)}
              >
                <ArrowUpRight size={16} className="mr-2" />
                Levantar
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tab Navigation */}
      <div className="px-4 mb-4">
        <div className="flex bg-secondary rounded-xl p-1 border border-border">
          <button
            onClick={() => setActiveTab('cartao')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'cartao' 
                ? 'bg-primary text-white' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Cartão Virtual
          </button>
          <button
            onClick={() => setActiveTab('historico')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'historico' 
                ? 'bg-primary text-white' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Histórico
          </button>
        </div>
      </div>

      <div className="px-4">
        {activeTab === 'cartao' ? (
          <div className="space-y-4">
            {/* Virtual Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl p-5 relative overflow-hidden ${
                isWalletActive 
                  ? 'bg-gradient-to-br from-foreground via-foreground/90 to-foreground/80 border border-primary/30'
                  : 'bg-secondary border border-border'
              }`}
              style={{ aspectRatio: '1.586' }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative h-full flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <img src={payvendasLogo} alt="PayVendas" className="h-6" />
                  <div className="flex items-center gap-1">
                    <Wifi size={14} className={isWalletActive ? 'text-primary' : 'text-muted-foreground'} />
                  </div>
                </div>

                <div className="mt-4">
                  <div className={`w-10 h-7 rounded ${isWalletActive ? 'bg-gradient-to-br from-amber-300 to-amber-500' : 'bg-muted'}`}>
                    <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-px p-0.5">
                      {[...Array(9)].map((_, i) => (
                        <div key={i} className={`rounded-[1px] ${isWalletActive ? 'bg-amber-600/50' : 'bg-muted-foreground/30'}`} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-auto">
                  <div className={`text-[10px] uppercase mb-0.5 ${isWalletActive ? 'text-white/60' : 'text-muted-foreground'}`}>IBAN Virtual</div>
                  <div className="flex items-center gap-2">
                    <code className={`text-sm font-mono ${isWalletActive ? 'text-white' : 'text-muted-foreground'}`}>
                      {isWalletActive ? (profile?.iban_virtual || '••••••••••••••••') : '••••••••••••••••'}
                    </code>
                    {isWalletActive && (
                      <button 
                        onClick={copyIban}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        {copied ? <CheckCircle size={14} className="text-primary" /> : <Copy size={14} className="text-white/60" />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-end justify-between mt-3">
                  <div>
                    <div className={`text-[10px] uppercase ${isWalletActive ? 'text-white/60' : 'text-muted-foreground'}`}>Titular</div>
                    <div className={`text-xs font-medium ${isWalletActive ? 'text-white' : 'text-muted-foreground'}`}>
                      {isWalletActive ? (profile?.full_name || 'NOME DO TITULAR') : '••••••••••'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-[10px] uppercase ${isWalletActive ? 'text-white/60' : 'text-muted-foreground'}`}>Status</div>
                    <div className={`text-xs font-medium ${isWalletActive ? 'text-primary' : 'text-muted-foreground'}`}>
                      {isWalletActive ? 'ATIVO' : 'INATIVO'}
                    </div>
                  </div>
                </div>

                {!isWalletActive && (
                  <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <Lock size={32} className="text-muted-foreground" />
                  </div>
                )}
              </div>
            </motion.div>

            {/* Activation Card */}
            {!isWalletActive && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white border border-border rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="text-primary" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Ativar Cartão Virtual</h3>
                    <p className="text-xs text-muted-foreground">
                      Ative sua carteira para depositar, levantar e receber chuvas. Taxa única de 100 AOA.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
                  <Shield size={14} className="text-primary" />
                  <span>KYC aprovado necessário</span>
                </div>

                <Button 
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold shadow-md"
                  onClick={activateWallet}
                  disabled={!canActivate || activatingWallet}
                >
                  {activatingWallet ? 'Ativando...' : 'Ativar Carteira (100 AOA)'}
                </Button>
              </motion.div>
            )}
          </div>
        ) : (
          /* Transaction History */
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full h-10 border-border text-foreground hover:bg-secondary"
              onClick={() => {
                fetchTransactions();
                refreshProfile();
                toast.success("Atualizado!");
              }}
            >
              <RefreshCw size={14} className="mr-2" />
              Atualizar
            </Button>

            {transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CreditCard size={40} className="mx-auto mb-3 opacity-50" />
                <p className="font-medium">Sem transações</p>
              </div>
            ) : (
              transactions.map((tx, index) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-white border border-border shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      tx.type === "deposit" ? "bg-emerald-500/10" : 
                      tx.type === "withdrawal" ? "bg-amber-500/10" : "bg-muted"
                    }`}>
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {getTransactionLabel(tx.type)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {tx.method || 'PayVendas'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-sm ${
                      tx.type === "deposit" || tx.type === "chuva_received" ? "text-emerald-500" : "text-amber-500"
                    }`}>
                      {tx.type === "deposit" || tx.type === "chuva_received" ? "+" : "-"}
                      {tx.amount.toLocaleString('pt-AO')} AOA
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString('pt-AO')}
                      </span>
                      {getStatusIcon(tx.status)}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

      <BottomNavigation />

      {/* Deposit Modal */}
      <AnimatePresence>
        {showDepositModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center p-4"
            onClick={() => setShowDepositModal(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-border rounded-2xl w-full max-w-md p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-foreground">Depositar</h3>
                <button onClick={() => setShowDepositModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground block mb-2">Método de Pagamento</label>
                  <div className="space-y-2">
                    {PAYMENT_METHODS.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setSelectedMethod(method)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                          selectedMethod.id === method.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg ${method.color} flex items-center justify-center p-1.5`}>
                          <img src={method.icon} alt={method.name} className="w-full h-full object-contain" />
                        </div>
                        <span className="text-foreground font-medium">{method.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground block mb-1.5">Valor (AOA)</label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Mínimo: 100 AOA"
                    className="bg-secondary border-border text-foreground"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground block mb-1.5">Número de Telefone</label>
                  <Input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Ex: 923456789"
                    className="bg-secondary border-border text-foreground"
                  />
                </div>

                <Button
                  onClick={handleDeposit}
                  disabled={processing}
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold shadow-md"
                >
                  {processing ? 'Processando...' : 'Confirmar Depósito'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center p-4"
            onClick={() => setShowWithdrawModal(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-border rounded-2xl w-full max-w-md p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-foreground">Levantar</h3>
                <button onClick={() => setShowWithdrawModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-secondary rounded-xl p-3">
                  <div className="text-xs text-muted-foreground mb-1">Saldo Disponível</div>
                  <div className="text-lg font-bold text-foreground">
                    {balance.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} AOA
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground block mb-2">Método de Pagamento</label>
                  <div className="space-y-2">
                    {PAYMENT_METHODS.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setSelectedMethod(method)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                          selectedMethod.id === method.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg ${method.color} flex items-center justify-center p-1.5`}>
                          <img src={method.icon} alt={method.name} className="w-full h-full object-contain" />
                        </div>
                        <span className="text-foreground font-medium">{method.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground block mb-1.5">Valor (AOA)</label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Mínimo: 200 AOA"
                    className="bg-secondary border-border text-foreground"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground block mb-1.5">Número de Telefone</label>
                  <Input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Ex: 923456789"
                    className="bg-secondary border-border text-foreground"
                  />
                </div>

                <Button
                  onClick={handleWithdraw}
                  disabled={processing}
                  className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-md"
                >
                  {processing ? 'Processando...' : 'Confirmar Levantamento'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Wallet;
