import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProblemSection } from './components/ProblemSection';
import { SolutionSection } from './components/SolutionSection';
import { HowItWorks } from './components/HowItWorks';
import { ProductDemo } from './components/ProductDemo';
import { FeaturesGrid } from './components/FeaturesGrid';
import { TargetAudience } from './components/TargetAudience';
import { PricingSection } from './components/PricingSection';
import { FAQSection } from './components/FAQSection';
import { FinalCTA } from './components/FinalCTA';
import { Footer } from './components/Footer';
import { CheckoutModal } from './components/CheckoutModal';
import { LegalModal } from './components/LegalModal';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';
import { CustomCursor } from './components/motion/CustomCursor';
import { ReadingProgressBar } from './components/ReadingProgressBar';
import { SoundController } from './components/audio/SoundController';
import { ArrowUp } from 'lucide-react';
import { useSound } from './hooks/useSound';

type AppPage = 'login' | 'signup' | 'dashboard' | null;

function isAppRoute(): boolean {
  const route = window.location.hash;
  return window.location.pathname === '/focus' || route.startsWith('#/projetos/') || ['#/tarefas', '#/projetos', '#/focus', '#/dashboard', '#/login', '#/signup'].includes(route);
}

export default function App() {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [authPage, setAuthPage] = useState<AppPage>(() => isAppRoute() ? 'dashboard' : null);
  const [legalType, setLegalType] = useState<'privacy' | 'terms' | null>(null);
  const { playClick, playModalOpen } = useSound();

  useEffect(() => {
    const handleHistoryChange = () => setAuthPage(isAppRoute() ? 'dashboard' : null);
    window.addEventListener('popstate', handleHistoryChange);
    return () => window.removeEventListener('popstate', handleHistoryChange);
  }, []);

  const navigateTo = (page: AppPage) => {
    window.history.pushState({}, '', page ? `/#/${page}` : '/');
    setAuthPage(page);
  };

  const handleOpenCheckout = () => {
    playModalOpen();
    setCheckoutOpen(true);
  };

  const handleOpenLogin = () => {
    playModalOpen();
    navigateTo('login');
  };

  const handleScrollToDemo = () => {
    playClick();
    const demoElement = document.getElementById('demonstracao');
    if (demoElement) {
      demoElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    playClick();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (authPage === 'dashboard') {
    return <DashboardPage onExit={() => navigateTo(null)} />;
  }

  if (authPage) {
    const sharedProps = {
      onBack: () => navigateTo(null),
      onSwitchPage: (page: 'login' | 'signup') => navigateTo(page),
    };

    return authPage === 'login'
      ? <LoginPage {...sharedProps} onEnterDashboard={() => navigateTo('dashboard')} />
      : <SignupPage {...sharedProps} />;
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white selection:bg-[#F59E0B]/30 selection:text-[#FBBF24] relative overflow-x-hidden">
      {/* 1. Custom Interactive Cursor for Desktop */}
      <CustomCursor />

      {/* 2. Reading Progress Bar pinned at top */}
      <ReadingProgressBar />

      {/* 3. Sticky Glass Navbar */}
      <Navbar
        onOpenCheckout={handleOpenCheckout}
        onOpenLogin={handleOpenLogin}
      />

      {/* 4. Main Motion Sections */}
      <main>
        {/* Hero Section */}
        <Hero
          onOpenCheckout={handleOpenCheckout}
          onExploreClick={handleScrollToDemo}
        />

        {/* Problem Section with 3D Spotlight Cards */}
        <ProblemSection />

        {/* Solution Section with Bento Grid and Micro-Widgets */}
        <SolutionSection />

        {/* How It Works Section with Interactive 4-step Timeline */}
        <HowItWorks />

        {/* Product Interactive Demo with 5 tabs and Real-time Feedback */}
        <ProductDemo
          onOpenCheckout={handleOpenCheckout}
        />

        {/* 20 Features Grid with Clickable Interactive Demos */}
        <FeaturesGrid
          onOpenCheckout={handleOpenCheckout}
        />

        {/* Target Audience Section */}
        <TargetAudience />

        {/* Pricing Section with Transparent R$ 9,90/month Plan */}
        <PricingSection
          onOpenCheckout={handleOpenCheckout}
        />

        {/* FAQ Accordion */}
        <FAQSection />

        {/* Final CTA Section */}
        <FinalCTA
          onOpenCheckout={handleOpenCheckout}
          onExploreClick={scrollToTop}
        />
      </main>

      {/* 5. Footer */}
      <Footer
        onOpenPrivacy={() => setLegalType('privacy')}
        onOpenTerms={() => setLegalType('terms')}
        onOpenCheckout={handleOpenCheckout}
      />

      {/* 6. Sound Controller - Floating at bottom-right */}
      <SoundController />

      {/* 7. Floating Action Pill & Scroll Top Button */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
        <button
          onClick={scrollToTop}
          className="w-10 h-10 rounded-full bg-[#151515]/95 hover:bg-[#202020] text-[#A1A1AA] hover:text-white border border-[#2E2E2E] hover:border-[#F59E0B]/40 flex items-center justify-center transition-all cursor-pointer shadow-xl active:scale-95"
          aria-label="Voltar ao topo"
          title="Voltar ao topo"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>

      {/* 8. Modals */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
      />

      <LegalModal
        type={legalType}
        onClose={() => setLegalType(null)}
      />
    </div>
  );
}
