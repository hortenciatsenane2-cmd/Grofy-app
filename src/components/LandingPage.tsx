import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, Sparkles, Smartphone, ShieldCheck, ShoppingCart, Zap, Globe, MessageSquare, X, ShoppingBag } from 'lucide-react';
import { dbService } from '../supabaseClient';
import GrofyLogo from './GrofyLogo';

interface LandingPageProps {
  onNavigate: (view: 'home' | 'auth' | 'dashboard' | 'storefront') => void;
  onSelectPlan: (plan: string) => void;
}

export default function LandingPage({ onNavigate, onSelectPlan }: LandingPageProps) {
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [demoProductsList, setDemoProductsList] = useState<any[]>([]);
  const [previewCategory, setPreviewCategory] = useState<string>('TUDO');
  const [demoSelectedProduct, setDemoSelectedProduct] = useState<any | null>(null);
  const [demoCartCount, setDemoCartCount] = useState<number>(1);

  const getPreviewColorDots = (name: string) => {
    const lowercaseName = name.toLowerCase();
    if (lowercaseName.includes('sereno')) return ['#F5F5DC', '#CBD5E1', '#D1D5DB', '#4B5563'];
    if (lowercaseName.includes('noir')) return ['#000000', '#EF4444', '#7F1D1D'];
    if (lowercaseName.includes('blazer') || lowercaseName.includes('atelier')) return ['#D97706', '#F5F5DC', '#000000'];
    if (lowercaseName.includes('brisa') || lowercaseName.includes('saia')) return ['#86EFAC', '#A7F3D0', '#1F2937'];
    if (lowercaseName.includes('terracota') || lowercaseName.includes('tricot')) return ['#EA580C', '#E5E7EB', '#6B7280'];
    return ['#F5F5DC', '#CBD5E1', '#000000'];
  };

  // Load products for demo view preview
  useEffect(() => {
    const fetchDemoProducts = async () => {
      try {
        const { data } = await dbService.getProductsByStore('outono');
        if (data && data.length > 0) {
          setDemoProductsList(data);
        } else {
          // fallback to some pre-seeded elegant products
          setDemoProductsList([
            {
              id: 'prod-1',
              name: 'Vestido rosa',
              price: 350,
              image_url: 'https://images.unsplash.com/photo-1621431759453-3d9691456041?w=600&auto=format&fit=crop&q=80',
              category: 'VESTIDO'
            },
            {
              id: 'prod-2',
              name: 'Conjunto',
              price: 1750,
              image_url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&auto=format&fit=crop&q=80',
              category: 'CONJUNTOS'
            },
            {
              id: 'prod-3',
              name: 'Vestido branco',
              price: 300,
              image_url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&auto=format&fit=crop&q=80',
              category: 'VESTIDO'
            },
            {
              id: 'prod-4',
              name: 'Vestido rosa claro',
              price: 750,
              image_url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80',
              category: 'VESTIDOS'
            }
          ]);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchDemoProducts();
  }, []);

  const [selectedMobileProduct, setSelectedMobileProduct] = useState({
    name: 'Casaco Tweed Premium',
    price: 3450,
    img: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80',
    desc: 'Casaco sofisticado estilo tweed preto e branco.'
  });

  const demoProducts = [
    {
      name: 'Casaco Tweed Premium',
      price: 3450,
      img: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80',
      desc: 'Casaco sofisticado estilo tweed preto e branco.'
    },
    {
      name: 'Vestido Linho Areia',
      price: 4200,
      img: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80',
      desc: 'Vestido minimalista em linho puro, tom cru.'
    },
    {
      name: 'Mala Courier Couro',
      price: 6800,
      img: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80',
      desc: 'Mala vintage de couro legítimo.'
    }
  ];

  const selectAndNavigatePlan = (plan: string) => {
    onSelectPlan(plan);
    onNavigate('auth');
  };

  return (
    <div className="bg-white text-zinc-900 font-sans min-h-screen selection:bg-black selection:text-white">
      {/* Navbar */}
      <nav id="navbar" className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('home')}>
          <GrofyLogo className="text-black" size={32} />
          <span className="font-bold tracking-tight text-xl text-black">Grofy</span>
          <span className="text-[10px] bg-zinc-100 text-zinc-600 font-mono px-1.5 py-0.5 rounded uppercase font-semibold">Moçambique</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-zinc-500 hover:text-black transition-colors font-medium text-sm">Recursos</a>
          <a href="#plans" className="text-zinc-500 hover:text-black transition-colors font-medium text-sm">Planos</a>
          <button onClick={() => setIsDemoOpen(true)} className="text-zinc-500 hover:text-black transition-colors font-medium text-sm">Demo Loja</button>
        </div>

        <div className="flex items-center gap-3">
          <button 
            id="btn-login-nav"
            onClick={() => { onSelectPlan('Grátis'); onNavigate('auth'); }}
            className="text-sm font-medium text-zinc-600 hover:text-black px-4 py-2 transition-colors duration-200"
          >
            Entrar
          </button>
          <button 
            id="btn-register-nav"
            onClick={() => { onSelectPlan('Premium'); onNavigate('auth'); }}
            className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-all duration-200 shadow-sm"
          >
            Criar Conta
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero-section" className="px-6 pt-12 pb-24 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        <div className="lg:col-span-7 flex flex-col justify-center fade-in-up">
          <div className="inline-flex items-center gap-2 bg-zinc-100 text-zinc-800 rounded-full px-3 py-1 text-xs font-medium w-fit mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            3 dias grátis • Sem cartão de crédito
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-900 leading-[1.08] mb-6">
            A sua loja online, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 via-neutral-600 to-zinc-400">viva em minutos.</span>
          </h1>
          
          <p className="text-zinc-500 text-lg md:text-xl leading-relaxed max-w-xl mb-10">
            Crie um e-commerce ultrarrápido com Inteligência Artificial. Cadastre produtos tirando fotos, venda em Meticais (MZN) e converta clientes direto pelo WhatsApp.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <button 
              id="hero-cta-register"
              onClick={() => { onSelectPlan('Premium'); onNavigate('auth'); }}
              className="bg-black text-white px-8 py-4 rounded-xl font-medium text-base hover:bg-zinc-800 transition-all duration-200 shadow-lg shadow-zinc-200 flex items-center justify-center gap-2"
            >
              Criar Loja Grátis <ArrowRight className="w-5 h-5" />
            </button>
            <button 
              id="hero-cta-demo"
              onClick={() => setIsDemoOpen(true)}
              className="border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 px-8 py-4 rounded-xl font-medium text-base transition-all duration-200 flex items-center justify-center gap-2"
            >
              Ver Demonstração <Smartphone className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-12 border-t border-zinc-100 mt-12">
            <div>
              <p className="text-2xl font-bold font-mono text-black">100%</p>
              <p className="text-zinc-400 text-xs">Focado em Moçambique</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-black">MZN</p>
              <p className="text-zinc-400 text-xs text-ellipsis overflow-hidden">Moeda Local Integrada</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-black">Via IA</p>
              <p className="text-zinc-400 text-xs">Cadastro Instantâneo</p>
            </div>
          </div>
        </div>

        {/* Visual Preview Section (Mobile store selector mockup) */}
        <div className="lg:col-span-5 flex justify-center fade-in-up md:px-6">
          <div className="relative w-full max-w-[340px] bg-zinc-950 rounded-[48px] p-3.5 shadow-2xl border-4 border-zinc-800/80">
            {/* Speaker bar */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-950 rounded-b-2xl z-20 flex items-center justify-center">
              <div className="w-12 h-1 bg-zinc-800 rounded-full"></div>
            </div>

            {/* Simulated smartphone screen contents */}
            <div className="w-full bg-stone-50 rounded-[38px] overflow-hidden min-h-[500px] flex flex-col justify-between pt-10 text-zinc-900 relative">
              
              {/* Phone Header */}
              <div className="px-4 py-2 flex items-center justify-between border-b border-zinc-100 bg-white">
                <div className="flex items-center gap-1.5">
                  <GrofyLogo className="text-black" size={16} />
                  <span className="font-extrabold tracking-widest text-xs uppercase">Grofy Shop</span>
                </div>
                <div className="relative">
                  <ShoppingCart className="w-4 h-4 text-zinc-700" />
                  <span className="absolute -top-1.5 -right-1.5 bg-black text-[9px] font-bold text-white w-3.5 h-3.5 rounded-full flex items-center justify-center">1</span>
                </div>
              </div>

              {/* Main content within frame */}
              <div className="px-4 py-4 flex-1 overflow-y-auto">
                <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full font-mono uppercase font-bold tracking-tight">Coleção Outono</span>
                
                {/* Visual Image container switcher */}
                <div className="relative rounded-2xl overflow-hidden bg-white mt-2.5 shadow-sm aspect-square">
                  <img 
                    src={selectedMobileProduct.img} 
                    alt={selectedMobileProduct.name} 
                    className="w-full h-full object-cover transition-all duration-300"
                  />
                </div>

                {/* Switch item details dynamically */}
                <div className="mt-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-sm text-zinc-950">{selectedMobileProduct.name}</h3>
                    <span className="font-mono text-sm font-semibold text-zinc-900 bg-zinc-100 px-1.5 py-0.5 rounded">
                      {selectedMobileProduct.price.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MZN
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1 lines-clamp-2">{selectedMobileProduct.desc}</p>
                </div>

                {/* Interactive click preview trigger info */}
                <div className="mt-4 bg-zinc-100/60 p-2 rounded-xl border border-zinc-200/50">
                  <p className="text-[10px] text-zinc-500 mb-1.5 font-semibold">Simule a troca de produto:</p>
                  <div className="flex gap-2.5">
                    {demoProducts.map((p, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setSelectedMobileProduct(p)}
                        className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${selectedMobileProduct.name === p.name ? 'border-black scale-105' : 'border-zinc-200'}`}
                      >
                        <img src={p.img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Order Bump Alert Preview */}
              <div className="p-3 bg-white border-t border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded text-black focus:ring-black w-3.5 h-3.5" />
                  <div className="text-[9px]">
                    <p className="font-semibold text-zinc-950">Add Óculos Sunset (+1,200 MZN)</p>
                    <p className="text-zinc-600 font-medium">94% dos Lojistas utilizam Order Bump</p>
                  </div>
                </div>
              </div>

              {/* WhatsApp Checkout simulation CTA wrapper */}
              <div className="p-3.5 bg-white border-t border-zinc-100 rounded-b-[38px]">
                <button 
                  onClick={() => setIsDemoOpen(true)}
                  className="w-full bg-emerald-500 text-white font-medium py-2.5 px-4 rounded-xl text-xs hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1.5 shadow"
                >
                  <MessageSquare className="w-3.5 h-3.5 fill-white" /> Finalizar por WhatsApp
                </button>
              </div>
            </div>

            {/* Shadow ambient effects */}
            <div className="absolute -inset-1.5 bg-gradient-to-tr from-zinc-500/20 to-neutral-200/20 rounded-[50px] -z-10 blur-xl"></div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section id="features" className="bg-zinc-50 py-24 px-6 border-y border-zinc-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-xs font-bold tracking-widest text-zinc-500 uppercase mb-3">Recursos Exclusivos</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">
              Construído para aproximar a sua marca do sucesso.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl border border-zinc-100 hover:shadow-lg transition-transform hover:-translate-y-1 duration-300">
              <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6 text-black" />
              </div>
              <h3 className="font-bold text-lg text-zinc-900 mb-2">Sincronização via IA</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Tire uma foto dos seus produtos e deixe que a nossa IA gere o título de luxo, a descrição persuasiva e o preço ideal em Meticais.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl border border-zinc-100 hover:shadow-lg transition-transform hover:-translate-y-1 duration-300">
              <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-black" />
              </div>
              <h3 className="font-bold text-lg text-zinc-900 mb-2">Impulso de Vendas</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Adicione Order Bump dinâmico na sacola do cliente para sugerir acessórios complementares (óculos, chapéu, cintos) e aumentar o faturamento médio.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl border border-zinc-100 hover:shadow-lg transition-transform hover:-translate-y-1 duration-300">
              <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6 text-black" />
              </div>
              <h3 className="font-bold text-lg text-zinc-900 mb-2">Design Extraordinário</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Visual requintado baseado no design moderno e limpo. A sua marca se posiciona de forma única e premium para os seus clientes.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-8 rounded-2xl border border-zinc-100 hover:shadow-lg transition-transform hover:-translate-y-1 duration-300">
              <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center mb-6">
                <Globe className="w-6 h-6 text-black" />
              </div>
              <h3 className="font-bold text-lg text-zinc-900 mb-2">Sua Marca Própria</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Utilize subdomínios gratuitos Grofy ou configure o seu próprio domínio profissional (.co.mz ou .com) em poucas etapas simples.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / Plan section */}
      <section id="plans" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="text-xs font-bold tracking-widest text-zinc-500 uppercase mb-3">Nossos Planos</h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">
            Transparente e sob medida para o seu tamanho.
          </p>
          <p className="text-zinc-500 mt-3 text-sm">Cancele quando quiser, mude de plano a qualquer momento.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          
          {/* Plan 1 - Grátis */}
          <div className="bg-white p-10 rounded-3xl border border-zinc-200/80 flex flex-col justify-between hover:shadow-md transition-all duration-300">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-bold text-xl text-zinc-900">Plano Grátis</h3>
                  <p className="text-zinc-400 text-xs mt-1">Ideal para dar os primeiros passos</p>
                </div>
                <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-1 rounded-full font-bold uppercase tracking-wider font-mono">Starter</span>
              </div>

              <div className="mb-8">
                <span className="text-4xl font-extrabold text-black font-mono">0 MZN</span>
                <span className="text-zinc-400 text-sm font-medium"> /mês</span>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-sm text-zinc-600">
                  <Check className="w-4 h-4 text-zinc-900 shrink-0" />
                  <span>Até 5 produtos ativos</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-600">
                  <Check className="w-4 h-4 text-zinc-900 shrink-0" />
                  <span>Checkout direto no WhatsApp</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-600/50">
                  <Check className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span className="line-through">Cadastro assistido por Inteligência Artificial</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-600/50">
                  <Check className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span className="line-through">Order Bump de acessórios</span>
                </li>
              </ul>
            </div>
            
            <button 
              id="plan-cta-free"
              onClick={() => selectAndNavigatePlan('Grátis')}
              className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold py-3 px-4 rounded-xl text-sm transition-colors duration-200"
            >
              Começar Agora
            </button>
          </div>

          {/* Plan 2 - Standard */}
          <div className="bg-white p-10 rounded-3xl border border-zinc-200/80 flex flex-col justify-between hover:shadow-md transition-all duration-300">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-bold text-xl text-zinc-900">Standard</h3>
                  <p className="text-zinc-400 text-xs mt-1">O motor para lojas em crescimento</p>
                </div>
                <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-1 rounded-full font-bold uppercase tracking-wider font-mono">Crescimento</span>
              </div>

              <div className="mb-8">
                <span className="text-4xl font-extrabold text-black font-mono">147 MZN</span>
                <span className="text-zinc-400 text-sm font-medium"> /mês</span>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-sm text-zinc-600">
                  <Check className="w-4 h-4 text-zinc-900 shrink-0" />
                  <span>Até 30 produtos cadastrados</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-600">
                  <Check className="w-4 h-4 text-zinc-900 shrink-0" />
                  <span>Painel de gestão com controle de estoque</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-600">
                  <Check className="w-4 h-4 text-zinc-900 shrink-0" />
                  <span>Checkout otimizado WhatsApp</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-600 font-semibold">
                  <Check className="w-4 h-4 text-zinc-900 shrink-0" />
                  <span>Order Bump para elevar faturamento</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-600/55">
                  <Check className="w-4 h-4 text-zinc-300 shrink-0" />
                  <span className="line-through">Cadastro ilimitado por IA</span>
                </li>
              </ul>
            </div>

            <button 
              id="plan-cta-standard"
              onClick={() => selectAndNavigatePlan('Standard')}
              className="w-full bg-zinc-900 hover:bg-black text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all duration-200 shadow"
            >
              Escolher Plano Growth
            </button>
          </div>

          {/* Plan 3 - Premium (MAIS RECOMENDADO) */}
          <div className="bg-zinc-950 text-white p-10 rounded-3xl border-2 border-black flex flex-col justify-between shadow-2xl relative overflow-hidden transform hover:scale-[1.01] transition-all duration-300">
            {/* Spotlight tag indicator */}
            <div className="absolute top-0 right-0 bg-white text-zinc-950 text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl font-mono">
              ★ RECOMENDADO
            </div>
            
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-bold text-xl text-white flex items-center gap-1.5">
                    <GrofyLogo className="text-white" size={24} />
                    Grofy Premium
                  </h3>
                  <p className="text-zinc-400 text-xs mt-1">A solução gourmet para vestir Moçambique</p>
                </div>
              </div>

              <div className="mb-8">
                <span className="text-4xl font-extrabold text-white font-mono">765 MZN</span>
                <span className="text-zinc-400 text-sm font-medium"> /mês</span>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-sm text-zinc-200">
                  <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </span>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">Produtos Ilimitados</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-200">
                  <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </span>
                  <span>Domínio personalizado (.co.mz, etc)</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-200">
                  <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </span>
                  <span className="font-semibold">Cadastro por IA Inteligente Gemini</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-200">
                  <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </span>
                  <span>Order Bump de alta conversão</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-200">
                  <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </span>
                  <span>Suporte VIP Prioritário 24/7</span>
                </li>
              </ul>
            </div>

            <button 
              id="plan-cta-premium"
              onClick={() => selectAndNavigatePlan('Premium')}
              className="w-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold py-4 px-4 rounded-xl text-sm transition-all duration-200 shadow-xl"
            >
              Criar Conta Premium (3 Dias Grátis)
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-50 border-t border-zinc-100 py-12 px-6 text-center">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <GrofyLogo className="text-black" size={24} />
            <span className="font-bold tracking-tight text-sm text-black">Grofy SaaS</span>
          </div>
          <p className="text-zinc-400 text-xs">
            © 2026 Grofy. Todos os direitos reservados. Focado no progresso do e-commerce de Moçambique.
          </p>
        </div>
      </footer>

      {/* Interactive Mobile Premium Device Mock Overlay Modal */}
      {isDemoOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          
          {/* Main Overlay Frame close action */}
          <div className="absolute inset-0 cursor-default" onClick={() => setIsDemoOpen(false)} />

          {/* Floating close 'X' button explicitly required */}
          <button 
            onClick={() => setIsDemoOpen(false)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 hover:scale-105 active:scale-95 text-white p-3 rounded-full transition-all duration-200 z-[110] shadow-xl flex items-center justify-center border border-white/10 cursor-pointer"
            title="Sair da demonstração"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Centered Phone Content frame */}
          <div className="relative z-10 w-full max-w-[325px] flex flex-col items-center gap-4 animate-scale-up">
            
            <div className="text-center text-white mb-2 max-w-xs">
              <h2 className="font-bold text-lg leading-tight tracking-tight flex items-center justify-center gap-1.5">
                📱 <GrofyLogo className="text-white animate-pulse" size={20} /> Vitrine Digital Grofy
              </h2>
              <p className="text-xs text-zinc-400 mt-1">Navegue pelas categorias e clique em qualquer produto para ver detalhes interativos.</p>
            </div>

            {/* Exactly the mobile container frame used in general Dashboard */}
            <div className="w-full max-w-[285px] bg-zinc-900 p-2.5 rounded-[42px] shadow-2xl border-2 border-zinc-800 relative select-none flex flex-col">
              
              {/* Physical Notch */}
              <div className="absolute top-[14px] left-1/2 -translate-x-1/2 w-20 h-4.5 bg-zinc-900 rounded-full z-[110] flex items-center justify-center">
                <div className="w-8 h-0.5 bg-zinc-800 rounded-full" />
              </div>

              {/* Mobile Viewport Area */}
              <div className="w-full bg-[#FAF8F5] rounded-[34px] overflow-hidden flex flex-col aspect-[9/18.2] text-zinc-900 relative">
                
                {demoSelectedProduct ? (
                  /* IN-PHONE PRODUCT DETAIL VIEW */
                  <div className="flex-1 flex flex-col justify-between bg-white text-left text-zinc-900 h-full">
                    
                    <header className="px-3.5 pt-6 pb-2.5 bg-white border-b border-stone-100 flex items-center gap-1">
                      <button 
                        onClick={() => setDemoSelectedProduct(null)}
                        className="py-1 px-2 -ml-1.5 hover:bg-stone-50 rounded-lg text-[9px] font-bold text-stone-600 transition-colors flex items-center"
                      >
                        ← Voltar
                      </button>
                    </header>

                    <div className="overflow-y-auto flex-1 p-3.5 space-y-3.5 scrollbar-none">
                      <div className="aspect-[4/5] rounded-xl overflow-hidden bg-stone-50 border border-stone-100 shadow-3xs">
                        <img 
                          src={demoSelectedProduct.image_url} 
                          alt="" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-[7px] font-extrabold tracking-widest text-[#8C8276] uppercase bg-[#FAF8F5] border border-stone-150/40 px-2 py-0.5 rounded-sm">
                          {demoSelectedProduct.category}
                        </span>
                        <h4 className="font-serif text-sm font-bold text-stone-900 pt-1 leading-tight">{demoSelectedProduct.name}</h4>
                        <p className="font-mono text-[10px] font-extrabold text-[#7c7161]">
                          {demoSelectedProduct.price.toLocaleString('pt-MZ')} MT
                        </p>
                      </div>

                      <p className="text-[9px] text-stone-500 leading-relaxed font-sans mt-1">
                        {demoSelectedProduct.description || "Inspirada na leveza e no frescor da sofisticação e-commerce de Moçambique."}
                      </p>
                    </div>

                    <div className="p-2.5 bg-white border-t border-stone-100">
                      <button 
                        onClick={() => {
                          setDemoCartCount(prev => prev + 1);
                          setDemoSelectedProduct(null);
                        }}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 rounded-lg text-[9px] flex items-center justify-center gap-1 shadow-sm uppercase active:scale-95 duration-100 cursor-pointer"
                      >
                        Adicionar à Sacola do Whatsapp
                      </button>
                    </div>

                  </div>
                ) : (
                  /* IN-PHONE CATALOG LISTING */
                  <div className="flex-1 flex flex-col justify-between h-full">
                    
                    {/* Shop Header */}
                    <header className="px-3.5 pt-6 pb-2.5 bg-white border-b border-stone-100 flex items-center justify-between">
                      <h1 className="font-serif text-[11px] font-bold tracking-tight text-stone-900 truncate max-w-[130px]" title="Vestelo Boutique">
                        Vestelo Boutique
                      </h1>
                      <div className="flex items-center gap-2">
                        <span className="text-[6px] font-mono font-bold bg-emerald-500 text-white px-1.5 py-0.2 rounded-full uppercase tracking-tight animate-pulse">
                          Ao Vivo
                        </span>
                        <div className="relative">
                          <ShoppingBag className="w-3.5 h-3.5 text-stone-700" />
                          {demoCartCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-black text-white text-[6px] font-bold w-2.5 h-2.5 rounded-full flex items-center justify-center animate-bounce">
                              {demoCartCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </header>

                    {/* Scrollable content inside Phone Screen */}
                    <div className="overflow-y-auto flex-1 p-2.5 space-y-3.5 max-h-[432px] scrollbar-none">
                      
                      {/* Beautiful ambient banner image layer */}
                      <div className="relative rounded-lg overflow-hidden h-24 flex flex-col justify-end p-2 border border-stone-150/40">
                        <img 
                          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80" 
                          alt="Silk Luxury Canvas" 
                          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                          style={{ filter: "brightness(0.98) contrast(1.01)" }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/50 to-transparent" />
                        <div className="relative z-10 text-left">
                          <span className="text-[6px] tracking-[0.15em] font-bold text-stone-500 uppercase block">
                            NOVA COLEÇÃO
                          </span>
                          <h2 className="font-serif text-[10px] font-normal leading-tight tracking-tight text-stone-900 mt-0.5 max-w-[150px]">
                            Elegância minimalista para o seu dia.
                          </h2>
                        </div>
                      </div>

                      {/* Filter categories row */}
                      <div className="flex gap-1 overflow-x-auto scrollbar-none py-1">
                        {['TUDO', 'VESTIDO', 'VESTIDOS', 'ALFAIATARIA', 'SAIAS', 'MALHAS', 'CONJUNTOS'].map((cat, cIdx) => (
                          <button 
                            key={cIdx} 
                            type="button"
                            onClick={() => setPreviewCategory(cat)}
                            className={`py-1 px-2 rounded-full text-[7px] font-bold uppercase shrink-0 transition-colors ${previewCategory === cat ? 'bg-black text-white' : 'bg-stone-100 text-stone-500'}`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      {/* Catalogue of products */}
                      <div className="space-y-2.5">
                        <p className="text-[8px] font-extrabold text-[#8C8276] tracking-wider uppercase">
                          {demoProductsList.filter(p => previewCategory === 'TUDO' || p.category.toUpperCase() === previewCategory.toUpperCase()).length} ITENS EM TEMPO REAL
                        </p>
                        
                        {demoProductsList.filter(p => previewCategory === 'TUDO' || p.category.toUpperCase() === previewCategory.toUpperCase()).length === 0 ? (
                          <div className="text-center py-6">
                            <ShoppingBag className="w-6 h-6 text-stone-300 mx-auto mb-1" />
                            <p className="text-[8px] font-semibold text-stone-700">Sem produtos com este filtro</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {demoProductsList.filter(p => previewCategory === 'TUDO' || p.category.toUpperCase() === previewCategory.toUpperCase()).map((p) => (
                              <div 
                                key={p.id} 
                                onClick={() => setDemoSelectedProduct(p)}
                                className="bg-white rounded p-1.5 border border-stone-100/80 shadow-3xs flex flex-col justify-between cursor-pointer hover:border-stone-300 transition-colors text-left"
                              >
                                <div className="aspect-[4/5] bg-stone-50 relative rounded overflow-hidden">
                                  <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                                </div>
                                <h4 className="font-sans text-[8px] text-stone-800 truncate font-semibold mt-1">
                                  {p.name}
                                </h4>
                                <div className="flex items-center justify-between mt-0.5">
                                  <span className="font-sans font-bold text-[8px] text-stone-950">
                                    {p.price.toLocaleString('pt-MZ') + ' MT'}
                                  </span>
                                  <div className="flex gap-0.5">
                                    {getPreviewColorDots(p.name).slice(0, 2).map((col, idx) => (
                                      <span key={idx} style={{ backgroundColor: col }} className="w-1 h-1 rounded-full border border-stone-100" />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Direct WA Redirect button representation */}
                    <div className="p-2.5 bg-white border-t border-stone-100 mt-auto">
                      <button 
                        type="button" 
                        onClick={() => {
                          alert(`Esta é uma demonstração de alta fidelidade da sua loja Grofy! O cliente final seria redirecionado ao seu WhatsApp +258 84 123 4567 com um carrinho elegante contendo os itens selecionados.`);
                          setDemoCartCount(0);
                        }}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 transition-colors text-white font-semibold py-1.5 rounded-lg text-[8px] flex items-center justify-center gap-1 shadow-sm uppercase active:scale-95 duration-100 cursor-pointer"
                      >
                        <MessageSquare className="w-2.5 h-2.5 fill-white text-emerald-500" /> Sacola do WhatsApp ({demoCartCount})
                      </button>
                    </div>

                  </div>
                )}

              </div>

            </div>

            <p className="text-[10px] text-zinc-500 text-center font-medium max-w-[240px] leading-normal pt-1">
              🚀 Esta é a exata experiência de vitrine que seu cliente final tem no smartphone!
            </p>

          </div>
        </div>
      )}
    </div>
  );
}
