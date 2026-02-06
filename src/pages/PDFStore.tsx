import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, ShoppingCart, Plus, X, Upload, Download, ShoppingBag, ImagePlus, Star, Eye
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
  const { user, profile } = useAuth();
  const { addItem, itemCount } = useCart();
  const [products, setProducts] = useState<PDFProduct[]>([]);
  const [myProducts, setMyProducts] = useState<PDFProduct[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [activeTab, setActiveTab] = useState<'loja' | 'meus'>('loja');
  const [loading, setLoading] = useState(true);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchProducts(); }, [user]);

  const fetchProducts = async () => {
    setLoading(true);
    const { data: approvedProducts } = await supabase
      .from('pdf_products').select('*').eq('status', 'approved').order('created_at', { ascending: false });
    if (approvedProducts) setProducts(approvedProducts);

    if (user) {
      const { data: userProducts } = await supabase
        .from('pdf_products').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (userProducts) setMyProducts(userProducts);
    }
    setLoading(false);
  };

  const handleCoverSelect = (file: File) => {
    setCoverImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setCoverPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleCreateProduct = async () => {
    if (!user || !profile) return;
    if (profile.kyc_status !== 'approved') { toast.error("KYC necessário"); return; }
    if (!title.trim() || !price || !pdfFile) { toast.error("Preencha todos os campos"); return; }

    setUploading(true);
    try {
      // Upload PDF
      const fileExt = pdfFile.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('pdf-products').upload(filePath, pdfFile);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('pdf-products').getPublicUrl(filePath);

      // Upload cover image if provided
      let coverUrl = null;
      if (coverImage) {
        const coverExt = coverImage.name.split('.').pop();
        const coverPath = `${user.id}/cover_${Date.now()}.${coverExt}`;
        const { error: coverError } = await supabase.storage.from('pdf-products').upload(coverPath, coverImage);
        if (!coverError) {
          const { data: coverData } = supabase.storage.from('pdf-products').getPublicUrl(coverPath);
          coverUrl = coverData.publicUrl;
        }
      }

      await supabase.from('pdf_products').insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        price: parseFloat(price),
        file_url: urlData.publicUrl,
        cover_image_url: coverUrl,
        status: 'pending'
      });

      toast.success("PDF enviado para aprovação!");
      setShowCreateModal(false);
      setTitle(""); setDescription(""); setPrice("");
      setPdfFile(null); setCoverImage(null); setCoverPreview(null);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar produto");
    } finally {
      setUploading(false);
    }
  };

  const canPublish = profile?.kyc_status === 'approved';

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background pt-16 pb-8">
      {/* Header */}
      <div className="px-4 py-6">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground mb-1">📚 Loja Digital</h1>
              <p className="text-muted-foreground text-sm">Compre e venda e-books</p>
            </div>
            <div className="flex items-center gap-2">
              {canPublish && (
                <Button size="sm" onClick={() => setShowCreateModal(true)}
                  className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-xl">
                  <Plus size={16} className="mr-1" /> Publicar
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setShowCart(true)} className="relative rounded-xl">
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
        {/* Tabs */}
        <div className="py-3">
          <div className="flex bg-card rounded-2xl p-1 border border-border/50 shadow-sm">
            {['loja', 'meus'].map(tab => (
              <button key={tab}
                onClick={() => setActiveTab(tab as 'loja' | 'meus')}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  activeTab === tab ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'loja' ? <><ShoppingBag size={16} /> Loja</> : <><FileText size={16} /> Meus PDFs</>}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'loja' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {loading ? (
              [1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-card rounded-2xl animate-pulse border border-border/30" />)
            ) : products.length === 0 ? (
              <div className="col-span-full text-center py-16 text-muted-foreground">
                <ShoppingBag size={48} className="mx-auto mb-4 opacity-30" />
                <p className="font-semibold text-lg">Nenhum produto</p>
                <p className="text-sm">Seja o primeiro a publicar!</p>
              </div>
            ) : (
              products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group"
                >
                  {/* Cover Image */}
                  <div className="aspect-[3/4] relative overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
                    {product.cover_image_url ? (
                      <img src={product.cover_image_url} alt={product.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="text-primary/30" size={48} />
                      </div>
                    )}
                    {/* Price badge */}
                    <div className="absolute top-3 right-3 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                      {product.price.toLocaleString('pt-AO')} Kz
                    </div>
                  </div>
                  
                  <div className="p-3.5">
                    <h3 className="font-bold text-foreground text-sm line-clamp-1 mb-1">{product.title}</h3>
                    {product.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{product.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Download size={10} /> {product.downloads_count}
                      </span>
                      <Button size="sm" onClick={() => addItem({ id: product.id, title: product.title, price: product.price })}
                        className="bg-primary hover:bg-primary/90 text-white text-xs h-8 px-3 rounded-xl shadow-md">
                        <ShoppingCart size={12} className="mr-1" /> Comprar
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
              <div className="bg-amber-50 border border-amber-200/50 rounded-2xl p-4">
                <p className="text-amber-700 font-medium text-sm">⚠️ KYC necessário para publicar</p>
              </div>
            )}
            {myProducts.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <FileText size={48} className="mx-auto mb-4 opacity-30" />
                <p className="font-semibold text-lg">Nenhum PDF publicado</p>
              </div>
            ) : myProducts.map((product, index) => (
              <motion.div key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm flex items-center gap-4"
              >
                <div className="w-16 h-20 rounded-xl overflow-hidden bg-primary/10 flex-shrink-0">
                  {product.cover_image_url ? (
                    <img src={product.cover_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="text-primary/40" size={24} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-foreground text-sm truncate">{product.title}</h3>
                    {product.status === 'approved' && <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-600 font-semibold border border-emerald-500/20">Aprovado</span>}
                    {product.status === 'pending' && <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-600 font-semibold border border-amber-500/20">Pendente</span>}
                    {product.status === 'rejected' && <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/10 text-red-600 font-semibold border border-red-500/20">Rejeitado</span>}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{product.price.toLocaleString('pt-AO')} AOA</span>
                    <span>{product.downloads_count} vendas</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <CartDrawer isOpen={showCart} onClose={() => setShowCart(false)} />

      {/* Create Product Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-foreground">Publicar PDF</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-muted-foreground hover:text-foreground p-1">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Cover Image Upload */}
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-1.5">Imagem de Capa</label>
                  <div 
                    onClick={() => coverInputRef.current?.click()}
                    className="relative aspect-[3/4] max-h-48 w-36 mx-auto rounded-2xl border-2 border-dashed border-border overflow-hidden cursor-pointer hover:border-primary/50 transition-colors bg-secondary/50"
                  >
                    {coverPreview ? (
                      <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                        <ImagePlus size={32} className="mb-2" />
                        <span className="text-xs">Adicionar capa</span>
                      </div>
                    )}
                  </div>
                  <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleCoverSelect(f); }} />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground block mb-1.5">Título *</label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nome do PDF" className="bg-secondary border-border rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-1.5">Descrição</label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva o conteúdo..." className="bg-secondary border-border resize-none rounded-xl" rows={3} />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-1.5">Preço (AOA) *</label>
                  <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Ex: 500" className="bg-secondary border-border rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-1.5">Arquivo PDF *</label>
                  <label className="flex items-center justify-center gap-2 p-5 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                    <Upload size={22} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{pdfFile ? pdfFile.name : 'Selecionar PDF'}</span>
                    <input type="file" accept=".pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)} className="hidden" />
                  </label>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
                  <p className="text-primary text-sm font-semibold mb-1">📋 Taxa de 15% por venda</p>
                  <p className="text-muted-foreground text-xs">O admin analisa e aprova o conteúdo</p>
                </div>

                <Button onClick={handleCreateProduct} disabled={uploading || !title || !price || !pdfFile}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg rounded-xl">
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
