import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  CloudRain,
  Gift,
  Ban,
  Shield,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import biolosLogo from "@/assets/biolos-logo.png";
import { BottomNavigation } from "@/components/navigation/BottomNavigation";

interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  is_chuva: boolean;
  chuva_amount: number;
  chuva_recipients: number;
  chuva_claimed_by: string[];
  created_at: string;
  is_deleted: boolean;
}

interface UserBan {
  id: string;
  user_id: string;
  reason: string;
  banned_at: string;
  expires_at: string | null;
}

const BANNED_PATTERNS = [
  /\d{9,}/g,
  /https?:\/\/\S+/gi,
  /www\.\S+/gi,
  /[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}/gi,
  /BIOLO-[A-Z]{2}-\d+/gi,
  /pix|chave|transfere|deposita|envia.*dinheiro/gi,
];

const CHUVA_OPTIONS = [
  { amount: 350, recipients: 5, label: "350 AOA / 5 pessoas" },
  { amount: 600, recipients: 6, label: "600 AOA / 6 pessoas" },
  { amount: 1000, recipients: 10, label: "1.000 AOA / 10 pessoas" },
];

const Chat = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isBanned, setIsBanned] = useState(false);
  const [banInfo, setBanInfo] = useState<UserBan | null>(null);
  const [showChuvaModal, setShowChuvaModal] = useState(false);
  const [selectedChuva, setSelectedChuva] = useState(CHUVA_OPTIONS[0]);
  const [sendingChuva, setSendingChuva] = useState(false);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [onlineCount, setOnlineCount] = useState(0);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const checkBan = async () => {
      const { data } = await supabase
        .from('user_bans')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          setIsBanned(false);
        } else {
          setIsBanned(true);
          setBanInfo(data);
        }
      }
    };

    checkBan();
  }, [user]);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(100);

      if (data) {
        setMessages(data);
        
        const userIds = [...new Set(data.map(m => m.user_id))];
        setOnlineCount(userIds.length);
        
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url, kyc_status')
          .in('user_id', userIds);

        if (profilesData) {
          const profilesMap: Record<string, any> = {};
          profilesData.forEach(p => {
            profilesMap[p.user_id] = p;
          });
          setProfiles(profilesMap);
        }
        
        // Scroll to bottom after loading messages
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        }, 100);
      }
    };

    fetchMessages();

    const channel = supabase
      .channel('chat_messages_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as ChatMessage;
            
            if (!profiles[newMsg.user_id]) {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('user_id, full_name, avatar_url, kyc_status')
                .eq('user_id', newMsg.user_id)
                .single();

              if (profileData) {
                setProfiles(prev => ({ ...prev, [profileData.user_id]: profileData }));
              }
            }
            
            setMessages(prev => [...prev, newMsg]);
            
            // Scroll to bottom on new message
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 50);
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => 
              prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const containsBannedContent = (text: string): boolean => {
    return BANNED_PATTERNS.some(pattern => pattern.test(text));
  };

  const sendMessage = async () => {
    if (!user || !newMessage.trim() || isBanned) return;

    if (containsBannedContent(newMessage)) {
      toast.error("Mensagem contém conteúdo proibido (links, números, IBAN)");
      return;
    }

    const { error } = await supabase.from('chat_messages').insert({
      user_id: user.id,
      content: newMessage.trim(),
      is_chuva: false,
    });

    if (error) {
      toast.error("Erro ao enviar mensagem");
    } else {
      setNewMessage("");
    }
  };

  const sendChuva = async () => {
    if (!user || !profile) return;

    if (!profile.wallet_activated) {
      toast.error("Ative sua carteira para enviar chuvas (500 AOA)");
      return;
    }

    if (profile.kyc_status !== 'approved') {
      toast.error("KYC aprovado necessário para enviar chuvas");
      return;
    }

    if ((profile.balance || 0) < selectedChuva.amount) {
      toast.error("Saldo insuficiente");
      return;
    }

    setSendingChuva(true);

    try {
      await supabase.from('profiles')
        .update({ balance: (profile.balance || 0) - selectedChuva.amount })
        .eq('user_id', user.id);

      await supabase.from('chat_messages').insert({
        user_id: user.id,
        content: `Enviou uma chuva de ${selectedChuva.amount.toLocaleString('pt-AO')} AOA para ${selectedChuva.recipients} pessoas!`,
        is_chuva: true,
        chuva_amount: selectedChuva.amount,
        chuva_recipients: selectedChuva.recipients,
        chuva_claimed_by: [],
      });

      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'chuva_sent',
        amount: selectedChuva.amount,
        status: 'completed',
        method: 'BIOLOS',
        description: `Chuva enviada para ${selectedChuva.recipients} pessoas`
      });

      toast.success("Chuva enviada!");
      setShowChuvaModal(false);
      refreshProfile();
    } catch (error) {
      toast.error("Erro ao enviar chuva");
    } finally {
      setSendingChuva(false);
    }
  };

  const claimChuva = async (message: ChatMessage) => {
    if (!user || !profile) return;

    if (message.chuva_claimed_by?.includes(user.id)) {
      toast.error("Você já resgatou esta chuva");
      return;
    }

    if (message.chuva_claimed_by?.length >= message.chuva_recipients) {
      toast.error("Chuva esgotada");
      return;
    }

    if (message.user_id === user.id) {
      toast.error("Você não pode resgatar sua própria chuva");
      return;
    }

    const amountPerPerson = message.chuva_amount / message.chuva_recipients;

    try {
      const newClaimedBy = [...(message.chuva_claimed_by || []), user.id];
      
      await supabase.from('chat_messages')
        .update({ chuva_claimed_by: newClaimedBy })
        .eq('id', message.id);

      await supabase.from('profiles')
        .update({ balance: (profile.balance || 0) + amountPerPerson })
        .eq('user_id', user.id);

      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'chuva_received',
        amount: amountPerPerson,
        status: 'completed',
        method: 'BIOLOS',
        description: 'Chuva recebida no chat'
      });

      toast.success(`+${amountPerPerson.toLocaleString('pt-AO')} AOA!`);
      refreshProfile();
    } catch (error) {
      toast.error("Erro ao resgatar chuva");
    }
  };

  const getAvatar = (userId: string) => {
    const userProfile = profiles[userId];
    if (userProfile?.avatar_url) {
      return userProfile.avatar_url;
    }
    const seed = userId.substring(0, 8);
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
  };

  if (isBanned) {
    return (
      <div className="min-h-screen bg-[#0a0f18] flex items-center justify-center p-4">
        <div className="text-center">
          <Ban size={64} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Você foi banido do chat</h2>
          <p className="text-slate-400 mb-4">{banInfo?.reason}</p>
          {banInfo?.expires_at && (
            <p className="text-sm text-slate-500">
              Expira em: {new Date(banInfo.expires_at).toLocaleString('pt-AO')}
            </p>
          )}
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f18] flex flex-col">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0d1421] border-b border-[#1e2a3a] flex-shrink-0">
        <div className="flex items-center gap-3">
          <img src={biolosLogo} alt="BIOLOS" className="h-7" />
          <div>
            <h2 className="font-bold text-white text-sm">BIOLOS Chat</h2>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-slate-400">{onlineCount} online</span>
            </div>
          </div>
        </div>
        
        {profile?.wallet_activated && profile?.kyc_status === 'approved' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowChuvaModal(true)}
            className="h-8 px-3 bg-[#1e88e5]/20 text-[#1e88e5] hover:bg-[#1e88e5]/30"
          >
            <CloudRain size={14} className="mr-1.5" />
            Chuva
          </Button>
        )}
      </div>

      {/* Chat Rules Bar */}
      <div className="px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-center gap-2 flex-shrink-0">
        <Shield size={12} className="text-amber-400" />
        <span className="text-[10px] text-amber-400/80">
          Links, telefones e IBANs são proibidos. Violação = BAN
        </span>
      </div>

      {/* Messages Area - SCROLLABLE */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-3 space-y-3"
        style={{ paddingBottom: '140px' }}
      >
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-2 ${message.user_id === user?.id ? 'flex-row-reverse' : ''}`}
          >
            <img
              src={getAvatar(message.user_id)}
              alt="Avatar"
              className="w-8 h-8 rounded-full flex-shrink-0 border border-[#1e2a3a]"
            />
            <div className={`max-w-[75%] ${message.user_id === user?.id ? 'items-end' : ''}`}>
              <div className={`text-[10px] text-slate-500 mb-0.5 ${
                message.user_id === user?.id ? 'text-right' : ''
              }`}>
                {profiles[message.user_id]?.full_name || 'Usuário'}
              </div>
              
              {message.is_chuva ? (
                <div className="bg-gradient-to-r from-[#1e88e5]/20 to-purple-500/20 border border-[#1e88e5]/30 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <CloudRain className="text-[#1e88e5]" size={18} />
                    <span className="font-bold text-white text-sm">Chuva de AOA!</span>
                  </div>
                  <p className="text-xs text-slate-300 mb-3">{message.content}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Users size={12} className="text-slate-400" />
                      <span className="text-[10px] text-slate-400">
                        {message.chuva_claimed_by?.length || 0}/{message.chuva_recipients}
                      </span>
                    </div>
                    
                    {message.chuva_claimed_by?.includes(user?.id || '') ? (
                      <span className="text-[10px] text-emerald-400 font-medium">Resgatado ✓</span>
                    ) : (message.chuva_claimed_by?.length || 0) < message.chuva_recipients && message.user_id !== user?.id ? (
                      <Button
                        size="sm"
                        onClick={() => claimChuva(message)}
                        className="h-7 px-3 text-xs bg-gradient-to-r from-[#1e88e5] to-purple-500 text-white"
                      >
                        <Gift size={12} className="mr-1" />
                        {(message.chuva_amount / message.chuva_recipients).toLocaleString('pt-AO')} AOA
                      </Button>
                    ) : (
                      <span className="text-[10px] text-red-400">Esgotado</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className={`rounded-2xl px-3 py-2 ${
                  message.user_id === user?.id 
                    ? 'bg-[#1e88e5] text-white' 
                    : 'bg-[#1e2a3a] text-white'
                }`}>
                  <p className="text-sm">{message.content}</p>
                </div>
              )}
              
              <div className={`text-[10px] text-slate-600 mt-0.5 ${
                message.user_id === user?.id ? 'text-right' : ''
              }`}>
                {new Date(message.created_at).toLocaleTimeString('pt-AO', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input - FIXED */}
      <div className="fixed bottom-16 left-0 right-0 p-3 bg-[#0d1421]/95 backdrop-blur-xl border-t border-[#1e2a3a]">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Escreva uma mensagem..."
            className="flex-1 h-10 bg-[#1e2a3a] border-[#2a3a4a] text-white placeholder:text-slate-500 rounded-xl"
          />
          <Button 
            onClick={sendMessage} 
            size="icon" 
            className="h-10 w-10 bg-[#1e88e5] hover:bg-[#1976d2] rounded-xl shrink-0"
          >
            <Send size={16} />
          </Button>
        </div>
      </div>

      <BottomNavigation />

      {/* Chuva Modal */}
      <AnimatePresence>
        {showChuvaModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end justify-center p-4"
            onClick={() => setShowChuvaModal(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0d1421] border border-[#1e2a3a] rounded-2xl w-full max-w-md p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#1e88e5] to-purple-500 flex items-center justify-center">
                  <CloudRain className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Enviar Chuva</h3>
                  <p className="text-sm text-slate-400">Distribua AOA para outros usuários</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {CHUVA_OPTIONS.map((option) => (
                  <button
                    key={option.amount}
                    onClick={() => setSelectedChuva(option)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      selectedChuva.amount === option.amount
                        ? 'border-[#1e88e5] bg-[#1e88e5]/10'
                        : 'border-[#1e2a3a] hover:border-[#1e88e5]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{option.label}</span>
                      <span className="text-[#1e88e5] font-medium text-sm">
                        {(option.amount / option.recipients).toLocaleString('pt-AO')} AOA/pessoa
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-12 border-[#1e2a3a] text-white hover:bg-[#1e2a3a]"
                  onClick={() => setShowChuvaModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 h-12 bg-gradient-to-r from-[#1e88e5] to-purple-500 text-white"
                  onClick={sendChuva}
                  disabled={sendingChuva}
                >
                  {sendingChuva ? 'Enviando...' : 'Enviar Chuva'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chat;