import React, { useState, useEffect } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';
import { MagneticButton } from './motion/MagneticButton';
import { useSound } from '../hooks/useSound';

interface NavbarProps {
  onOpenCheckout: () => void;
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCheckout, onOpenLogin }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const { playClick, playHover } = useSound();

  const navLinks = [
    { label: 'Produto', href: '#demonstracao', id: 'demonstracao' },
    { label: 'Funcionalidades', href: '#funcionalidades', id: 'funcionalidades' },
    { label: 'Como funciona', href: '#como-funciona', id: 'como-funciona' },
    { label: 'Preços', href: '#precos', id: 'precos' },
    { label: 'FAQ', href: '#faq', id: 'faq' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      // Section spy
      const scrollPos = window.scrollY + 200;
      for (const link of navLinks) {
        const el = document.getElementById(link.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(link.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    playClick();
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#080808]/90 backdrop-blur-md border-b border-[#262626] py-3.5 shadow-2xl shadow-black/60'
          : 'bg-transparent py-5 border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8">
          {/* Zone 1: Single text element Brand Zone */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
              playClick();
            }}
            className="flex items-center gap-2.5 text-white font-extrabold tracking-tight text-lg uppercase group whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
          >
            <span className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B] shadow-[0_0_12px_#F59E0B] group-hover:scale-125 transition-transform" />
            <span className="text-white tracking-wider font-mono text-sm sm:text-base">
              UMBRA <span className="text-[#A1A1AA] font-normal">DAILY OS</span>
            </span>
          </a>

          {/* Zone 2: 4-5 single-line clean text navigation links with active state indicator */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleScrollTo(e, link.href)}
                  onMouseEnter={() => playHover()}
                  className={`relative py-1 transition-colors duration-200 whitespace-nowrap shrink-0 group ${
                    isActive ? 'text-[#F59E0B] font-semibold' : 'text-[#A1A1AA] hover:text-white'
                  }`}
                >
                  <span>{link.label}</span>
                  {/* Subtle animated underline */}
                  <span
                    className={`absolute bottom-0 left-0 h-[2px] bg-[#F59E0B] transition-all duration-300 rounded-full ${
                      isActive ? 'w-full' : 'w-0 group-hover:w-full opacity-60'
                    }`}
                  />
                </a>
              );
            })}
          </nav>

          {/* Zone 3: Actions */}
          <div className="hidden sm:flex items-center gap-4 shrink-0">
            <button
              onClick={() => {
                playClick();
                onOpenLogin();
              }}
              onMouseEnter={() => playHover()}
              className="text-sm font-medium text-[#A1A1AA] hover:text-white transition-colors px-3 py-1.5 whitespace-nowrap cursor-pointer hover:underline"
            >
              Entrar
            </button>

            <MagneticButton
              onClick={() => {
                playClick();
                onOpenCheckout();
              }}
              variant="primary"
              className="px-4 py-2 text-xs sm:text-sm shadow-[0_0_20px_-3px_rgba(245,158,11,0.4)]"
            >
              <span>Começar agora</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </MagneticButton>
          </div>

          {/* Mobile menu button */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={() => {
                playClick();
                onOpenCheckout();
              }}
              className="px-3 py-1.5 text-xs font-bold text-black bg-[#F59E0B] rounded-md shadow-md shadow-[#F59E0B]/20"
            >
              R$ 9,90
            </button>
            <button
              onClick={() => {
                playClick();
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              className="p-2 text-[#A1A1AA] hover:text-white rounded-lg focus:outline-none cursor-pointer"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-[#0D0D0D] border-b border-[#262626] px-4 pt-4 pb-6 mt-3 space-y-3 animate-fadeIn">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleScrollTo(e, link.href)}
              className="block py-2 text-base font-medium text-[#D4D4D8] hover:text-[#F59E0B]"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-4 border-t border-[#262626] flex flex-col gap-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                playClick();
                onOpenLogin();
              }}
              className="w-full text-center py-2.5 text-sm font-medium text-[#A1A1AA] hover:text-white border border-[#262626] rounded-lg bg-[#151515]"
            >
              Entrar na minha conta
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                playClick();
                onOpenCheckout();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-black bg-[#F59E0B] rounded-lg shadow-lg shadow-[#F59E0B]/20"
            >
              <span>Assinar por R$ 9,90/mês</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
