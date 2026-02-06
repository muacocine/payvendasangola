import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  TrendingUp, 
  Wallet, 
  User, 
  ShoppingBag,
  Users,
  Menu,
  LogOut,
  Settings,
  ShoppingCart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
const payvendasLogo = "/assets/payvendas-logo.png";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/contexts/CartContext";

const navLinks = [
  { href: "/trading", label: "Trading", icon: TrendingUp },
  { href: "/carteira", label: "Carteira", icon: Wallet },
  { href: "/loja", label: "Loja", icon: ShoppingBag },
  { href: "/afiliados", label: "Afiliados", icon: Users },
  { href: "/perfil", label: "Perfil", icon: User },
];

export const AppNavHeader = () => {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { itemCount } = useCart();

  // Hide on landing, login, register pages
  const hiddenPaths = ["/", "/login", "/registro"];
  if (hiddenPaths.includes(location.pathname) || !user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/trading" className="flex items-center gap-2">
            <img src={payvendasLogo} alt="PayVendas" className="h-8" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary text-white"
                      : "text-foreground/70 hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon size={16} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {/* Cart Button */}
            <Link to="/loja" className="relative">
              <Button variant="ghost" size="icon" className="text-foreground">
                <ShoppingCart size={20} />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {itemCount}
                  </span>
                )}
              </Button>
            </Link>

            {isAdmin && (
              <Link to="/admin">
                <Button variant="ghost" size="sm" className="text-primary font-medium hidden md:flex">
                  Admin
                </Button>
              </Link>
            )}

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSignOut}
              className="text-foreground hidden md:flex"
            >
              <LogOut size={20} />
            </Button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-secondary text-foreground"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-border"
          >
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-foreground/70 hover:bg-secondary"
                    }`}
                  >
                    <Icon size={18} />
                    {link.label}
                  </Link>
                );
              })}
              
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-primary bg-primary/10"
                >
                  <Settings size={18} />
                  Admin
                </Link>
              )}

              <div className="border-t border-border mt-2 pt-2">
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-destructive w-full"
                >
                  <LogOut size={18} />
                  Sair
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
