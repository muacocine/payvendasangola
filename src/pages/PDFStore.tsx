import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  ShoppingCart, 
  Plus, 
  X,
  Upload,
  Download,
  ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CartDrawer } from "@/components/cart/CartDrawer";

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
  const { addItem, itemCount } = useCart();
  const [products, setProducts] = useState<PDFProduct[]>([]);
  const [myProducts, setMyProducts] = useState<PDFProduct[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCart, setShowCart] = useState(false);
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
    
    const { data: approvedProducts } = await supabase
      .from('pdf_products')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    
    if (approvedProducts) {
      setProducts(approvedProducts);
    }

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
      const fileExt = pdfFile.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('pdf-products')
        .upload(filePath, pdfFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('pdf-products')
        .getPublicUrl(filePath);

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

  const handleAddToCart = (product: PDFProduct) => {
    addItem({
      id: product.id,
      title: product.title,
      price: product.price
    });
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
    <div className="min-h-screen bg-background pt-16 pb-8">
      {/* Header */}
      <div className="px-4 py-6 bg-white border-b border-border">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground mb-1">Loja de PDFs</h1>
              <p className="text-muted-foreground text-sm">Compre e venda conteúdo educativo</p>
            </div>
            <div className="flex items-center gap-2">
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCart(true)}
                className="relative"
              >
                <ShoppingCart size={18} />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {itemCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4">
        {/* Tab Navigation */}
        <div className="py-4">
          <div className="flex bg-secondary rounded-xl p-1 border border-border">
            <button
              onClick={() => setActiveTab('loja')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'loja' 
                  ? 'bg-primary text-white shadow-md' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ShoppingBag size={16} />
              Loja
            </button>
            <button
              onClick={() => setActiveTab('meus')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'meus' 
                  ? 'bg-primary text-white shadow-md' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText size={16} />
              Meus PDFs
            </button>
          </div>
        </div>

        {activeTab === 'loja' ? (
          <div className="grid md:grid-cols-2 gap-4">
            {loading ? (
              <>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-40 bg-secondary rounded-xl animate-pulse" />
                ))}
              </>
            ) : products.length === 0 ? (
              <div className="col-span-2 text-center py-16 text-muted-foreground">
                <FileText size={48} className="mx-auto mb-4 opacity-30" />
                <p className="font-medium text-lg">Nenhum produto disponível</p>
                <p className="text-sm">Seja o primeiro a publicar!</p>
              </div>
            ) : (
              products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex gap-4">
                    <div className="w-20 h-24 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl flex items-center justify-center flex-shrink-0 border border-primary/10">
                      <FileText className="text-primary" size={28} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-base mb-1 line-clamp-1">{product.title}</h3>
                      {product.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{product.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Download size={12} />
                          {product.downloads_count} downloads
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <span className="text-lg font-bold text-primary">
                      {product.price.toLocaleString('pt-AO')} AOA
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleAddToCart(product)}
                      className="bg-primary hover:bg-primary/90 text-white shadow-md"
                    >
                      <ShoppingCart size={14} className="mr-1.5" />
                      Adicionar
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {!canPublish && (
              <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 mb-4">
                <p className="text-warning font-medium text-sm">
                  ⚠️ KYC aprovado necessário para publicar PDFs
                </p>
              </div>
            )}
            
            {myProducts.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <FileText size={48} className="mx-auto mb-4 opacity-30" />
                <p className="font-medium text-lg">Nenhum PDF publicado</p>
                <p className="text-sm">Publique seu primeiro conteúdo!</p>
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
                    <h3 className="font-semibold text-foreground">{product.title}</h3>
                    {getStatusBadge(product.status)}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {product.price.toLocaleString('pt-AO')} AOA
                    </span>
                    <span className="text-muted-foreground">
                      {product.downloads_count} vendas
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Cart Drawer */}
      <CartDrawer isOpen={showCart} onClose={() => setShowCart(false)} />

      {/* Create Product Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-border rounded-2xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-bold text-lg text-foreground">Publicar PDF</h3>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="text-muted-foreground hover:text-foreground p-1"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Título *</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nome do seu PDF"
                    className="bg-secondary border-border"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Descrição</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva o conteúdo..."
                    className="bg-secondary border-border resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Preço (AOA) *</label>
                  <Input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Ex: 500"
                    className="bg-secondary border-border"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Arquivo PDF *</label>
                  <label className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                    <Upload size={24} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {pdfFile ? pdfFile.name : 'Clique para selecionar'}
                    </span>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <p className="text-primary text-sm font-medium mb-1">📋 Processo de Aprovação</p>
                  <p className="text-muted-foreground text-xs">
                    Seu PDF será analisado pelo admin. Taxa: 15% por venda.
                  </p>
                </div>

                <Button
                  onClick={handleCreateProduct}
                  disabled={uploading || !title || !price || !pdfFile}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg"
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
