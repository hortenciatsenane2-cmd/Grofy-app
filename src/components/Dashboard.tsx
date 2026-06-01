import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Plus, Trash2, LogOut, Check, Copy, Database, AlertCircle, 
  ShoppingBag, HelpCircle, ArrowUpRight, TrendingUp, Archive, Send, RefreshCw, Upload, Globe, MessageSquare, Lock
} from 'lucide-react';
import { dbService, DB_SQL_SCHEMA, getFallbackMode } from '../supabaseClient';
import { Product, UserSession } from '../types';
import GrofyLogo from './GrofyLogo';

interface DashboardProps {
  userSession: UserSession;
  onLogout: () => void;
  onNavigate: (view: 'home' | 'auth' | 'dashboard' | 'storefront') => void;
}

export default function Dashboard({ userSession, onLogout, onNavigate }: DashboardProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [dbStatus, setDbStatus] = useState<'live' | 'fallback'>('live');
  const [activeTab, setActiveTab] = useState<'products' | 'ai-registration' | 'supabase-link'>('products');
  const [previewCategory, setPreviewCategory] = useState<string>('TUDO');

  const getPreviewColorDots = (name: string) => {
    const lowercaseName = name.toLowerCase();
    if (lowercaseName.includes('sereno')) return ['#F5F5DC', '#CBD5E1', '#D1D5DB', '#4B5563'];
    if (lowercaseName.includes('noir')) return ['#000000', '#EF4444', '#7F1D1D'];
    if (lowercaseName.includes('blazer') || lowercaseName.includes('atelier')) return ['#D97706', '#F5F5DC', '#000000'];
    if (lowercaseName.includes('brisa') || lowercaseName.includes('saia')) return ['#86EFAC', '#A7F3D0', '#1F2937'];
    if (lowercaseName.includes('terracota') || lowercaseName.includes('tricot')) return ['#EA580C', '#E5E7EB', '#6B7280'];
    return ['#F5F5DC', '#CBD5E1', '#000000'];
  };

  // New Product Manual Form state
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState<number | ''>('');
  const [newProdStock, setNewProdStock] = useState<number | ''>('');
  const [newProdCategory, setNewProdCategory] = useState('VESTIDO');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdImage, setNewProdImage] = useState('');

  // Categories list management states
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // AI-assisted registration form state
  const [aiNameHint, setAiNameHint] = useState('');
  const [aiCategory, setAiCategory] = useState('VESTIDO');
  const [aiImageBase64, setAiImageBase64] = useState<string | null>(null);
  const [aiImageName, setAiImageName] = useState<string>('');
  const [aiIsGenerating, setAiIsGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<{
    name: string;
    description: string;
    price: number;
    tags: string[];
    status?: string;
  } | null>(null);

  // General Notification alerts
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const manualFileInputRef = useRef<HTMLInputElement>(null);
  const [manualImageName, setManualImageName] = useState<string>('');

  // Fetch products lists
  const fetchProducts = async () => {
    const { data, error } = await dbService.getProductsByStore(userSession.storeSlug);
    if (!error) {
      setProducts(data);
    }
    // Update db status flag based on resilient helper
    setDbStatus(getFallbackMode() ? 'fallback' : 'live');
  };

  useEffect(() => {
    fetchProducts();
  }, [userSession.storeSlug]);

  // Load and sync store categories
  useEffect(() => {
    const cats = dbService.getCategories(userSession.storeSlug);
    setCategories(cats);
    if (cats.length > 0) {
      setNewProdCategory(prev => cats.includes(prev) ? prev : cats[0]);
      setAiCategory(prev => cats.includes(prev) ? prev : cats[0]);
    }
  }, [userSession.storeSlug]);

  const handleAddCategory = () => {
    const trimmed = newCategoryInput.trim().toUpperCase();
    if (!trimmed) {
      showNotification('Digite o nome da categoria', 'error');
      return;
    }
    if (categories.includes(trimmed)) {
      showNotification('Esta categoria já existe', 'error');
      return;
    }
    const updated = [...categories, trimmed];
    setCategories(updated);
    dbService.saveCategories(userSession.storeSlug, updated);
    setNewCategoryInput('');
    showNotification(`Categoria "${trimmed}" adicionada com sucesso!`);
  };

  const handleRemoveCategory = (catToRemove: string) => {
    if (categories.length <= 1) {
      showNotification('Sua loja precisa de pelo menos uma categoria ativa', 'error');
      return;
    }
    const updated = categories.filter(c => c !== catToRemove);
    setCategories(updated);
    dbService.saveCategories(userSession.storeSlug, updated);
    if (newProdCategory === catToRemove) {
      setNewProdCategory(updated[0]);
    }
    if (aiCategory === catToRemove) {
      setAiCategory(updated[0]);
    }
    showNotification(`Categoria "${catToRemove}" removida com sucesso!`);
  };

  const showNotification = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(DB_SQL_SCHEMA);
    setSqlCopied(true);
    showNotification('Script SQL copiado com sucesso!', 'success');
    setTimeout(() => setSqlCopied(false), 2000);
  };

  // Trigger base64 reading when uploading files
  const handleAIFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showNotification('A foto deve ter menos de 5MB.', 'error');
        return;
      }
      setAiImageName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAiImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleManualFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showNotification('A foto deve ter menos de 5MB.', 'error');
        return;
      }
      setManualImageName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProdImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit trigger for Gemini AI API call
  const handleGenerateProductWithAI = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiIsGenerating(true);
    setAiResult(null);

    try {
      const response = await fetch('/api/gemini/generate-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: aiImageBase64,
          nameHint: aiNameHint,
          category: aiCategory
        }),
      });

      const data = await response.json();

      if (response.ok && data.result) {
        setAiResult(data.result);
        if (data.result.status === 'mock') {
          showNotification('Conselho: Adicione o GEMINI_API_KEY no painel Secrets para analises reais!', 'info');
        } else {
          showNotification('Análise inteligente gerada com sucesso!', 'success');
        }
      } else {
        throw new Error(data.error || 'Erro na resposta do backend');
      }
    } catch (err: any) {
      console.error(err);
      showNotification('Não foi possível processar a imagem por IA agora. Fallback ativo!', 'error');
      // Simulate safe gorgeous copywriting fallback details
      setAiResult({
        name: `${aiNameHint || 'Produto'} Grofy Style`,
        description: `Produto premium projetado para entregar a melhor qualidade e durabilidade no seu dia a dia. Design inovador e resistente, perfeito para as suas necessidades diárias em Moçambique.`,
        price: aiCategory === 'Acessórios' ? 2400 : 4200,
        tags: [aiCategory, 'Alta Qualidade', 'Premium']
      });
    } finally {
      setAiIsGenerating(false);
    }
  };

  // Accept generated AI details and create product in storecatalog
  const handleAcceptAIProduct = async () => {
    if (!aiResult) return;

    const defaultUnsplashMockImagesByCat: Record<string, string> = {
      'VESTIDO': 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80',
      'VESTIDOS': 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&auto=format&fit=crop&q=80',
      'ALFAIATARIA': 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80',
      'SAIAS': 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80',
      'MALHAS': 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&auto=format&fit=crop&q=80',
      'CONJUNTOS': 'https://images.unsplash.com/photo-1621431759453-3d9691456041?w=600&auto=format&fit=crop&q=80'
    };

    const finalImage = aiImageBase64 || defaultUnsplashMockImagesByCat[aiCategory] || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80';

    const { data, error } = await dbService.addProduct({
      store_id: userSession.storeSlug,
      name: aiResult.name,
      description: aiResult.description,
      price: aiResult.price,
      stock: 20, // Default stock suggestion
      image_url: finalImage,
      category: aiCategory
    });

    if (!error) {
      showNotification('Produto cadastrado com sucesso por IA!', 'success');
      setAiResult(null);
      setAiNameHint('');
      setAiImageBase64(null);
      setAiImageName('');
      setActiveTab('products');
      fetchProducts();
    } else {
      showNotification('Erro ao salvar produto.', 'error');
    }
  };

  // Add a product manually
  const handleAddProductManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdPrice || !newProdStock) {
      showNotification('Por favor, preencha todos os campos obrigatórios', 'error');
      return;
    }

    setIsAddingProduct(true);
    const defaultUnsplashMockImagesByCat: Record<string, string> = {
      'VESTIDO': 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80',
      'VESTIDOS': 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&auto=format&fit=crop&q=80',
      'ALFAIATARIA': 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80',
      'SAIAS': 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80',
      'MALHAS': 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&auto=format&fit=crop&q=80',
      'CONJUNTOS': 'https://images.unsplash.com/photo-1621431759453-3d9691456041?w=600&auto=format&fit=crop&q=80'
    };

    const finalImage = newProdImage || defaultUnsplashMockImagesByCat[newProdCategory] || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80';

    const { data, error } = await dbService.addProduct({
      store_id: userSession.storeSlug,
      name: newProdName,
      description: newProdDesc || 'Sem descrição cadastrada.',
      price: Number(newProdPrice),
      stock: Number(newProdStock),
      image_url: finalImage,
      category: newProdCategory
    });

    if (!error) {
      showNotification('Produto cadastrado com sucesso!', 'success');
      setNewProdName('');
      setNewProdPrice('');
      setNewProdStock('');
      setNewProdDesc('');
      setNewProdImage('');
      setManualImageName('');
      fetchProducts();
    } else {
      showNotification('Erro ao criar produto.', 'error');
    }
    setIsAddingProduct(false);
  };

  // Delete product action wrapper
  const handleDeleteProduct = async (id: string) => {
    setIsDeletingId(id);
    const { success, error } = await dbService.deleteProduct(id, userSession.storeSlug);
    if (success) {
      showNotification('Produto removido de sua vitrine.');
      fetchProducts();
    } else {
      showNotification('Erro ao tentar deletar o produto.', 'error');
    }
    setIsDeletingId(null);
  };

  return (
    <div className="bg-zinc-50 min-h-screen text-zinc-900 font-sans">
      
      {/* Dynamic Floating Notifications */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-xl border flex items-center gap-3 transition-all duration-300 transform translate-y-0 text-xs font-semibold ${
          notification.type === 'success' ? 'bg-zinc-900 text-white border-zinc-800' :
          notification.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' :
          'bg-zinc-50 text-zinc-800 border-zinc-200 shadow-zinc-200'
        }`}>
          {notification.type === 'success' && <Check className="w-4 h-4 text-emerald-400" />}
          {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
          {notification.type === 'info' && <Sparkles className="w-4 h-4 text-zinc-800 animate-pulse" />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Header Menu */}
      <nav className="sticky top-0 z-40 bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <GrofyLogo className="text-black" size={28} />
          <div>
            <span className="font-extrabold text-zinc-950 text-base flex items-center gap-2">
              {userSession.storeName}
              <span className="text-[10px] bg-zinc-100 text-zinc-500 font-mono font-bold uppercase py-0.5 px-1.5 rounded-full select-none">
                Lojista
              </span>
            </span>
          </div>
        </div>

        {/* Sync indicators direct status */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigate('storefront')} 
            className="text-xs font-bold bg-zinc-950 hover:bg-zinc-850 text-white px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" /> <span>Voltar para a Loja</span>
          </button>

          <button 
            onClick={onLogout}
            className="text-xs font-semibold text-zinc-500 hover:text-red-650 flex items-center gap-1 bg-zinc-50 hover:bg-red-50 hover:text-red-600 px-3 py-2 rounded-xl transition-colors border border-transparent hover:border-red-200 cursor-pointer"
            title="Terminar Sessão (Sair da conta)"
          >
            <LogOut className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Log-out</span>
          </button>
        </div>
      </nav>

      {/* Primary Dashboard Area grid wrapper */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Analytics mini board */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          
          <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">PREVISÃO DE FATURAMENTO</p>
              <p className="text-2xl font-bold font-mono tracking-tight text-black mt-1">0 MZN</p>
              <p className="text-zinc-400 text-xs font-semibold flex items-center gap-0.5 mt-0.5">Sem vendas registradas</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-950 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">VISITANTES NA VITRINE</p>
              <p className="text-2xl font-bold font-mono tracking-tight text-black mt-1">0</p>
              <p className="text-zinc-400 text-xs mt-0.5">Aguardando primeiros acessos</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-950 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">PRODUTOS EXPOSTOS</p>
              <p className="text-2xl font-bold font-mono tracking-tight text-black mt-1">{products.length}</p>
              <p className="text-zinc-400 text-xs mt-0.5">Padrão: {userSession.selectedPlan}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-900 flex items-center justify-center">
              <Archive className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">STATUS DO PLANO</p>
              <p className="text-lg font-bold text-zinc-900 mt-1 uppercase flex items-center gap-1">
                {userSession.selectedPlan}
              </p>
              <p className="text-emerald-600 text-[10px] font-bold font-mono bg-emerald-50 w-fit px-1.5 py-0.5 rounded-full mt-1 select-none flex items-center gap-1">
                <Check className="w-3 h-3" /> 3 DIAS GRÁTIS ATIVOS
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-zinc-100 text-emerald-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 fill-emerald-500 text-white" />
            </div>
          </div>

        </div>

        {/* Seção de Domínio e Compartilhamento de Loja */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-zinc-100 text-black">
                  <Globe className="w-5 h-5 animate-pulse text-zinc-800" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-zinc-950 uppercase tracking-wider">
                    Seu Domínio e Link de Compartilhamento
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Seus clientes em Moçambique acessam a sua vitrine diretamente através deste canal digital personalizado.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-2">
                {/* Visual Domain indicator */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-550 tracking-wider flex items-center gap-1.5">
                      <GrofyLogo size={10} className="text-zinc-500" /> Endereço de Domínio Grofy
                    </span>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <p className="font-semibold text-sm text-zinc-900 font-mono">
                        {userSession.storeSlug}.grofy.co.mz
                      </p>
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold font-mono bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded-full border border-emerald-100 uppercase mt-0.5 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse online-block"></span>
                        Domínio Ativo
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-2">
                    Subdomínio virtual reservado e ativo de alta velocidade para a sua loja.
                  </p>
                </div>

                {/* Live shareable URL copy */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-550 tracking-wider">Link de Compartilhamento Direto</span>
                    <div className="mt-1 flex items-center gap-2">
                      <input 
                        type="text" 
                        readOnly 
                        value={`${window.location.origin}/?store=${userSession.storeSlug}`} 
                        className="bg-white border text-xs font-mono font-medium text-zinc-700 rounded-lg px-2.5 py-1.5 w-full select-all focus:outline-none"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-2">
                    Link 100% funcional. Partilhe este endereço em seu Instagram, Facebook ou WhatsApp.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Share action widgets list */}
            <div className="flex flex-wrap lg:flex-col gap-3 w-full lg:w-auto self-stretch justify-center">
              <button 
                onClick={() => {
                  const storeLink = `${window.location.origin}/?store=${userSession.storeSlug}`;
                  navigator.clipboard.writeText(storeLink);
                  showNotification('Link da sua loja copiado com sucesso!', 'success');
                }}
                className="flex-1 lg:flex-none justify-center px-4 py-2.5 rounded-xl text-xs font-bold border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-950 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span>Copiar Link</span>
              </button>

              <button 
                onClick={() => onNavigate('storefront')}
                className="flex-1 lg:flex-none justify-center px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-950 hover:bg-zinc-850 text-white flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Ver Minha Vitrine</span>
              </button>

              <a 
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `Olá! Convido-te a conhecer a nossa loja online *${userSession.storeName}* na Grofy! Espreite o nosso catálogo completo com checkout integrado via WhatsApp: ${window.location.origin}/?store=${userSession.storeSlug}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-[2] lg:flex-none justify-center px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 cursor-pointer transition-colors shadow-sm text-center inline-flex items-center"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Partilhar no WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Tabs Headers */}
        <div className="flex border-b border-zinc-250 mb-8 overflow-x-auto gap-4">
          <button 
            onClick={() => setActiveTab('products')}
            className={`pb-4 text-sm font-bold tracking-tight border-b-2 transition-all shrink-0 uppercase flex items-center gap-1.5 ${activeTab === 'products' ? 'border-black text-black' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}
          >
            <Archive className="w-4 h-4" /> Seus Produtos ({products.length})
          </button>
          <button 
            onClick={() => {
              if (userSession.selectedPlan === '3 Dias Grátis') {
                showNotification('O Cadastro de produtos com IA Gemini está indisponível para o pacote 3 Dias Grátis. Atualize para o plano Premium para liberar!', 'info');
                return;
              }
              setActiveTab('ai-registration');
            }}
            className={`pb-4 text-sm font-bold tracking-tight border-b-2 transition-all shrink-0 uppercase flex items-center gap-1.5 cursor-pointer ${
              userSession.selectedPlan === '3 Dias Grátis'
              ? 'opacity-40 cursor-not-allowed text-zinc-400 border-transparent hover:text-zinc-400'
              : activeTab === 'ai-registration'
              ? 'border-indigo-600 text-indigo-700 font-semibold'
              : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
            title={userSession.selectedPlan === '3 Dias Grátis' ? 'Indisponível no pacote 3 Dias Grátis' : undefined}
          >
            <Sparkles className="w-4 h-4 text-indigo-500" /> 
            <span>Cadastro por IA Gemini</span>
            {userSession.selectedPlan === '3 Dias Grátis' && <Lock className="w-3.5 h-3.5 text-zinc-400 font-bold ml-1" />}
          </button>
        </div>

        {/* TAB 1: Products list and simple manual registers form */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Column 1: Products list (lg:col-span-5) */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              
              <div className="flex justify-between items-center bg-white px-5 py-4 rounded-xl border border-zinc-150 shadow-xs">
                <h2 className="font-extrabold text-zinc-950 text-sm">Peças Cadastradas ({products.length})</h2>
                <button 
                  onClick={() => onNavigate('storefront')}
                  className="text-xs font-bold text-zinc-500 hover:text-black hover:underline flex items-center gap-1"
                >
                  Ver Vitrina Cheia <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {products.length === 0 ? (
                <div className="bg-white border border-zinc-200 rounded-3xl p-10 text-center shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-3">
                    <ShoppingBag className="w-6 h-6 text-zinc-400" />
                  </div>
                  <h3 className="font-bold text-sm text-zinc-800">Nenhum produto cadastrado</h3>
                  <p className="text-zinc-400 text-xs max-w-xs mx-auto mt-2">Cadastre manualmente ou use IA com fotos para popular a sua vitrine pública!</p>
                  <button 
                    onClick={() => {
                      if (userSession.selectedPlan === '3 Dias Grátis') {
                        showNotification('O Cadastro de produtos com IA Gemini está indisponível para o pacote 3 Dias Grátis. Atualize para o plano Premium.', 'info');
                        return;
                      }
                      setActiveTab('ai-registration');
                    }}
                    className={`font-semibold text-xs py-2.5 px-4 rounded-xl transition-all shadow mt-4 inline-flex items-center gap-1.5 ${
                      userSession.selectedPlan === '3 Dias Grátis'
                      ? 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed shadow-none'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" /> 
                    <span>Criar com IA Gemini</span>
                    {userSession.selectedPlan === '3 Dias Grátis' && <Lock className="w-3 h-3 text-zinc-400" />}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4 max-h-[640px] overflow-y-auto pr-1">
                  {products.map((p) => (
                    <div key={p.id} className="bg-white rounded-xl border border-zinc-200 p-3 shadow-xs flex items-center justify-between hover:shadow-sm transition-shadow group">
                      <div className="flex items-center gap-3">
                        <img 
                          src={p.image_url} 
                          alt={p.name} 
                          className="w-14 h-14 rounded-lg object-cover bg-zinc-100 border"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-zinc-900 text-xs">{p.name}</h4>
                            <span className="text-[8px] bg-zinc-100 text-zinc-500 px-1 py-0.2 rounded uppercase font-mono">{p.category}</span>
                          </div>
                          <p className="font-mono text-[11px] font-bold text-zinc-950 mt-1">
                            {p.price.toLocaleString('pt-MZ')} MZN
                          </p>
                          <p className="text-[10px] text-zinc-400 font-mono mt-0.5">Estoque: {p.stock} un</p>
                        </div>
                      </div>
                      
                      <button 
                        disabled={isDeletingId === p.id}
                        onClick={() => handleDeleteProduct(p.id)}
                        className="bg-zinc-50 hover:bg-red-50 hover:text-red-600 text-zinc-400 p-2 rounded-full transition-all shrink-0 border border-transparent hover:border-red-200"
                        title="Remover produto da vitrine"
                      >
                        {isDeletingId === p.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-zinc-900 rounded-full animate-spin"></div>
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Column 2: Manual Registration Form & Categories Manager (lg:col-span-3) */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              
              <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-xs h-fit">
                <h3 className="font-bold text-zinc-900 text-sm mb-1 flex items-center gap-1.5"><Plus className="w-4 h-4 text-black" /> Cadastro Manual</h3>
                <p className="text-zinc-400 text-[10px] mb-4">Adicione novas coleções e vestidos direto na sua base de dados.</p>

                <form onSubmit={handleAddProductManual} className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Nome</label>
                    <input 
                      type="text"
                      required
                      value={newProdName}
                      onChange={(e) => setNewProdName(e.target.value)}
                      placeholder="ex: Vestido Fluido Seda"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2 px-3 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-black focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Preço (MZN)</label>
                      <input 
                        type="number"
                        required
                        value={newProdPrice}
                        onChange={(e) => setNewProdPrice(e.target.value ? Number(e.target.value) : '')}
                        placeholder="e.g. 3500"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2 px-3 text-xs text-zinc-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Estoque</label>
                      <input 
                        type="number"
                        required
                        value={newProdStock}
                        onChange={(e) => setNewProdStock(e.target.value ? Number(e.target.value) : '')}
                        placeholder="e.g. 10"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2 px-3 text-xs text-zinc-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Categoria</label>
                    <select 
                      value={newProdCategory}
                      onChange={(e) => setNewProdCategory(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2 px-3 text-xs text-zinc-955 focus:outline-none"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 text-zinc-700">Foto</label>
                    <div 
                      onClick={() => manualFileInputRef.current?.click()}
                      className="border border-dashed border-zinc-200 hover:border-black bg-zinc-50/60 rounded-lg p-3 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[70px] relative hover:bg-zinc-100/50"
                    >
                      <input 
                        ref={manualFileInputRef}
                        type="file" 
                        accept="image/*" 
                        onChange={handleManualFileChange}
                        className="hidden" 
                      />
                      
                      {newProdImage ? (
                        <div className="w-full">
                          <img src={newProdImage} alt="Preview Upload" className="max-h-12 mx-auto rounded object-contain shadow-xs" />
                          <p className="text-[8px] text-zinc-500 font-medium mt-1 truncate max-w-[120px] mx-auto">
                            {manualImageName || 'Imagem carregada!'}
                          </p>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-zinc-400 mb-1" />
                          <p className="text-[10px] font-bold text-zinc-805">Carregar Foto</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Descrição Curta</label>
                    <textarea 
                      value={newProdDesc}
                      onChange={(e) => setNewProdDesc(e.target.value)}
                      placeholder="Descrição para colocar na sacola..."
                      rows={2}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2 px-3 text-xs text-zinc-900 focus:outline-none resize-none"
                    />
                  </div>

                  <button 
                    id="add-prod-manual-btn"
                    type="submit"
                    disabled={isAddingProduct}
                    className="w-full bg-black hover:bg-zinc-805 text-white font-semibold py-2.5 px-4 rounded-lg text-xs transition-colors shadow flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {isAddingProduct ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <span>Cadastrar Produto</span>
                    )}
                  </button>
                </form>
              </div>

              {/* Gerenciar Categorias Card */}
              <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-xs flex flex-col">
                <h3 className="font-bold text-zinc-900 text-sm mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-3.5 bg-black rounded-full inline-block"></span>
                  Adicionar / Remover Categorias
                </h3>
                <p className="text-zinc-400 text-[10px] mb-4">Gerencie as categorias de produtos da sua loja (Ex: eletrônicos, calçados, telefones, acessórios).</p>

                <div className="space-y-3">
                  {/* Add Input */}
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={newCategoryInput}
                      onChange={(e) => setNewCategoryInput(e.target.value)}
                      placeholder="EX: VESTIDOS"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2 px-3 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-black focus:bg-white uppercase"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCategory();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="bg-black hover:bg-zinc-850 text-white p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center shrink-0 w-8 h-8 font-bold"
                      title="Adicionar categoria"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* List of active categories */}
                  <div className="border border-zinc-100 rounded-lg p-2 bg-zinc-50/50 max-h-[180px] overflow-y-auto space-y-1.5 scrollbar-thin">
                    {categories.length === 0 ? (
                      <p className="text-[10px] text-zinc-400 text-center py-4">Nenhuma categoria cadastrada</p>
                    ) : (
                      categories.map((cat) => (
                        <div key={cat} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-md border border-zinc-200/60 shadow-3xs group">
                          <span className="text-xs font-bold text-zinc-850 tracking-wide uppercase font-sans">
                            {cat}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCategory(cat)}
                            className="text-zinc-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                            title={`Remover categoria ${cat}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  <p className="text-[9px] text-zinc-400 leading-normal">
                    💡 As mudanças são salvas em tempo real com sincronização automática com a vitrine.
                  </p>
                </div>
              </div>

            </div>

            {/* Column 3: Simulated Live Mobile Store View (lg:col-span-4) - Persistent/Sticky device mock */}
            <div className="lg:col-span-4 flex flex-col items-center">
              <div className="w-full max-w-[280px] bg-zinc-900 p-2.5 rounded-[40px] shadow-lg border-2 border-zinc-800 relative z-10 shrink-0 select-none flex flex-col">
                
                {/* Physical Notch */}
                <div className="absolute top-[14px] left-1/2 -translate-x-1/2 w-20 h-4.5 bg-zinc-900 rounded-full z-40 flex items-center justify-center">
                  <div className="w-8 h-0.5 bg-zinc-800 rounded-full" />
                </div>

                {/* Mobile Viewport Area */}
                <div className="w-full bg-[#FAF8F5] rounded-[32px] overflow-hidden flex flex-col aspect-[9/18] text-zinc-900 relative">
                  
                  {/* Shop Header */}
                  <header className="px-3.5 pt-6 pb-2.5 bg-white border-b border-stone-100 flex items-center justify-between">
                    <h1 className="font-serif text-[11px] font-bold tracking-tight text-stone-900 truncate max-w-[130px]" title={userSession.storeName}>
                      {userSession.storeName === 'Coleção Outono/Inverno' ? 'Vestelo Boutique' : userSession.storeName}
                    </h1>
                    <span className="text-[7px] font-mono font-bold bg-emerald-500 text-white px-1.5 py-0.2 rounded-full uppercase tracking-tight">
                      Ao Vivo 📱
                    </span>
                  </header>

                  {/* Scrollable content inside Phone Screen */}
                  <div className="overflow-y-auto flex-1 p-2.5 space-y-3.5 max-h-[432px] scrollbar-none">
                    
                    {/* The beautiful cream/silk background image layer */}
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
                      {['TUDO', ...categories].map((cat, cIdx) => (
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

                    {/* Dynamic product catalogue within phone frame */}
                    <div className="space-y-2.5">
                      <p className="text-[8px] font-extrabold text-stone-400 tracking-wider">
                        {products.filter(p => previewCategory === 'TUDO' || p.category.toUpperCase() === previewCategory.toUpperCase()).length} ITENS EM TEMPO REAL
                      </p>
                      
                      {products.filter(p => previewCategory === 'TUDO' || p.category.toUpperCase() === previewCategory.toUpperCase()).length === 0 ? (
                        <div className="text-center py-6">
                          <ShoppingBag className="w-6 h-6 text-stone-300 mx-auto mb-1 " />
                          <p className="text-[8px] font-bold text-stone-700">Sem produtos com este filtro</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {products.filter(p => previewCategory === 'TUDO' || p.category.toUpperCase() === previewCategory.toUpperCase()).map((p) => (
                            <div key={p.id} className="bg-white rounded p-1.5 border border-stone-100/80 shadow-3xs flex flex-col justify-between">
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
                  <div className="p-2 bg-white border-t border-stone-100 mt-auto">
                    <button type="button" className="w-full bg-emerald-500 text-white font-semibold py-1.5 rounded-lg text-[8px] flex items-center justify-center gap-1 shadow-sm uppercase active:scale-95 duration-100 cursor-not-allowed">
                      <MessageSquare className="w-2.5 h-2.5 fill-white text-emerald-500" /> Sacola do WhatsApp
                    </button>
                  </div>

                </div>

              </div>
              <p className="text-[10px] text-stone-400 text-center mt-3 font-medium max-w-[240px] leading-normal">
                📱 Pré-visualização ao vivo atualizada automaticamente antes ou depois de adicionar/deletar produtos.
              </p>
            </div>

          </div>
        )}

        {/* TAB 2: AI Assisted smart registration with Gemini */}
        {activeTab === 'ai-registration' && (
          <div className="max-w-4xl mx-auto bg-white border border-zinc-200 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-100 pb-6 mb-8">
              <div>
                <h3 className="text-xl font-extrabold text-zinc-950 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" /> Cadastre por IA Gemini
                </h3>
                <p className="text-zinc-500 text-sm mt-1">Nossa inteligência artificial analisa a foto do produto para gerar títulos refinados, descrições atraentes e sugerir valores.</p>
              </div>
              <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono font-bold py-1 px-3 rounded-full flex items-center gap-1 shrink-0">
                <Sparkles className="w-3.5 h-3.5 shrink-0 animate-bounce" /> Gemini 3.5 Flash Ativo
              </span>
            </div>

            <form onSubmit={handleGenerateProductWithAI} className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* left parameters column */}
              <div className="md:col-span-5 flex flex-col gap-5">
                
                {/* File box upload container */}
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Selecione a Foto da Roupa</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-zinc-200 hover:border-indigo-400 bg-zinc-50/65 rounded-2xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center min-h-[160px]"
                  >
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*" 
                      onChange={handleAIFileChange}
                      className="hidden" 
                    />
                    
                    {aiImageBase64 ? (
                      <div className="w-full">
                        <img src={aiImageBase64} alt="Pre-render upload" className="max-h-24 mx-auto rounded-lg object-contain shadow-sm" />
                        <p className="text-[11px] text-zinc-500 tracking-tight text-center font-semibold mt-2.5 truncate max-w-[180px] mx-auto">{aiImageName}</p>
                        <p className="text-[10px] text-indigo-600 font-bold mt-1">Alterar Foto</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-zinc-400 mb-2.5" />
                        <p className="text-xs font-bold text-zinc-700">Carregar imagem comercial</p>
                        <p className="text-[10px] text-zinc-400 mt-1 max-w-[180px]">Utilize formatos JPG/PNG simples das suas coleções.</p>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Insira uma Dica/Nome provisório</label>
                  <input 
                    type="text"
                    value={aiNameHint}
                    onChange={(e) => setAiNameHint(e.target.value)}
                    placeholder="e.g. Sobretudo de lã cinza ou Blazer de linho..."
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 px-4 text-sm text-zinc-950 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Diga a categoria geral</label>
                  <select 
                    value={aiCategory}
                    onChange={(e) => setAiCategory(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 px-4 text-sm text-zinc-950 focus:outline-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <button 
                  id="ai-generate-submit-btn"
                  type="submit"
                  disabled={aiIsGenerating}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-4 rounded-xl text-sm transition-all shadow flex items-center justify-center gap-1.5"
                >
                  {aiIsGenerating ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 fill-white text-indigo-600" /> Analisar e Criar Cópia
                    </>
                  )}
                </button>
              </div>

              {/* Right generated preview results columns */}
              <div className="md:col-span-7 flex flex-col justify-start">
                <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-6 min-h-[340px] flex flex-col justify-between">
                  {aiIsGenerating ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                      <p className="text-sm font-bold text-zinc-800">Processando imagem em tempo real...</p>
                      <p className="text-xs text-zinc-500 mt-1 max-w-xs">Nossa IA está examinando o tecido, aplicando linguagem publicitária elegante e formatando a precificação em Meticais (MZN).</p>
                    </div>
                  ) : aiResult ? (
                    <div className="space-y-5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Display Generated outcomes */}
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] bg-indigo-100 text-indigo-700 font-extrabold uppercase py-0.5 px-2 rounded-full font-mono tracking-wider">
                              GERADO COM EXCELÊNCIA
                            </span>
                            <h4 className="text-xl font-extrabold text-zinc-900 mt-2">{aiResult.name}</h4>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-mono text-base font-extrabold text-zinc-950 bg-white border border-zinc-200 shadow px-3 py-1.5 rounded-xl block">
                              {aiResult.price.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MZN
                            </span>
                            <span className="text-[9px] text-zinc-400 font-semibold block mt-1">Preço Sugerido</span>
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="text-[10px] font-bold text-zinc-400 tracking-wider block mb-1">CÓPIA PUBLICITÁRIA DE VENDA (WHATSAPP)</label>
                          <p className="text-sm text-zinc-600 leading-relaxed font-normal bg-white p-4 rounded-xl border border-zinc-150/80">
                            {aiResult.description}
                          </p>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {aiResult.tags.map((tag, idx) => (
                            <span key={idx} className="bg-zinc-200/60 text-zinc-700 font-mono text-[10px] font-bold py-0.5 px-2 rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-6 border-t border-zinc-200 flex flex-col sm:flex-row gap-3">
                        <button 
                          id="btn-ai-accept"
                          onClick={handleAcceptAIProduct}
                          type="button"
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl text-xs transition-colors shadow flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-4 h-4" /> Aceitar & Cadastrar Produto
                        </button>
                        <button 
                          onClick={() => setAiResult(null)}
                          type="button"
                          className="bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-650 font-semibold py-3 px-4 rounded-xl text-xs transition-colors"
                        >
                          Descartar e Tentar Outro
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                      <Sparkles className="w-12 h-12 text-zinc-300 stroke-[1.2] mb-3" />
                      <p className="text-sm font-bold text-zinc-600">Nenhum resultado gerado</p>
                      <p className="text-xs text-zinc-400 mt-1 max-w-xs">Arraste uma foto ou insira uma sugestão à esquerda e clique em "Analisar e Criar Cópia" para ver as sugestões em tempo real.</p>
                    </div>
                  )}
                </div>
              </div>

            </form>
          </div>
        )}

        {/* TAB 3: Supabase Link & SQL Console instructions */}
        {activeTab === 'supabase-link' && (
          <div className="max-w-4xl mx-auto bg-white border border-zinc-200 rounded-3xl p-6 md:p-8 shadow-sm">
            <h3 className="text-xl font-extrabold text-zinc-950 flex items-center gap-2 mb-2">
              <Database className="w-5 h-5 text-emerald-500" /> Domínio Inteiro dos Seus Dados • Conexão Supabase
            </h3>
            <p className="text-zinc-500 text-sm max-w-2xl leading-relaxed mb-8">
              Sua plataforma Grofy está programada para se conectar diretamente com o seu Banco de Dados no Supabase utilizando a URL e chaves públicas fornecidas. No entanto, para que o Supabase consiga persistir os seus produtos e lojas de forma remota, você precisa executar o Script SQL abaixo uma única vez no editor de consultas do seu console Supabase.
            </p>

            <div className="space-y-6">
              <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-5">
                <h4 className="font-bold text-zinc-800 text-sm mb-3">Siga o passo a passo para conectar em 30 segundos:</h4>
                <ol className="list-decimal pl-5 space-y-2.5 text-xs text-zinc-600">
                  <li>Acesse o seu dashboard global Supabase para o projeto fornecido.</li>
                  <li>Na barra de navegação à esquerda, clique no ícone de <strong>SQL Editor</strong>.</li>
                  <li>Clique em <strong>New query</strong> (Nova consulta).</li>
                  <li>Clique no botão <strong>Copiar Script de Tabelas</strong> abaixo, cole o código no editor e clique no botão <strong>RUN</strong> no canto inferior direito do Supabase.</li>
                </ol>
              </div>

              {/* Text area with copying schema code */}
              <div className="relative">
                <div className="absolute top-2.5 right-2.5 z-10 flex gap-2">
                  <button 
                    onClick={handleCopySql}
                    className="bg-zinc-900 border border-zinc-800 hover:bg-black text-white text-[11px] font-bold py-1.5 px-3.5 rounded-lg flex items-center gap-1.5 shadow"
                  >
                    {sqlCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {sqlCopied ? 'Copiado!' : 'Copiar Script SQL'}
                  </button>
                </div>
                
                <pre className="p-5 pt-14 bg-zinc-950 text-emerald-400 border border-zinc-900 rounded-2xl font-mono text-[11px] leading-relaxed max-h-[300px] overflow-y-auto w-full">
                  {DB_SQL_SCHEMA}
                </pre>
              </div>

              <div className="bg-emerald-50 border border-emerald-150 p-4.5 rounded-2xl flex items-center gap-3.5 text-xs text-emerald-800 font-semibold leading-normal">
                <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Assim que você rodar esse comando no Supabase, a nossa aplicação identificará automaticamente as tabelas e começará a gravar, filtrar e gerenciar as lojas em tempo real diretamente no seu banco de dados de produção do Supabase!</span>
              </div>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
