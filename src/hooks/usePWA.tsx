import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface PWAContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isPWABonusClaimed: boolean;
  promptInstall: () => Promise<void>;
  claimPWABonus: () => Promise<void>;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  prompt(): Promise<void>;
}

export const PWAProvider = ({ children }: { children: ReactNode }) => {
  const { user, profile, refreshProfile } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        setIsInstallable(false);
      }
    };

    checkInstalled();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      toast.error('Instalação não disponível no momento');
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        toast.success('App instalado com sucesso!');
        
        // Automatically claim bonus if user is logged in
        if (user && profile && !profile.pwa_bonus_claimed) {
          await claimPWABonus();
        }
      }
    } catch (error) {
      console.error('Install prompt error:', error);
    }

    setDeferredPrompt(null);
  };

  const claimPWABonus = async () => {
    if (!user) {
      toast.error('Faça login para receber o bônus');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('claim-bonus', {
        body: { bonus_type: 'pwa_install' }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(data.message);
        refreshProfile();
      }
    } catch (error: any) {
      console.error('Claim PWA bonus error:', error);
      toast.error(error.message || 'Erro ao resgatar bônus');
    }
  };

  const isPWABonusClaimed = profile?.pwa_bonus_claimed || false;

  return (
    <PWAContext.Provider value={{
      isInstallable,
      isInstalled,
      isPWABonusClaimed,
      promptInstall,
      claimPWABonus,
    }}>
      {children}
    </PWAContext.Provider>
  );
};

export const usePWA = () => {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
};