import { Link } from "react-router-dom";
import { AlertTriangle, Shield, FileText } from "lucide-react";
import payvendasLogo from "@/assets/payvendas-logo.png";

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-white">
      {/* Risk Warning */}
      <div className="bg-destructive/5 border-b border-destructive/10 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-start gap-3 text-sm">
            <AlertTriangle className="text-destructive shrink-0 mt-0.5" size={18} />
            <p className="text-muted-foreground">
              <span className="text-destructive font-semibold">Aviso de Risco:</span>{" "}
              O mercado financeiro envolve riscos significativos. A PayVendas não garante lucros nem resultados. 
              Todo o conteúdo é exclusivamente educativo e não constitui aconselhamento financeiro.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src={payvendasLogo} alt="PayVendas" className="h-10" />
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Vende seus e-books e factura mais. Plataforma líder de vendas digitais em Angola e Moçambique.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Plataforma</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/loja" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Loja de PDFs
                </Link>
              </li>
              <li>
                <Link to="/trading" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Trading
                </Link>
              </li>
              <li>
                <Link to="/carteira" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Carteira Digital
                </Link>
              </li>
              <li>
                <Link to="/chat" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Chat da Comunidade
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/termos" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link to="/privacidade" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link to="/kyc" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Verificação KYC
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Suporte</h4>
            <ul className="space-y-2">
              <li>
                <a href="mailto:suporte@payvendas.ao" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  suporte@payvendas.ao
                </a>
              </li>
              <li>
                <Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © 2024 PayVendas. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Shield size={16} className="text-primary" />
              <span>Seguro</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <FileText size={16} className="text-primary" />
              <span>KYC Obrigatório</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
