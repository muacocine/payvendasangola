import { motion, AnimatePresence } from "framer-motion";
import { Download, Gift, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/hooks/usePWA";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";

export const PWAInstallPrompt = () => {
  const { isInstallable, isInstalled, isPWABonusClaimed, promptInstall, claimPWABonus } = usePWA();
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [bonusClaimed, setBonusClaimed] = useState(false);

  // Check if user just installed and needs to claim bonus
  useEffect(() => {
    if (isInstalled && user && !isPWABonusClaimed && !bonusClaimed) {
      setShowBonusModal(true);
    }
  }, [isInstalled, user, isPWABonusClaimed, bonusClaimed]);

  // Hide if bonus already claimed
  useEffect(() => {
    if (isPWABonusClaimed) {
      setBonusClaimed(true);
      setShowBonusModal(false);
    }
  }, [isPWABonusClaimed]);

  const handleInstall = async () => {
    await promptInstall();
  };

  const handleClaimBonus = async () => {
    await claimPWABonus();
    setBonusClaimed(true);
    setShowBonusModal(false);
  };

  // Don't show anything if bonus is claimed
  if (bonusClaimed || isPWABonusClaimed) return null;

  // Don't show if dismissed, not installable, or already installed (unless bonus unclaimed)
  if (dismissed || (!isInstallable && !showBonusModal)) return null;

  return (
    <>
      {/* Install Prompt Banner */}
      <AnimatePresence>
        {isInstallable && !dismissed && !isInstalled && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-20 left-4 right-4 z-40"
          >
            <div className="bg-gradient-to-r from-[#1e88e5] to-purple-600 rounded-2xl p-4 shadow-xl shadow-[#1e88e5]/20">
              <button
                onClick={() => setDismissed(true)}
                className="absolute top-2 right-2 text-white/60 hover:text-white p-1"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Smartphone className="text-white" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white text-sm">Instalar BIOLOS</h3>
                  <p className="text-white/80 text-xs mt-0.5">
                    Instale o app e ganhe <span className="font-bold text-yellow-300">500 AOA</span> de bônus!
                  </p>
                </div>
                <Button
                  onClick={handleInstall}
                  className="bg-white text-[#1e88e5] hover:bg-white/90 font-semibold h-10 px-4"
                >
                  <Download size={16} className="mr-1.5" />
                  Instalar
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bonus Claim Modal */}
      <AnimatePresence>
        {showBonusModal && !bonusClaimed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0d1421] border border-[#1e2a3a] rounded-2xl w-full max-w-sm p-6 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-4">
                <Gift className="text-white" size={40} />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">Parabéns! 🎉</h2>
              <p className="text-slate-400 mb-6">
                Você instalou o app BIOLOS! Resgate agora seu bônus de <span className="text-yellow-400 font-bold">500 AOA</span>
              </p>

              <Button
                onClick={handleClaimBonus}
                className="w-full h-12 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold text-lg hover:opacity-90"
              >
                <Gift size={20} className="mr-2" />
                Resgatar 500 AOA
              </Button>

              <button
                onClick={() => {
                  setBonusClaimed(true);
                  setShowBonusModal(false);
                }}
                className="mt-4 text-slate-500 text-sm hover:text-slate-300"
              >
                Resgatar depois
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};