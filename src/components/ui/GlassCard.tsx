import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  variant?: 'default' | 'orange';
}

export const GlassCard = ({ 
  children, 
  className, 
  hover = false, 
  glow = false,
  variant = 'default',
  ...props 
}: GlassCardProps) => {
  return (
    <motion.div
      className={cn(
        variant === 'orange' ? 'glass-card-orange' : 'glass-card',
        hover && "glass-card-hover cursor-pointer",
        glow && "animate-glow-pulse",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};
