import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Gift, ArrowRight, Check, Smartphone, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/hooks/usePWA";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import payvendasLogo from "@/assets/payvendas-logo.png";

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
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary to-orange-600 flex flex-col">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="p-6 flex items-center justify-center relative z-10">
        <img src={payvendasLogo} alt="PayVendas" className="h-10 brightness-0 invert" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative z-10">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="w-28 h-28 rounded-3xl bg-white flex items-center justify-center mb-8 shadow-2xl shadow-black/20"
        >
          <Smartphone className="text-primary" size={56} />
        </motion.div>

        {/* Status */}
        {isInstalled ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/20 text-white mb-6">
                <Check size={20} />
                <span className="font-bold">App Instalado!</span>
              </div>
              
              <h1 className="text-3xl font-display font-bold text-white mb-4">
                PayVendas está instalado
              </h1>
              <p className="text-white/80 max-w-xs text-lg">
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
                <div className="bg-white rounded-2xl p-6 mb-4 shadow-xl">
                  <Gift className="text-primary mx-auto mb-3" size={40} />
                  <p className="text-foreground font-bold text-lg">Bônus Disponível!</p>
                  <p className="text-primary text-3xl font-display font-bold">500 AOA</p>
                </div>
                
                <Button
                  onClick={handleClaimBonus}
                  disabled={claiming}
                  className="w-full h-14 bg-white text-primary hover:bg-white/90 font-bold text-lg rounded-xl shadow-xl"
                >
                  {claiming ? "Resgatando..." : "Resgatar Bônus"}
                </Button>
              </motion.div>
            ) : isPWABonusClaimed ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white/20 rounded-xl px-6 py-3 flex items-center gap-2 mb-6"
              >
                <Check size={20} className="text-white" />
                <span className="text-white font-medium">Bônus de instalação já resgatado</span>
              </motion.div>
            ) : (
              <p className="text-white/60 text-sm mb-6">
                Faça login para resgatar seu bônus de 500 AOA
              </p>
            )}

            <Button
              onClick={() => navigate("/trading")}
              className="mt-4 bg-white/20 hover:bg-white/30 text-white border border-white/30 h-12 px-8 font-bold rounded-xl"
            >
              Ir para o App
              <ArrowRight size={20} className="ml-2" />
            </Button>
          </>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-3xl font-display font-bold text-white mb-4">
                Instale o App PayVendas
              </h1>
              <p className="text-white/80 max-w-xs mb-10 text-lg">
                Tenha acesso rápido à plataforma e ganhe um bônus especial!
              </p>
            </motion.div>

            {/* Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="w-full max-w-xs mb-10"
            >
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur border border-white/20 rounded-xl mb-3"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <Icon className="text-white" size={24} />
                    </div>
                    <span className="text-white font-semibold text-lg">{benefit.text}</span>
                  </div>
                );
              })}
            </motion.div>

            {/* Install Button */}
            {isInstallable ? (
              <Button
                onClick={handleInstall}
                className="w-full max-w-xs h-16 bg-white text-primary hover:bg-white/90 font-bold text-xl rounded-xl shadow-2xl"
              >
                <Download size={24} className="mr-3" />
                Instalar App Grátis
              </Button>
            ) : (
              <div className="w-full max-w-xs">
                <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-5 text-left">
                  <h3 className="font-bold text-white mb-3">Como instalar:</h3>
                  <ol className="text-white/80 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-sm shrink-0">1</span>
                      <span>Toque no menu do navegador (⋮ ou ⋯)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-sm shrink-0">2</span>
                      <span>Selecione "Adicionar à tela inicial"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-sm shrink-0">3</span>
                      <span>Confirme a instalação</span>
                    </li>
                  </ol>
                </div>
                <p className="text-white/60 text-xs mt-4 text-center">
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
