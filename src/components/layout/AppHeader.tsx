import { Link } from "react-router-dom";
import { LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import biolosLogo from "@/assets/biolos-logo.png";

interface AppHeaderProps {
  title?: string;
  showSettings?: boolean;
}

export const AppHeader = ({ title, showSettings = false }: AppHeaderProps) => {
  const { signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between h-14 px-4">
        <Link to="/trading" className="flex items-center gap-2">
          <img src={biolosLogo} alt="BIOLOS" className="h-7" />
        </Link>

        {title && (
          <h1 className="font-display text-lg font-semibold text-foreground absolute left-1/2 -translate-x-1/2">
            {title}
          </h1>
        )}

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link to="/admin">
              <Button variant="ghost" size="sm" className="text-warning font-medium">
                Admin
              </Button>
            </Link>
          )}
          {showSettings && (
            <Button variant="ghost" size="icon" className="text-foreground">
              <Settings size={20} />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-foreground">
            <LogOut size={20} />
          </Button>
        </div>
      </div>
    </header>
  );
};
