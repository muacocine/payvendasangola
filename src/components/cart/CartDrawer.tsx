import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, ShoppingBag, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer = ({ isOpen, onClose }: CartDrawerProps) => {
  const { items, removeItem, updateQuantity, clearCart, total } = useCart();
  const { user, profile, refreshProfile } = useAuth();
  const [processing, setProcessing] = useState(false);

  const handleCheckout = async () => {
    if (!user || !profile) {
      toast.error("Faça login para finalizar a compra");
      return;
    }

    if (!profile.wallet_activated) {
      toast.error("Ative sua carteira para comprar");
      return;
    }

    if ((profile.balance || 0) < total) {
      toast.error("Saldo insuficiente");
      return;
    }

    setProcessing(true);

    try {
      // Process each item
      for (const item of items) {
        // Get product details
        const { data: product } = await supabase
          .from('pdf_products')
          .select('*')
          .eq('id', item.id)
          .single();

        if (!product) continue;

        // Create purchase record
        await supabase.from('pdf_purchases').insert({
          user_id: user.id,
          product_id: item.id,
          amount: item.price
        });

        // Update downloads count
        await supabase.from('pdf_products')
          .update({ downloads_count: (product.downloads_count || 0) + 1 })
          .eq('id', item.id);

        // Credit seller (85% for seller, 15% platform fee)
        const { data: sellerProfile } = await supabase
          .from('profiles')
          .select('balance')
          .eq('user_id', product.user_id)
          .single();

        if (sellerProfile) {
          await supabase.from('profiles')
            .update({ balance: (sellerProfile.balance || 0) + item.price * 0.85 })
            .eq('user_id', product.user_id);
        }

        // Create transaction record
        await supabase.from('transactions').insert({
          user_id: user.id,
          type: 'pdf_purchase',
          amount: item.price,
          status: 'completed',
          method: 'PayVendas',
          description: `Compra: ${item.title}`
        });

        // Trigger download
        if (product.file_url) {
          window.open(product.file_url, '_blank');
        }
      }

      // Deduct total from user balance
      await supabase.from('profiles')
        .update({ balance: (profile.balance || 0) - total })
        .eq('user_id', user.id);

      toast.success("Compra realizada com sucesso! Downloads iniciados.");
      clearCart();
      refreshProfile();
      onClose();
    } catch (error: any) {
      toast.error("Erro ao processar compra");
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingBag className="text-primary" size={20} />
                <h2 className="font-display font-bold text-foreground">Carrinho</h2>
                <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                  {items.length}
                </span>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg">
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag size={48} className="mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">Carrinho vazio</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-secondary/50 rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-foreground text-sm line-clamp-2">
                          {item.title}
                        </h3>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 text-destructive hover:bg-destructive/10 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 rounded-lg bg-white border border-border flex items-center justify-center"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-sm font-medium w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-lg bg-white border border-border flex items-center justify-center"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <span className="font-bold text-primary">
                          {(item.price * item.quantity).toLocaleString('pt-AO')} AOA
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-4 border-t border-border bg-white">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-muted-foreground">Total</span>
                  <span className="text-xl font-display font-bold text-foreground">
                    {total.toLocaleString('pt-AO')} AOA
                  </span>
                </div>
                
                <Button
                  onClick={handleCheckout}
                  disabled={processing}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg"
                >
                  {processing ? "Processando..." : "Finalizar Compra"}
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-2">
                  O valor será debitado do seu saldo PayVendas
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
