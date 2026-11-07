import React from 'react';
import { ArrowUp, Github, Twitter, Linkedin, Sparkles } from 'lucide-react';
import { useSound } from '../hooks/useSound';

interface FooterProps {
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
  onOpenCheckout: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPrivacy, onOpenTerms, onOpenCheckout }) => {
  const currentYear = new Date().getFullYear();
  const { playClick, playHover } = useSound();

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    playClick();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    playClick();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#060606] border-t border-[#1C1C1C] text-[#A1A1AA] text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                scrollToTop();
              }}
              className="flex items-center gap-2.5 text-white font-extrabold tracking-tight text-base uppercase group"
            >
              <span className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B] shadow-[0_0_10px_#F59E0B] group-hover:scale-125 transition-transform" />
              <span className="font-mono tracking-wider">
                UMBRA <span className="text-[#A1A1AA] font-normal">DAILY OS</span>
              </span>
            </a>
            <p className="text-sm text-[#71717A] max-w-sm leading-relaxed">
              Um sistema de organização, foco e execução para transformar seus objetivos em resultados.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-mono text-[#71717A]">
                Todos os sistemas 100% operacionais
              </span>
            </div>

            {/* Social media links prepared */}
            <div className="flex items-center gap-3 pt-3">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                onMouseEnter={() => playHover()}
                className="w-8 h-8 rounded-lg bg-[#141414] border border-[#262626] flex items-center justify-center text-[#71717A] hover:text-[#F59E0B] hover:border-[#F59E0B]/40 transition-colors"
                aria-label="Twitter / X"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                onMouseEnter={() => playHover()}
                className="w-8 h-8 rounded-lg bg-[#141414] border border-[#262626] flex items-center justify-center text-[#71717A] hover:text-[#F59E0B] hover:border-[#F59E0B]/40 transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                onMouseEnter={() => playHover()}
                className="w-8 h-8 rounded-lg bg-[#141414] border border-[#262626] flex items-center justify-center text-[#71717A] hover:text-[#F59E0B] hover:border-[#F59E0B]/40 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Navegação</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#demonstracao"
                  onClick={(e) => handleScrollTo(e, '#demonstracao')}
                  onMouseEnter={() => playHover()}
                  className="hover:text-white transition-colors"
                >
                  Produto
                </a>
              </li>
              <li>
                <a
                  href="#funcionalidades"
                  onClick={(e) => handleScrollTo(e, '#funcionalidades')}
                  onMouseEnter={() => playHover()}
                  className="hover:text-white transition-colors"
                >
                  Funcionalidades
                </a>
              </li>
              <li>
                <a
                  href="#como-funciona"
                  onClick={(e) => handleScrollTo(e, '#como-funciona')}
                  onMouseEnter={() => playHover()}
                  className="hover:text-white transition-colors"
                >
                  Como funciona
                </a>
              </li>
              <li>
                <a
                  href="#precos"
                  onClick={(e) => handleScrollTo(e, '#precos')}
                  onMouseEnter={() => playHover()}
                  className="hover:text-white transition-colors"
                >
                  Preços (R$ 9,90)
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  onClick={(e) => handleScrollTo(e, '#faq')}
                  onMouseEnter={() => playHover()}
                  className="hover:text-white transition-colors"
                >
                  Perguntas Frequentes
                </a>
              </li>
            </ul>
          </div>

          {/* Legal and Support */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Legal & Suporte</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => {
                    playClick();
                    onOpenPrivacy();
                  }}
                  onMouseEnter={() => playHover()}
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  Política de Privacidade
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    playClick();
                    onOpenTerms();
                  }}
                  onMouseEnter={() => playHover()}
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  Termos de Uso
                </button>
              </li>
              <li>
                <a
                  href="mailto:suporte@umbra-daily.os"
                  onClick={() => playClick()}
                  onMouseEnter={() => playHover()}
                  className="hover:text-white transition-colors"
                >
                  Contato & Suporte
                </a>
              </li>
              <li>
                <button
                  onClick={() => {
                    playClick();
                    onOpenCheckout();
                  }}
                  onMouseEnter={() => playHover()}
                  className="text-[#F59E0B] hover:text-[#FBBF24] transition-colors font-medium text-left cursor-pointer"
                >
                  Assinar Plano Pro
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & back to top */}
        <div className="mt-12 pt-8 border-t border-[#191919] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#71717A]">
          <p>© {currentYear} UMBRA Daily OS. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <p className="font-mono">Foco · Disciplina · Execução Diária</p>
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1 text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
            >
              <span>Topo</span>
              <ArrowUp className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
