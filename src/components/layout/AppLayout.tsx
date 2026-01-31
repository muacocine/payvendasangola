import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppHeader } from "./AppHeader";
import { BottomNavigation } from "../navigation/BottomNavigation";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showSettings?: boolean;
}

export const AppLayout = ({ children, title, showSettings }: AppLayoutProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary animate-pulse font-medium">Carregando...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader title={title} showSettings={showSettings} />
      <main className="container mx-auto px-4 py-4 max-w-2xl">
        {children}
      </main>
      <BottomNavigation />
    </div>
  );
};
