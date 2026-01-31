import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  ShoppingCart, 
  Plus, 
  Check, 
  X,
  Upload,
  Eye,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BottomNavigation } from "@/components/navigation/BottomNavigation";

interface PDFProduct {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  price: number;
  file_url: string | null;
  cover_image_url: string | null;
  status: string;
  downloads_count: number;
  created_at: string;
}

const PDFStore = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [products, setProducts] = useState<PDFProduct[]>([]);
  const [myProducts, setMyProducts] = useState<PDFProduct[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'loja' | 'meus'>('loja');
  const [loading, setLoading] = useState(true);
  
  // Create form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [user]);

  const fetchProducts = async () => {
    setLoading(true);
    
    // Fetch approved products
    const { data: approvedProducts } = await supabase
      .from('pdf_products')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    
    if (approvedProducts) {
      setProducts(approvedProducts);
    }

    // Fetch my products if logged in
    if (user) {
      const { data: userProducts } = await supabase
        .from('pdf_products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (userProducts) {
        setMyProducts(userProducts);
      }
    }
    
    setLoading(false);
  };

  const handleCreateProduct = async () => {
    if (!user || !profile) return;
    
    if (profile.kyc_status !== 'approved') {
      toast.error("KYC aprovado necessário para publicar PDFs");
      return;
    }

    if (!title.trim() || !price || !pdfFile) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setUploading(true);

    try {
      // Upload PDF file
      const fileExt = pdfFile.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('pdf-products')
        .upload(filePath, pdfFile);

      if (uploadError) throw uploadError;

      // Get file URL
      const { data: urlData } = supabase.storage
        .from('pdf-products')
        .getPublicUrl(filePath);

      // Create product
      const { error } = await supabase.from('pdf_products').insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        price: parseFloat(price),
        file_url: urlData.publicUrl,
        status: 'pending'
      });

      if (error) throw error;

      toast.success("PDF enviado para aprovação do administrador!");
      setShowCreateModal(false);
      setTitle("");
      setDescription("");
      setPrice("");
      setPdfFile(null);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar produto");
    } finally {
      setUploading(false);
    }
  };

  const handlePurchase = async (product: PDFProduct) => {
    if (!user || !profile) {
      toast.error("Faça login para comprar");
      return;
    }

    if (!profile.wallet_activated) {
      toast.error("Ative sua carteira para comprar");
      return;
    }

    if ((profile.balance || 0) < product.price) {
      toast.error("Saldo insuficiente");
      return;
    }

    try {
      // Deduct balance
      await supabase.from('profiles')
        .update({ balance: (profile.balance || 0) - product.price })
        .eq('user_id', user.id);

      // Create purchase record
      await supabase.from('pdf_purchases').insert({
        user_id: user.id,
        product_id: product.id,
        amount: product.price
      });

      // Update downloads count
      await supabase.from('pdf_products')
        .update({ downloads_count: (product.downloads_count || 0) + 1 })
        .eq('id', product.id);

      // Credit seller (85% for seller, 15% platform fee)
      const { data: sellerProfile } = await supabase
        .from('profiles')
        .select('balance')
        .eq('user_id', product.user_id)
        .single();

      if (sellerProfile) {
        await supabase.from('profiles')
          .update({ balance: (sellerProfile.balance || 0) + product.price * 0.85 })
          .eq('user_id', product.user_id);
      }

      // Create transaction
      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'pdf_purchase',
        amount: product.price,
        status: 'completed',
        method: 'PayVendas',
        description: `Compra: ${product.title}`
      });

      toast.success("Compra realizada! O download começará em breve.");
      refreshProfile();
      fetchProducts();

      // Trigger download
      if (product.file_url) {
        window.open(product.file_url, '_blank');
      }
    } catch (error: any) {
      toast.error("Erro ao processar compra");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-600">Aprovado</span>;
      case 'pending':
        return <span className="px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-600">Pendente</span>;
      case 'rejected':
        return <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-600">Rejeitado</span>;
      default:
        return null;
    }
  };

  const canPublish = profile?.kyc_status === 'approved';

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 bg-white border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground mb-1">Loja de PDFs</h1>
            <p className="text-muted-foreground text-sm">Compre e venda conteúdo educativo</p>
          </div>
          {canPublish && (
            <Button
              size="sm"
              onClick={() => setShowCreateModal(true)}
              className="bg-primary hover:bg-primary/90 text-white shadow-md"
            >
              <Plus size={16} className="mr-1" />
              Publicar
            </Button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-4 py-4">
        <div className="flex bg-secondary rounded-xl p-1 border border-border">
          <button
            onClick={() => setActiveTab('loja')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'loja' 
                ? 'bg-primary text-white' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Loja
          </button>
          <button
            onClick={() => setActiveTab('meus')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'meus' 
                ? 'bg-primary text-white' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Meus PDFs
          </button>
        </div>
      </div>

      <div className="px-4">
        {activeTab === 'loja' ? (
          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-secondary rounded-xl animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText size={40} className="mx-auto mb-3 opacity-50" />
                <p className="font-medium">Nenhum produto disponível</p>
              </div>
            ) : (
              products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white border border-border rounded-xl p-4 shadow-sm"
                >
                  <div className="flex gap-4">
                    <div className="w-16 h-20 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="text-primary" size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm truncate">{product.title}</h3>
                      {product.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Download size={12} className="text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{product.downloads_count} downloads</span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end justify-between">
                      <span className="font-bold text-primary">
                        {product.price.toLocaleString('pt-AO')} AOA
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handlePurchase(product)}
                        className="bg-primary hover:bg-primary/90 text-white text-xs h-8 shadow-md"
                      >
                        <ShoppingCart size={14} className="mr-1" />
                        Comprar
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {!canPublish && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                <p className="text-amber-700 text-sm">
                  KYC aprovado necessário para publicar PDFs
                </p>
              </div>
            )}
            
            {myProducts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText size={40} className="mx-auto mb-3 opacity-50" />
                <p className="font-medium">Você ainda não publicou nenhum PDF</p>
              </div>
            ) : (
              myProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white border border-border rounded-xl p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-foreground text-sm">{product.title}</h3>
                    {getStatusBadge(product.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      {product.price.toLocaleString('pt-AO')} AOA
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {product.downloads_count} vendas
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

      <BottomNavigation />

      {/* Create Product Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-border rounded-2xl w-full max-w-md p-6 max-h-[80vh] overflow-y-auto shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-foreground">Publicar PDF</h3>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground block mb-1.5">Título *</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nome do seu PDF"
                    className="bg-secondary border-border text-foreground"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground block mb-1.5">Descrição</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva o conteúdo..."
                    className="bg-secondary border-border text-foreground resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground block mb-1.5">Preço (AOA) *</label>
                  <Input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Ex: 500"
                    className="bg-secondary border-border text-foreground"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground block mb-1.5">Arquivo PDF *</label>
                  <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                    <Upload size={20} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {pdfFile ? pdfFile.name : 'Selecionar arquivo'}
                    </span>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-amber-700 text-xs">
                    ⚠️ Seu PDF será enviado para aprovação do administrador antes de ser publicado na loja.
                    15% do valor de cada venda é retido como taxa da plataforma.
                  </p>
                </div>

                <Button
                  onClick={handleCreateProduct}
                  disabled={uploading || !title || !price || !pdfFile}
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold shadow-md"
                >
                  {uploading ? 'Enviando...' : 'Enviar para Aprovação'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PDFStore;
