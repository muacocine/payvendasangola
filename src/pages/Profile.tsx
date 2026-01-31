import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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
  Gift
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Profile = () => {
  const { user, profile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

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
      
      toast.success(`${type === 'document' ? 'Documento' : 'Selfie'} enviado para análise`);
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
    <AppLayout title="Perfil" showSettings>
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
          ) : (
            <User size={32} className="text-muted-foreground" />
          )}
        </div>
        <h2 className="font-display text-xl font-bold text-foreground">
          {profile?.full_name || 'Usuário'}
        </h2>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </motion.div>

      {/* Balance Card */}
      <GlassCard className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wallet className="text-primary" size={20} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Saldo</p>
              <p className="text-xl font-display font-bold text-foreground">
                {(profile?.balance || 0).toLocaleString('pt-AO')} <span className="text-sm text-muted-foreground">AOA</span>
              </p>
            </div>
          </div>
        </div>

        {/* IBAN */}
        <div className="p-3 rounded-xl bg-muted/50 mb-4">
          <p className="text-xs text-muted-foreground mb-1">IBAN Virtual</p>
          <div className="flex items-center justify-between">
            <code className="text-sm font-mono text-foreground">{profile?.iban_virtual || 'Carregando...'}</code>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={copyIban}
              className="text-primary h-8 w-8 p-0"
            >
              {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button 
            variant="outline"
            size="sm"
            className="flex flex-col items-center py-4 h-auto"
            disabled={!canTransact}
          >
            <ArrowDownLeft size={18} className="mb-1 text-success" />
            <span className="text-xs">Depositar</span>
          </Button>
          <Button 
            variant="outline"
            size="sm"
            className="flex flex-col items-center py-4 h-auto"
            disabled={!canTransact}
          >
            <ArrowUpRight size={18} className="mb-1 text-warning" />
            <span className="text-xs">Sacar</span>
          </Button>
          <Button 
            variant="outline"
            size="sm"
            className="flex flex-col items-center py-4 h-auto"
            disabled={!canTransact}
          >
            <Send size={18} className="mb-1 text-primary" />
            <span className="text-xs">Transferir</span>
          </Button>
        </div>
      </GlassCard>

      {/* KYC Section */}
      <GlassCard className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-foreground">Verificação KYC</h3>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${kycStatus.bg} ${kycStatus.color}`}>
            <KycIcon size={12} />
            {kycStatus.label}
          </div>
        </div>

        {profile?.kyc_status !== 'approved' && (
          <div className="rounded-xl p-3 bg-warning/5 border border-warning/20 mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="text-warning shrink-0 mt-0.5" size={16} />
              <p className="text-xs text-muted-foreground">
                Complete a verificação para depositar, sacar e transferir fundos.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {/* Document Upload */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="text-primary" size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Documento (BI/Passaporte)</p>
                <p className="text-xs text-muted-foreground">
                  {profile?.kyc_document_url ? 'Enviado' : 'Não enviado'}
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
              variant="outline" 
              size="sm"
              disabled={uploading || profile?.kyc_status === 'approved'}
              onClick={() => documentInputRef.current?.click()}
            >
              <Upload size={14} className="mr-1" />
              Upload
            </Button>
          </div>

          {/* Selfie Upload */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Camera className="text-primary" size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Selfie de Verificação</p>
                <p className="text-xs text-muted-foreground">
                  {profile?.kyc_selfie_url ? 'Enviada' : 'Não enviada'}
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
              variant="outline" 
              size="sm"
              disabled={uploading || profile?.kyc_status === 'approved'}
              onClick={() => selfieInputRef.current?.click()}
            >
              <Camera size={14} className="mr-1" />
              Tirar
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Referral Card */}
      <Link to="/afiliados">
        <GlassCard className="cursor-pointer hover:border-primary/50 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/20">
                <Gift className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground">Programa de Afiliados</h3>
                <p className="text-sm text-muted-foreground">
                  Ganhe 5% de comissão por cada indicado
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">{profile?.referral_count || 0}</p>
              <p className="text-xs text-muted-foreground">Indicados</p>
            </div>
          </div>
        </GlassCard>
      </Link>

      {/* Account Info */}
      <GlassCard>
        <h3 className="font-display font-semibold text-foreground mb-4">Informações</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">Nome</span>
            <span className="text-sm font-medium text-foreground">{profile?.full_name || '-'}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">Telefone</span>
            <span className="text-sm font-medium text-foreground">{profile?.phone || '-'}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium text-foreground">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Código de Referência</span>
            <span className="text-sm font-mono font-bold text-primary">{profile?.referral_code || '-'}</span>
          </div>
        </div>
      </GlassCard>
    </AppLayout>
  );
};

export default Profile;
