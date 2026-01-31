import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendingUp, Users, MessageCircle, Wallet, User, ShoppingCart } from "lucide-react";

const navItems = [
  { path: "/loja", label: "Loja", Icon: ShoppingCart },
  { path: "/trading", label: "Trading", Icon: TrendingUp },
  { path: "/feed", label: "Feed", Icon: Users },
  { path: "/carteira", label: "Carteira", Icon: Wallet },
  { path: "/perfil", label: "Perfil", Icon: User },
];

export const BottomNavigation = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* iOS Glass Effect */}
      <div className="absolute inset-0 bg-white/70 backdrop-blur-2xl border-t border-white/20 shadow-[0_-4px_30px_rgba(0,0,0,0.08)]" />
      
      <div className="relative flex items-center justify-around h-16 max-w-lg mx-auto safe-area-pb">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.Icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center w-full h-full"
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-0.5 w-12 h-1 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              
              <motion.div
                className={`flex flex-col items-center transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[10px] mt-1 ${isActive ? "font-semibold" : "font-medium"}`}>
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
