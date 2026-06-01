import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import StorefrontDemo from './components/StorefrontDemo';
import { dbService } from './supabaseClient';
import { UserSession } from './types';
import { Loader2 } from 'lucide-react';

// Default pre-seeded session so the user can see everything working immediately in demo mode
const DEFAULT_DEMO_SESSION: UserSession = {
  email: 'marlon@grofy.co.mz',
  storeName: 'Coleção Outono/Inverno',
  storeSlug: 'outono',
  whatsappNumber: '+258841234567',
  selectedPlan: 'Premium'
};

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'auth' | 'dashboard' | 'storefront'>('home');
  const [selectedPlan, setSelectedPlan] = useState<string>('Premium');
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Check if there is an active session in localStorage on page load, or a sharing store link
  useEffect(() => {
    const initApp = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const storeParam = params.get('store');
        
        if (storeParam) {
          const { data: store } = await dbService.getStoreBySlug(storeParam);
          if (store) {
            // Found custom shared store! Set dynamic guest session for the storefront
            const sharedSession: UserSession = {
              email: store.ownerEmail,
              storeName: store.name,
              storeSlug: store.slug,
              whatsappNumber: store.whatsappNumber,
              selectedPlan: 'Visualizador'
            };
            setUserSession(sharedSession);
            setCurrentView('storefront');
            localStorage.setItem('grofy_current_view', 'storefront');
            return;
          }
        }
        
        const storedSession = localStorage.getItem('grofy_active_session');
        let sessionObj: UserSession | null = null;
        if (storedSession) {
          sessionObj = JSON.parse(storedSession);
          setUserSession(sessionObj);
        }

        // Restore view from localStorage
        const storedView = localStorage.getItem('grofy_current_view');
        if (storedView === 'dashboard' || storedView === 'storefront' || storedView === 'auth' || storedView === 'home') {
          if (storedView === 'dashboard' && !sessionObj) {
            // Protected administrative view: check if active session exists
            setCurrentView('auth');
            localStorage.setItem('grofy_current_view', 'auth');
          } else {
            setCurrentView(storedView);
          }
        } else {
          // Default fallbacks based on session existence
          if (sessionObj) {
            setCurrentView('dashboard');
            localStorage.setItem('grofy_current_view', 'dashboard');
          } else {
            setCurrentView('home');
            localStorage.setItem('grofy_current_view', 'home');
          }
        }
      } catch (e) {
        console.error("Error standard parsing stored session/parameter", e);
      } finally {
        setAuthLoading(false);
      }
    };
    initApp();
  }, []);

  const handleSetUserSession = (session: UserSession | null) => {
    setUserSession(session);
    if (session) {
      localStorage.setItem('grofy_active_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('grofy_active_session');
    }
  };

  const handleLogout = () => {
    handleSetUserSession(null);
    setCurrentView('home');
    localStorage.setItem('grofy_current_view', 'home');
  };

  // Safe navigation fallback if navigating to Dashboard without active session
  const navigateToView = (view: 'home' | 'auth' | 'dashboard' | 'storefront') => {
    if (view === 'dashboard' && !userSession) {
      // Auto preseed a beautiful demo brand session so they don't get blocked
      handleSetUserSession(DEFAULT_DEMO_SESSION);
    }
    setCurrentView(view);
    localStorage.setItem('grofy_current_view', view);
    // Smooth scroll top on navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (authLoading) {
    return (
      <div className="bg-zinc-50 min-h-screen w-full flex flex-col items-center justify-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-zinc-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif text-3xl font-extrabold tracking-tight text-neutral-900 leading-none">
              Grofy
            </span>
            <span className="text-[10px] bg-zinc-900 text-white font-mono font-bold leading-none py-1 px-1.5 rounded uppercase tracking-wider">
              SaaS
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-500 font-medium text-xs font-mono">
            <Loader2 className="w-4 h-4 animate-spin text-zinc-800" />
            <span>Sincronizando sessão...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-50 min-h-screen text-zinc-950 w-full overflow-x-hidden">
      {currentView === 'home' && (
        <LandingPage 
          onNavigate={navigateToView} 
          onSelectPlan={setSelectedPlan} 
        />
      )}

      {currentView === 'auth' && (
        <AuthPage 
          onNavigate={navigateToView} 
          selectedPlan={selectedPlan} 
          onSetUserSession={handleSetUserSession} 
        />
      )}

      {currentView === 'dashboard' && userSession && (
        <Dashboard 
          userSession={userSession} 
          onLogout={handleLogout} 
          onNavigate={navigateToView} 
        />
      )}

      {currentView === 'storefront' && (
        <StorefrontDemo 
          userSession={userSession || DEFAULT_DEMO_SESSION} 
          onNavigate={navigateToView} 
        />
      )}
    </div>
  );
}
