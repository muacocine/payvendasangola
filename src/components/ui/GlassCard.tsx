import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export const GlassCard = ({ 
  children, 
  className, 
  hover = false, 
  glow = false,
  ...props 
}: GlassCardProps) => {
  return (
    <motion.div
      className={cn(
        "glass-card p-6",
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
