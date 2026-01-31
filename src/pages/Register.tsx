import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Loader2, Gift, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import payvendasLogo from "@/assets/payvendas-logo.png";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ALLOWED_COUNTRIES = [
  { code: "+244", name: "Angola", flag: "🇦🇴" },
  { code: "+258", name: "Moçambique", flag: "🇲🇿" },
];

const Register = () => {
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(ALLOWED_COUNTRIES[0]);
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const { signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (referralCode) {
      fetchReferrerInfo();
    }
  }, [referralCode]);

  const fetchReferrerInfo = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('referral_code', referralCode)
        .single();
      
      if (data) {
        setReferrerName(data.full_name);
      }
    } catch (error) {
      console.log('Referral code not found');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    const phoneRegex = /^9\d{8}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error("Número de telefone inválido. Use o formato: 9XX XXX XXX");
      return;
    }

    setLoading(true);
    
    try {
      const fullPhone = `${selectedCountry.code}${formData.phone}`;
      await signUp(formData.email, formData.password, formData.name, fullPhone, referralCode || undefined);
      toast.success("Conta criada! Verifique seu email para ativar a conta.");
      navigate("/login");
    } catch (error) {
      // Error is handled in useAuth
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const benefits = [
    "Bônus de 1.000 AOA na carteira",
    "Venda PDFs e receba 85% do valor", 
    "Carteira digital gratuita",
    "Pagamentos via PayPay África"
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary to-orange-600 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/10 rounded-full" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          <motion.img 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            src={payvendasLogo} 
            alt="PayVendas" 
            className="h-20 mb-8 brightness-0 invert" 
          />
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-display font-bold text-white mb-4 text-center"
          >
            Comece a Vender Hoje
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/80 text-lg max-w-md text-center mb-10"
          >
            Crie sua conta em minutos e comece a vender seus e-books.
          </motion.p>
          
          {/* Benefits */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4 w-full max-w-sm"
          >
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/10 rounded-xl p-4">
                <CheckCircle className="text-white shrink-0" size={20} />
                <span className="text-white font-medium">{benefit}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="flex-1 flex items-center justify-center bg-white p-6 lg:p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md py-8"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6">
            <img src={payvendasLogo} alt="PayVendas" className="h-12 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Vende seus e-books e factura mais</p>
          </div>

          {/* Welcome text */}
          <div className="mb-6">
            <h2 className="text-2xl lg:text-3xl font-display font-bold text-foreground mb-2">
              Criar Conta
            </h2>
            <p className="text-muted-foreground">
              Junte-se a milhares de vendedores
            </p>
          </div>

          {referralCode && referrerName && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/30 flex items-center gap-3"
            >
              <Gift className="w-6 h-6 text-primary shrink-0" />
              <div>
                <p className="text-sm text-primary font-bold">Indicado por {referrerName}</p>
                <p className="text-xs text-muted-foreground">Você foi convidado para a plataforma!</p>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground font-medium">
                Nome Completo
              </Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="pl-12 h-12 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary rounded-xl"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="pl-12 h-12 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary rounded-xl"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-medium">
                Telefone
              </Label>
              <div className="flex gap-2">
                <Select 
                  value={selectedCountry.code} 
                  onValueChange={(val) => setSelectedCountry(ALLOWED_COUNTRIES.find(c => c.code === val) || ALLOWED_COUNTRIES[0])}
                >
                  <SelectTrigger className="w-28 h-12 bg-secondary/50 border-border text-foreground rounded-xl">
                    <SelectValue>
                      <span className="flex items-center gap-2">
                        <span>{selectedCountry.flag}</span>
                        <span className="text-sm">{selectedCountry.code}</span>
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white border-border">
                    {ALLOWED_COUNTRIES.map((country) => (
                      <SelectItem 
                        key={country.code} 
                        value={country.code}
                        className="text-foreground hover:bg-secondary"
                      >
                        <span className="flex items-center gap-2">
                          <span>{country.flag}</span>
                          <span>{country.name}</span>
                          <span className="text-muted-foreground">{country.code}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative flex-1">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9XX XXX XXX"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value.replace(/\D/g, '').slice(0, 9))}
                    className="pl-12 h-12 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary rounded-xl"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground font-medium">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mín. 6 caracteres"
                    value={formData.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    className="pl-12 h-12 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary rounded-xl"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground font-medium">
                  Confirmar
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Repita a senha"
                    value={formData.confirmPassword}
                    onChange={(e) => updateField("confirmPassword", e.target.value)}
                    className="pl-12 h-12 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary rounded-xl"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-sm text-primary hover:underline"
            >
              {showPassword ? "Ocultar senhas" : "Mostrar senhas"}
            </button>

            <div className="flex items-start gap-3 pt-2">
              <input 
                type="checkbox" 
                className="rounded border-border bg-secondary mt-1 w-5 h-5 text-primary focus:ring-primary" 
                required 
              />
              <span className="text-sm text-muted-foreground">
                Li e aceito os{" "}
                <Link to="/termos" className="text-primary hover:underline font-medium">
                  Termos e Condições
                </Link>{" "}
                e a{" "}
                <Link to="/privacidade" className="text-primary hover:underline font-medium">
                  Política de Privacidade
                </Link>
              </span>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-xl transition-all shadow-lg shadow-primary/30" 
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  Criar Conta Grátis
                  <ArrowRight className="ml-2" size={20} />
                </>
              )}
            </Button>
          </form>

          {/* Bonus notice */}
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-orange-500/10 border border-primary/20">
            <div className="flex items-center gap-3">
              <Gift className="text-primary shrink-0" size={24} />
              <div>
                <p className="font-bold text-foreground">Bônus de Boas-Vindas!</p>
                <p className="text-sm text-muted-foreground">Ganhe 1.000 AOA grátis na sua carteira</p>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              Já tem uma conta?{" "}
              <Link to="/login" className="text-primary hover:underline font-bold">
                Entrar
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
