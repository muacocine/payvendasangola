import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, Gift, ArrowRight, Check, Smartphone, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/hooks/usePWA";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import biolosLogo from "@/assets/biolos-logo.png";

const InstallApp = () => {
  const { isInstallable, isInstalled, isPWABonusClaimed, promptInstall, claimPWABonus } = usePWA();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [claiming, setClaiming] = useState(false);

  const handleInstall = async () => {
    await promptInstall();
  };

  const handleClaimBonus = async () => {
    setClaiming(true);
    await claimPWABonus();
    setClaiming(false);
  };

  const benefits = [
    { icon: Zap, text: "Acesso rápido sem navegador" },
    { icon: Shield, text: "Funciona offline" },
    { icon: Gift, text: "Bônus de 500 AOA" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f18] flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-center">
        <img src={biolosLogo} alt="BIOLOS" className="h-8" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#1e88e5] to-purple-600 flex items-center justify-center mb-6 shadow-xl shadow-[#1e88e5]/30"
        >
          <Smartphone className="text-white" size={48} />
        </motion.div>

        {/* Status */}
        {isInstalled ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-400 mb-4">
                <Check size={18} />
                <span className="font-medium">App Instalado!</span>
              </div>
              
              <h1 className="text-2xl font-bold text-white mb-3">
                BIOLOS está instalado
              </h1>
              <p className="text-slate-400 max-w-xs">
                Agora você pode acessar a plataforma diretamente da sua tela inicial.
              </p>
            </motion.div>

            {/* Claim Bonus */}
            {user && !isPWABonusClaimed ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="w-full max-w-xs"
              >
                <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl p-4 mb-4">
                  <Gift className="text-yellow-400 mx-auto mb-2" size={32} />
                  <p className="text-white font-semibold">Bônus Disponível!</p>
                  <p className="text-yellow-400 text-2xl font-bold">500 AOA</p>
                </div>
                
                <Button
                  onClick={handleClaimBonus}
                  disabled={claiming}
                  className="w-full h-12 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold hover:opacity-90"
                >
                  {claiming ? "Resgatando..." : "Resgatar Bônus"}
                </Button>
              </motion.div>
            ) : isPWABonusClaimed ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-emerald-400 flex items-center gap-2 mb-6"
              >
                <Check size={20} />
                <span>Bônus de instalação já resgatado</span>
              </motion.div>
            ) : (
              <p className="text-slate-500 text-sm mb-6">
                Faça login para resgatar seu bônus de 500 AOA
              </p>
            )}

            <Button
              onClick={() => navigate("/trading")}
              className="mt-4 bg-[#1e88e5] hover:bg-[#1976d2]"
            >
              Ir para Trading
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-2xl font-bold text-white mb-3">
                Instale o App BIOLOS
              </h1>
              <p className="text-slate-400 max-w-xs mb-8">
                Tenha acesso rápido à plataforma e ganhe um bônus especial!
              </p>
            </motion.div>

            {/* Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="w-full max-w-xs mb-8"
            >
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-[#0d1421] border border-[#1e2a3a] rounded-xl mb-2"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#1e88e5]/20 flex items-center justify-center">
                      <Icon className="text-[#1e88e5]" size={20} />
                    </div>
                    <span className="text-white font-medium">{benefit.text}</span>
                  </div>
                );
              })}
            </motion.div>

            {/* Install Button */}
            {isInstallable ? (
              <Button
                onClick={handleInstall}
                className="w-full max-w-xs h-14 bg-gradient-to-r from-[#1e88e5] to-purple-600 text-white font-bold text-lg hover:opacity-90"
              >
                <Download size={22} className="mr-2" />
                Instalar App Grátis
              </Button>
            ) : (
              <div className="w-full max-w-xs">
                <div className="bg-[#0d1421] border border-[#1e2a3a] rounded-xl p-4 text-left">
                  <h3 className="font-semibold text-white mb-2">Como instalar:</h3>
                  <ol className="text-slate-400 text-sm space-y-2">
                    <li>1. Toque no menu do navegador (⋮ ou ⋯)</li>
                    <li>2. Selecione "Adicionar à tela inicial"</li>
                    <li>3. Confirme a instalação</li>
                  </ol>
                </div>
                <p className="text-slate-500 text-xs mt-3">
                  No iPhone: Safari → Compartilhar → Adicionar à Tela Inicial
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InstallApp;