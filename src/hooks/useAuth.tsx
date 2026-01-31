import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  iban_virtual: string | null;
  balance: number;
  kyc_status: 'pending' | 'approved' | 'rejected';
  kyc_document_url: string | null;
  kyc_selfie_url: string | null;
  wallet_activated: boolean;
  wallet_activation_date: string | null;
  pwa_installed: boolean;
  pwa_install_date: string | null;
  pwa_bonus_claimed: boolean;
  signup_bonus_claimed: boolean;
  bonus_balance: number;
  total_profit: number;
  referral_code: string | null;
  referred_by: string | null;
  referral_earnings: number;
  referral_count: number;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, phone: string, referralCode?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      setProfile(data as Profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .single();
      
      setIsAdmin(!!data && !error);
    } catch (error) {
      setIsAdmin(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to avoid blocking the auth state change
          setTimeout(async () => {
            await fetchProfile(session.user.id);
            await checkAdminRole(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
        checkAdminRole(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, phone: string, referralCode?: string) => {
    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
          phone: phone,
        }
      }
    });

    if (error) {
      toast.error(error.message);
      throw error;
    }

    // Process referral if code provided
    if (referralCode && signUpData.user) {
      try {
        // Find referrer by code
        const { data: referrerProfile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('referral_code', referralCode)
          .single();

        if (referrerProfile) {
          // Update new user's profile with referrer
          await supabase
            .from('profiles')
            .update({ referred_by: referrerProfile.user_id })
            .eq('user_id', signUpData.user.id);

          // Create referral record
          await supabase
            .from('referrals')
            .insert({
              referrer_id: referrerProfile.user_id,
              referred_id: signUpData.user.id,
              status: 'pending'
            });

          // Update referrer's count
          await supabase
            .from('profiles')
            .update({ 
              referral_count: (await supabase
                .from('profiles')
                .select('referral_count')
                .eq('user_id', referrerProfile.user_id)
                .single()).data?.referral_count + 1 || 1
            })
            .eq('user_id', referrerProfile.user_id);
        }
      } catch (refError) {
        console.error('Referral processing error:', refError);
      }
    }

    toast.success('Conta criada com sucesso! Faça login para continuar.');
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error('Email ou senha incorretos');
      throw error;
    }

    toast.success('Login realizado com sucesso!');
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Erro ao sair');
      throw error;
    }
    setProfile(null);
    setIsAdmin(false);
    toast.success('Você saiu da sua conta');
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      isAdmin,
      loading,
      signUp,
      signIn,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
