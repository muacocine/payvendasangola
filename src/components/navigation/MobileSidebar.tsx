import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, 
  Users, 
  Wallet, 
  User, 
  ShoppingCart, 
  Menu, 
  X,
  MessageCircle,
  LogOut,
  Settings,
  Gift,
  Home
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import payvendasLogo from "@/assets/payvendas-logo.png";

const navItems = [
  { path: "/trading", label: "Trading", Icon: TrendingUp },
  { path: "/loja", label: "Loja de PDFs", Icon: ShoppingCart },
  { path: "/feed", label: "Comunidade", Icon: Users },
  { path: "/chat", label: "Chat", Icon: MessageCircle },
  { path: "/carteira", label: "Carteira", Icon: Wallet },
  { path: "/perfil", label: "Meu Perfil", Icon: User },
  { path: "/afiliados", label: "Afiliados", Icon: Gift },
];

export const MobileSidebar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user, profile, signOut, isAdmin } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  // Hide sidebar on landing, login, and register pages
  const hiddenRoutes = ['/', '/login', '/registro'];
  const shouldHide = hiddenRoutes.includes(location.pathname);

  if (shouldHide) return null;

  return (
    <>
      {/* Menu Button - Top Left Corner */}
      {user && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-40 w-12 h-12 bg-white border border-border text-foreground rounded-xl shadow-lg flex items-center justify-center md:hidden hover:bg-secondary transition-colors"
        >
          <Menu size={22} />
        </button>
      )}

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden"
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-white z-50 md:hidden shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <img src={payvendasLogo} alt="PayVendas" className="h-10" />
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground"
                >
                  <X size={20} />
                </button>
              </div>

              {/* User Info */}
              {user && profile && (
                <div className="p-6 border-b border-border">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User size={24} className="text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground truncate">{profile.full_name || "Usuário"}</p>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-primary/5 rounded-xl">
                    <p className="text-xs text-muted-foreground">Saldo</p>
                    <p className="text-xl font-bold text-primary">
                      {(profile.balance || 0).toLocaleString('pt-AO')} <span className="text-sm font-normal">AOA</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <nav className="p-4 flex-1 overflow-y-auto">
                <div className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.Icon;
                    
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                          isActive 
                            ? "bg-primary text-white" 
                            : "text-foreground hover:bg-secondary"
                        }`}
                      >
                        <Icon size={22} />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    );
                  })}

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                        location.pathname === "/admin" 
                          ? "bg-primary text-white" 
                          : "text-primary bg-primary/10 hover:bg-primary/20"
                      }`}
                    >
                      <Settings size={22} />
                      <span className="font-medium">Painel Admin</span>
                    </Link>
                  )}
                </div>
              </nav>

              {/* Footer */}
              <div className="p-4 border-t border-border">
                {user ? (
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-4 px-4 py-3 rounded-xl w-full text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <LogOut size={22} />
                    <span className="font-medium">Sair da Conta</span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <Link
                      to="/login"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl w-full bg-primary text-white font-medium"
                    >
                      Entrar
                    </Link>
                    <Link
                      to="/registro"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl w-full border border-border text-foreground font-medium hover:bg-secondary"
                    >
                      Criar Conta
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
