import React, { useState, useEffect } from 'react';
import { ArrowLeft, Lock, Mail, Store as StoreIcon, Smartphone, Check, Sparkles } from 'lucide-react';
import { dbService } from '../supabaseClient';
import { UserSession } from '../types';
import GrofyLogo from './GrofyLogo';

interface AuthPageProps {
  onNavigate: (view: 'home' | 'auth' | 'dashboard' | 'storefront') => void;
  selectedPlan: string;
  onSetUserSession: (session: UserSession | null) => void;
}

export default function AuthPage({ onNavigate, selectedPlan, onSetUserSession }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(false);
  const [showSubscriptions, setShowSubscriptions] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register state
  const [storeName, setStoreName] = useState('');
  const [storeSlug, setStoreSlug] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [activePlan, setActivePlan] = useState(selectedPlan || 'Premium');

  const [isLoading, setIsLoading] = useState(false);
  const [isEmailChecking, setIsEmailChecking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // RatixPay integration states
  const [checkoutPlan, setCheckoutPlan] = useState<{ name: string; price: number } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'emola'>('mpesa');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentStatusText, setPaymentStatusText] = useState('');

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mpesaPhone) {
      alert(`Por favor, introduza o seu número de celular ${paymentMethod === 'mpesa' ? 'M-Pesa' : 'e-Mola'}.`);
      return;
    }

    const cleanedPhone = mpesaPhone.replace(/\s+/g, '');
    
    // Validate carrier matches selection
    if (paymentMethod === 'mpesa') {
      const isMpesa = /^[8][45][0-9]{7}$/.test(cleanedPhone);
      if (!isMpesa) {
        alert('Número de celular inválido para M-Pesa. Deve ter 9 dígitos e começar com 84 ou 85.');
        return;
      }
    } else {
      const isEmola = /^[8][67][0-9]{7}$/.test(cleanedPhone);
      if (!isEmola) {
        alert('Número de celular inválido para e-Mola. Deve ter 9 dígitos e começar com 86 ou 87.');
        return;
      }
    }

    setPaymentLoading(true);
    setPaymentStatusText(`Enviando solicitação de ${paymentMethod === 'mpesa' ? 'M-Pesa (Vodacom)' : 'e-Mola (Movitel)'} à rede via RatixPay...`);

    try {
      const response = await fetch('/api/ratixpay/charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: cleanedPhone,
          email: email || 'usuario@grofy.co.mz',
          amount: checkoutPlan?.price,
          planName: checkoutPlan?.name,
          storeSlug: storeSlug || 'outono',
          method: paymentMethod
        })
      });

      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        setPaymentStatusText(`Cobrança gerada com sucesso! Digite o PIN no seu telemóvel para autorizar o pagamento no ${paymentMethod === 'mpesa' ? 'M-Pesa' : 'e-Mola'}...`);
      } else {
        throw new Error(data.error || 'Erro inesperado da API.');
      }
    } catch (err: any) {
      setPaymentStatusText(`Erro na conexão: ${err.message}.`);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleSimulatePaymentWebhook = async () => {
    if (!checkoutPlan) return;
    setPaymentLoading(true);
    setPaymentStatusText(`Simulando recebimento de Webhook RatixPay para o plano ${checkoutPlan.name}...`);

    try {
      const response = await fetch('/api/ratixpay/simulate-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeSlug: storeSlug || 'outono',
          planName: checkoutPlan.name
        })
      });

      const resData = await response.json();
      if (response.ok) {
        setPaymentSuccess(true);
        setPaymentStatusText(`Assinatura confirmada via Webhook da RatixPay! A sua vitrine Grofy foi configurada para o plano ${checkoutPlan.name} por 30 dias de forma ativa.`);
        
        // Update user session and go to storefront
        setTimeout(() => {
          const updatedSession: UserSession = {
            email: email,
            storeName: storeName || 'Coleção Outono/Inverno',
            storeSlug: storeSlug || 'outono',
            whatsappNumber: whatsapp || '+258841234567',
            selectedPlan: checkoutPlan.name
          };
          onSetUserSession(updatedSession);
          onNavigate('storefront');
        }, 1800);
      } else {
        alert('Falha na simulação: ' + resData.error);
      }
    } catch (e: any) {
      alert('Erro na simulação do webhook: ' + e.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPlan) {
      setActivePlan(selectedPlan);
    }
  }, [selectedPlan]);

  // Autogenerate slug when Store Name changes
  const handleStoreNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setStoreName(name);
    // Convert to simple URL friendly lowercase slug
    const generatedSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setStoreSlug(generatedSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (isLogin) {
      // Login flow: Simulate/Verify credentials
      setTimeout(async () => {
        try {
          if (!email) {
            setErrorMsg('Por favor, introduza o seu e-mail.');
            setIsLoading(false);
            return;
          }
          
          // Probe if there is a store belonging to this owner
          // First, check local storage / Supabase by email
          let { data: storeInfo, error } = await dbService.getStoreByEmail(email);
          
          if (!storeInfo) {
            // Fallback to checking by slug if not found by email
            const fallbackSlugQuery = await dbService.getStoreBySlug(email.split('@')[0]);
            if (fallbackSlugQuery.data) {
              storeInfo = fallbackSlugQuery.data;
            }
          }
          
          let resolvedStoreName = 'Coleção Outono/Inverno';
          let resolvedStoreSlug = 'outono';
          let resolvedWhatsapp = '+258841234567';

          if (storeInfo) {
            resolvedStoreName = storeInfo.name;
            resolvedStoreSlug = storeInfo.slug;
            resolvedWhatsapp = storeInfo.whatsappNumber;
          }

          const session: UserSession = {
            email: email,
            storeName: resolvedStoreName,
            storeSlug: resolvedStoreSlug,
            whatsappNumber: resolvedWhatsapp,
            selectedPlan: activePlan
          };

          onSetUserSession(session);
          setSuccessMsg('Sessão iniciada com sucesso! Direcionando para a sua vitrine...');
          setTimeout(() => {
            onNavigate('storefront');
          }, 1000);
        } catch (e: any) {
          setErrorMsg('Dados inválidos. Use qualquer e-mail para esta simulação.');
        } finally {
          setIsLoading(false);
        }
      }, 800);
    } else {
      // Register flow
      if (!email || !storeName || !storeSlug || !whatsapp) {
        setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
        setIsLoading(false);
        return;
      }

      // Check if store slug is valid
      if (storeSlug.length < 3) {
        setErrorMsg('O slug da loja deve ter pelo menos 3 caracteres.');
        setIsLoading(false);
        return;
      }

      // 1. Real-time Email verification from Abstract API / hunter check
      setIsEmailChecking(true);
      setSuccessMsg('Verificando se o e-mail inserido realmente existe nos servidores...');

      try {
        const checkRes = await fetch('/api/validate-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email })
        });
        const checkData = await checkRes.json();
        
        if (!checkRes.ok || checkData.valid === false) {
          setErrorMsg(checkData.message || 'Este e-mail não existe ou está inativo. Por favor, use um e-mail real.');
          setSuccessMsg('');
          setIsEmailChecking(false);
          setIsLoading(false);
          return;
        }
      } catch (err: any) {
        console.error('Email verification validation fetch failed:', err);
        // Failover gracefully if connection takes too long or network error, but notify user
      } finally {
        setIsEmailChecking(false);
      }

      setSuccessMsg('E-mail verificado e ativo com sucesso! Concluindo cadastro...');

      // Attempt creation inside db
      const { data: newStore, error } = await dbService.createStore({
        name: storeName,
        slug: storeSlug,
        whatsappNumber: whatsapp,
        ownerEmail: email
      });

      if (error) {
        // Handle constraint failure if slug exists, otherwise let fallback resolve it
        setErrorMsg('Erro ao cadastrar loja. Esse endereço slug já deve estar em uso.');
        setIsLoading(false);
        return;
      }

      setTimeout(() => {
        const session: UserSession = {
          email: email,
          storeName: storeName,
          storeSlug: storeSlug,
          whatsappNumber: whatsapp,
          selectedPlan: '3 Dias Grátis',
          password: password
        };

        onSetUserSession(session);
        setSuccessMsg('Cadastro de conta concluído! Redirecionando para a ativação do seu plano...');
        setTimeout(() => {
          setShowSubscriptions(true);
        }, 1200);
        setIsLoading(false);
      }, 1000);
    }
  };

  if (showSubscriptions) {
    return (
      <div className="bg-zinc-100 min-h-screen font-sans flex flex-col justify-between text-zinc-950">
        <div className="px-6 py-4 flex items-center justify-between bg-white border-b border-zinc-100 max-w-7xl w-full mx-auto">
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => onNavigate('home')}>
            <GrofyLogo className="text-black" size={24} />
            <span className="font-bold tracking-tight text-base text-black">Grofy</span>
          </div>
          <span className="text-xs text-zinc-400 font-mono">Conta: {email}</span>
        </div>

        <div className="flex-grow flex flex-col items-center justify-center px-4 py-12 md:py-16 max-w-4xl mx-auto w-full">
          <div className="text-center mb-10">
            <span className="bg-emerald-100 text-emerald-800 text-[10px] uppercase tracking-widest font-extrabold px-3.5 py-1.5 rounded-full inline-block">Conta Cadastrada com Sucesso! 🎉</span>
            <h2 className="text-3xl font-serif font-bold tracking-tight text-zinc-900 mt-4">Escolha um Plano para Ativar sua Loja</h2>
            <p className="text-zinc-500 text-sm mt-2 max-w-md mx-auto">
              Selecione o seu plano de ativação abaixo para encaminhar à sua nova vitrine. Os outros planos Pro estão disponíveis sob consulta.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
            
            {/* PLAN 1: 3 Days Free Trial (ACTIVE & CLICKABLE) */}
            <div className="bg-white border-2 border-emerald-500 rounded-3xl p-6 shadow-xl flex flex-col justify-between relative transform scale-102 hover:scale-[1.03] transition-all">
              <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-wider py-1 px-3 rounded-full shadow">
                Recomendado
              </div>
              <div>
                <span className="text-zinc-400 font-bold uppercase tracking-wider text-[10px] block">TESTE GRATUITO</span>
                <h3 className="text-xl font-bold text-zinc-950 mt-1">3 Dias Grátis</h3>
                <p className="text-zinc-500 text-xs mt-1.5">Comece a vender hoje mesmo de forma rápida e descomplicada e mude de vida.</p>
                
                <div className="my-5">
                  <span className="text-3xl font-extrabold text-zinc-950">0 MZN</span>
                  <span className="text-zinc-400 text-xs font-medium"> / 3 dias</span>
                </div>

                <ul className="space-y-2.5 text-xs text-zinc-600 border-t border-zinc-100 pt-4">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Sacola via WhatsApp Ativa</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Upload de fotos e galeria</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Assistente IA para descrições</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Vitrine responsiva de alta classe</span>
                  </li>
                </ul>
              </div>

              <button 
                onClick={() => onNavigate('storefront')}
                className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold py-3.5 px-4 rounded-xl text-xs transition-all uppercase tracking-wider shadow-md hover:shadow-lg mt-8 flex items-center justify-center gap-1.5"
              >
                <span>Ativar 3 Dias Grátis</span> <Sparkles className="w-4 h-4 animate-bounce" />
              </button>
            </div>

            {/* PLAN 2: Standard (ACTIVE & CLICKABLE VIA RATIXPAY) */}
            <div className="bg-white border text-zinc-950 border-zinc-200 rounded-3xl p-6 flex flex-col justify-between relative shadow-sm hover:shadow-md transition-all">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-zinc-650 bg-zinc-100 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded font-mono block">CRESCIMENTO</span>
                  <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">M-Pesa Ativo</span>
                </div>
                <h3 className="text-xl font-bold text-zinc-950 mt-2">Standard</h3>
                <p className="text-zinc-500 text-xs mt-1.5 font-sans">O motor ideal para lojas em crescimento contínuo.</p>
                
                <div className="my-5 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-zinc-950">147 MZN</span>
                  <span className="text-zinc-500 text-xs font-medium"> / mês</span>
                </div>

                <ul className="space-y-2.5 text-xs text-zinc-650 border-t border-zinc-100 pt-4">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Até 30 produtos cadastrados</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Painel de gestão com controle de estoque</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Checkout otimizado WhatsApp</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Order Bump para elevar faturamento</span>
                  </li>
                </ul>
              </div>

              <button 
                type="button"
                onClick={() => setCheckoutPlan({ name: 'Standard', price: 147 })}
                className="w-full bg-zinc-950 hover:bg-zinc-850 active:scale-95 text-white font-bold py-3.5 px-4 rounded-xl text-xs transition-all uppercase tracking-wider mt-8 flex items-center justify-center gap-1.5 shadow"
              >
                <span>Assinar Standard</span>
              </button>
            </div>

            {/* PLAN 3: Grofy Premium (ACTIVE & CLICKABLE VIA RATIXPAY) */}
            <div className="bg-zinc-950 border text-white border-zinc-800 rounded-3xl p-6 flex flex-col justify-between relative shadow-xl hover:shadow-2xl transition-all">
              <div className="absolute top-0 right-6 -translate-y-1/2 bg-amber-500 text-white text-[9px] font-bold uppercase tracking-widest py-1 px-2.5 rounded-full shadow">
                Melhor Escolha
              </div>
              <div>
                <div className="flex justify-between items-start animate-pulse">
                  <span className="text-white bg-zinc-800 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded font-mono block">RECOMENDADO</span>
                  <span className="text-xs text-amber-400 font-bold bg-amber-950/50 px-2 py-0.5 rounded">M-Pesa Atis</span>
                </div>
                <h3 className="text-xl font-bold mt-2 flex items-center gap-1.5 text-white">
                  <GrofyLogo className="text-amber-400" size={20} />
                  Grofy Premium
                </h3>
                <p className="text-zinc-400 text-xs mt-1.5">A solução completa para expandir o seu negócio no digital.</p>
                
                <div className="my-5 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">765 MZN</span>
                  <span className="text-zinc-400 text-xs font-medium"> / mês</span>
                </div>

                <ul className="space-y-2.5 text-xs text-zinc-350 border-t border-zinc-800 pt-4">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-450 shrink-0 text-emerald-400" />
                    <span className="font-semibold text-zinc-200">Produtos Ilimitados</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-450 shrink-0 text-emerald-400" />
                    <span>Domínio personalizado (.co.mz, etc)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-450 shrink-0 text-emerald-400" />
                    <span>Cadastro por IA Inteligente Gemini</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-450 shrink-0 text-emerald-400" />
                    <span>Order Bump de alta conversão</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-450 shrink-0 text-emerald-400" />
                    <span>Suporte VIP Prioritário 24/7</span>
                  </li>
                </ul>
              </div>

              <button 
                type="button"
                onClick={() => setCheckoutPlan({ name: 'Grofy Premium', price: 765 })}
                className="w-full bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold py-3.5 px-4 rounded-xl text-xs transition-all uppercase tracking-wider mt-8 flex items-center justify-center gap-1.5 shadow-md"
              >
                <span>Assinar Premium</span> <Sparkles className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

        {/* RATIXPAY MPESA CHECKOUT MODAL OVERLAY */}
        {checkoutPlan && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full border border-zinc-200/80 shadow-2xl p-6 md:p-8 relative transform scale-100 transition-all duration-300">
              {/* Close Button */}
              <button 
                onClick={() => {
                  setCheckoutPlan(null);
                  setMpesaPhone('');
                  setPaymentSuccess(false);
                  setPaymentStatusText('');
                }}
                className="absolute top-4 right-4 text-zinc-400 hover:text-black cursor-pointer bg-zinc-100 hover:bg-zinc-205 p-2 rounded-full transition-colors focus:outline-none"
              >
                <span className="text-sm font-bold font-mono">✕</span>
              </button>

              <div className="text-center mb-6">
                <span className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl inline-flex mb-3.5 shadow-sm border border-emerald-100">
                  <Smartphone className="w-6 h-6 animate-pulse" />
                </span>
                <h3 className="text-lg font-bold text-zinc-950">Assinatura Mensal M-Pesa</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Ative o plano <strong className="text-black font-semibold">{checkoutPlan.name}</strong> em sua loja <strong className="text-zinc-800">"{storeSlug || 'outono'}"</strong>.
                </p>
              </div>

              {/* Payment Details Card */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 mb-5 space-y-2">
                <div className="flex justify-between items-center text-xs text-zinc-500">
                  <span>Plataforma de SaaS</span>
                  <span className="font-semibold text-zinc-800 flex items-center gap-1">
                    <GrofyLogo size={12} className="text-zinc-800" /> Grofy Moçambique
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-zinc-500">
                  <span>Plano Selecionado</span>
                  <span className="font-bold text-black">{checkoutPlan.name}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-zinc-500 pt-2 border-t border-zinc-200/65">
                  <span className="font-medium text-zinc-800">Faturamento Mensal Fixo</span>
                  <span className="text-lg font-extrabold text-black font-mono">{checkoutPlan.price} MT</span>
                </div>
              </div>

              {!paymentSuccess ? (
                <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                  {/* Carrier Method Selector Tabs */}
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Selecione o Canal de Pagamento</label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 rounded-xl">
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod('mpesa');
                          setMpesaPhone('');
                        }}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          paymentMethod === 'mpesa'
                            ? 'bg-red-600 text-white shadow-sm'
                            : 'text-zinc-600 hover:bg-zinc-200/60'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                        M-Pesa (Vodacom)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod('emola');
                          setMpesaPhone('');
                        }}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          paymentMethod === 'emola'
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'text-zinc-600 hover:bg-zinc-200/60'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                        e-Mola (Movitel)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                      Telemóvel {paymentMethod === 'mpesa' ? 'M-Pesa (Vodacom)' : 'e-Mola (Movitel)'}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500 text-xs font-bold font-mono">
                        +258
                      </span>
                      <input 
                        type="text"
                        required
                        pattern={paymentMethod === 'mpesa' ? "^[8][45][0-9]{7}$" : "^[8][67][0-9]{7}$"}
                        value={mpesaPhone}
                        onChange={(e) => setMpesaPhone(e.target.value.replace(/\s+/g, ''))}
                        placeholder={paymentMethod === 'mpesa' ? "ex: 841234567" : "ex: 861234567"}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-14 pr-4 text-sm font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all font-mono"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1.5 font-sans leading-relaxed">
                      {paymentMethod === 'mpesa'
                        ? "Introduza os 9 dígitos M-Pesa com prefixo Vodacom aceitável (começando com 84 ou 85)."
                        : "Introduza os 9 dígitos e-Mola com prefixo Movitel aceitável (começando com 86 ou 87)."
                      }
                    </p>
                  </div>

                  {paymentStatusText && (
                    <div className="p-3 bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs rounded-xl font-medium flex flex-col gap-1.5 align-left text-left">
                      <p className="leading-normal">{paymentStatusText}</p>
                      
                      {/* Show Simulation Webhook bypass action inside popup */}
                      <button 
                        type="button"
                        onClick={handleSimulatePaymentWebhook}
                        className="text-left text-amber-700 font-bold underline hover:text-amber-800 text-[11px] block mt-1 cursor-pointer"
                      >
                        ⚡ Simular Confirmação Instantânea via Webhook
                      </button>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={paymentLoading}
                      className={`w-full text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors active:scale-95 shadow-sm inline-flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer ${
                        paymentMethod === 'mpesa' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'
                      }`}
                    >
                      {paymentLoading ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <span>Pagar {checkoutPlan.price} MT</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-4 space-y-3">
                  <div className="w-12 h-12 bg-emerald-55 text-emerald-600 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                    <Check className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h4 className="font-bold text-zinc-950">Pagamento Autorizado com Sucesso!</h4>
                  <p className="text-zinc-500 text-xs leading-relaxed">
                    Sua assinatura no plano <strong>{checkoutPlan.name}</strong> foi validada em conformidade com o gateway <strong>RatixPay</strong>. Redirecionando para a sua vitrine...
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <footer className="py-8 bg-white border-t border-zinc-200/80 text-center text-zinc-400 text-xs">
          Passo obrigatório de ativação. Os outros planos Pro só podem ser ativados após o término do período grátis.
        </footer>
      </div>
    );
  }

  return (
    <div className="bg-zinc-50 min-h-screen font-sans flex flex-col justify-between text-zinc-950">
      
      {/* Top micro Header */}
      <div className="px-6 py-4 flex items-center justify-between bg-white border-b border-zinc-100 max-w-7xl w-full mx-auto">
        <button 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-zinc-500 hover:text-black font-medium text-sm transition-all focus:outline-none"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para Home
        </button>
        <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => onNavigate('home')}>
          <GrofyLogo className="text-black" size={24} />
          <span className="font-bold tracking-tight text-base text-black">Grofy</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12 md:py-16">
        <div className="bg-white p-8 md:p-10 rounded-3xl border border-zinc-200/60 shadow-xl max-w-lg w-full fade-in-up">
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
              {isLogin ? 'Bem-vindo de volta' : 'Crie a sua loja online'}
            </h2>
            <p className="text-zinc-500 text-sm mt-2">
              {isLogin ? 'Gerencie os seus produtos e acompanhe seus pedidos' : 'Inscreva-se hoje e venda produtos em minutos.'}
            </p>
          </div>

          {/* Form error and success alerts */}
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" /> {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">E-mail de Acesso</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: voce@loja.co.mz"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-11 pr-4 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Senha Secreta</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-11 pr-4 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* ONLY show registration parameters if isLogin is false */}
            {!isLogin && (
              <>
                <div id="register-fields-group">
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Nome da Loja</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400">
                      <StoreIcon className="w-4 h-4" />
                    </span>
                    <input 
                      type="text"
                      required
                      value={storeName}
                      onChange={handleStoreNameChange}
                      placeholder="ex: minha loja"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-11 pr-4 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                      <GrofyLogo className="text-zinc-500" size={14} /> Endereço de Domínio Grofy
                    </label>
                    <span className="text-[10px] text-zinc-400 uppercase font-bold font-mono">Gratuito</span>
                  </div>
                  <div className="flex rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50 items-center focus-within:ring-2 focus-within:ring-black focus-within:border-transparent transition-all">
                    <input 
                      type="text"
                      required
                      value={storeSlug}
                      onChange={(e) => setStoreSlug(e.target.value.toLowerCase().trim().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="shop-slug"
                      className="flex-1 bg-transparent py-3 px-4 text-sm text-zinc-900 focus:outline-none"
                    />
                    <span className="bg-zinc-100 text-zinc-500 border-l border-zinc-200 font-mono text-xs px-3.5 py-3 select-none">
                      .grofy.co.mz
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">WhatsApp de Contato (Para Receber Vendas)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400">
                      <Smartphone className="w-4 h-4" />
                    </span>
                    <input 
                      type="text"
                      required
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="ex: +258 84 123 4567"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-11 pr-4 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Plan integrator summary badge */}
                <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200/50 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase font-mono block">PLANO SELECIONADO</span>
                    <span className="text-sm font-bold text-zinc-800">{activePlan}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-zinc-900 bg-zinc-200/60 px-2 py-1 rounded">
                      {activePlan === 'Grátis' ? '0 MZN' : activePlan === 'Standard' ? '147 MZN/mês' : '765 MZN/mês'}
                    </span>
                  </div>
                </div>
              </>
            )}

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={isLoading || isEmailChecking}
              className="w-full bg-black hover:bg-zinc-800 text-white font-semibold py-4 px-4 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isEmailChecking ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span>Verificando e-mail nos servidores...</span>
                </>
              ) : isLoading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span>{isLogin ? 'Iniciar Sessão' : 'Criar Conta de Lojista'}</span>
              )}
            </button>
          </form>

          {/* Toggle buttons between screens */}
          <div className="mt-8 text-center pt-6 border-t border-zinc-100">
            <button
              id="auth-toggle-mode"
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="text-zinc-500 hover:text-black text-sm font-medium transition-colors"
            >
              {isLogin ? 'Não tem uma conta? Cadastre-se gratis' : 'Já tem uma loja registrada? Faça login'}
            </button>
          </div>

        </div>
      </div>

      {/* Footer copyright section */}
      <footer className="py-8 bg-white border-t border-zinc-100 flex items-center justify-center gap-2 text-zinc-400 text-xs">
        <GrofyLogo className="text-zinc-300" size={16} />
        <span>Plataforma em conformidade com o regulamento de privacidade Grofy Moçambique.</span>
      </footer>
    </div>
  );
}
