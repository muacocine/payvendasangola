import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User, LogIn, ShoppingCart } from "lucide-react";
import payvendasLogo from "@/assets/payvendas-logo.png";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { href: "/loja", label: "Loja de PDFs" },
  { href: "/trading", label: "Trading" },
  { href: "/carteira", label: "Carteira" },
];

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user, profile, signOut, loading } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-border/50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={payvendasLogo} alt="PayVendas" className="h-10" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary text-white"
                      : "text-foreground/70 hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="w-20 h-8 bg-secondary rounded animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <Link to="/trading">
                  <Button 
                    size="sm"
                    className="bg-secondary text-foreground hover:bg-muted border border-border"
                  >
                    <User size={16} className="mr-2" />
                    {profile?.full_name?.split(' ')[0] || 'Conta'}
                  </Button>
                </Link>
                <Button 
                  size="sm"
                  variant="ghost" 
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => signOut()}
                >
                  Sair
                </Button>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button 
                    size="sm"
                    variant="ghost" 
                    className="text-foreground/70 hover:text-foreground"
                  >
                    <LogIn size={16} className="mr-2" />
                    Entrar
                  </Button>
                </Link>
                <Link to="/registro">
                  <Button 
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-white shadow-md"
                  >
                    Criar Conta
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-secondary text-foreground"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-border"
          >
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-foreground/70 hover:bg-secondary"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                {user ? (
                  <>
                    <Link to="/trading" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full bg-secondary text-foreground hover:bg-muted">
                        Dashboard
                      </Button>
                    </Link>
                    <Button 
                      className="flex-1 bg-transparent border border-border text-foreground"
                      onClick={() => {
                        signOut();
                        setIsMenuOpen(false);
                      }}
                    >
                      Sair
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full bg-secondary text-foreground hover:bg-muted">
                        Entrar
                      </Button>
                    </Link>
                    <Link to="/registro" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                        Registar
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
