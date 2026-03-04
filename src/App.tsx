import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/contexts/CartContext";
import { AppNavHeader } from "@/components/layout/AppNavHeader";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Trading from "./pages/Trading";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import Wallet from "./pages/Wallet";
import Admin from "./pages/Admin";
import PDFStore from "./pages/PDFStore";
import Referrals from "./pages/Referrals";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppNavHeader />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Register />} />
              <Route path="/trading" element={<Trading />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/perfil" element={<Profile />} />
              <Route path="/carteira" element={<Wallet />} />
              {/* Chat page removed */}
              <Route path="/loja" element={<PDFStore />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/afiliados" element={<Referrals />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/dashboard" element={<Trading />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
