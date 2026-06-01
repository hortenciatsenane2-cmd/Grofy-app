import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, ArrowLeft, Check, Smartphone, MessageSquare, Plus, ShoppingCart, 
  Minus, Shield, HelpCircle, ChevronRight, X, Sparkles, Tag, MoreVertical, Search,
  Menu, Trash2, Edit2, UploadCloud, Eye
} from 'lucide-react';
import { dbService } from '../supabaseClient';
import { Product, CartItem, OrderBumpItem, UserSession } from '../types';
import GrofyLogo from './GrofyLogo';

interface StorefrontDemoProps {
  userSession: UserSession | null;
  onNavigate: (view: 'home' | 'auth' | 'dashboard' | 'storefront') => void;
}

const ORDER_BUMP_ACC: OrderBumpItem = {
  id: 'bump-sunset-glasses',
  name: 'Óculos de Sol Retro Sunset',
  price: 1200,
  image_url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80',
  description: 'Óculos polarizados com proteção UV400 e armação turtle shell de acetato italiano.'
};

// Pastel and natural fabric color combinations matching the elegant screenshot aesthetics
const getColorDots = (name: string) => {
  const lowercaseName = name.toLowerCase();
  if (lowercaseName.includes('sereno')) {
    return ['#F5F5DC', '#CBD5E1', '#D1D5DB', '#4B5563']; // beige, light slate, gray, dark-gray
  } else if (lowercaseName.includes('noir')) {
    return ['#000000', '#EF4444', '#7F1D1D']; // black, red, burgundy
  } else if (lowercaseName.includes('blazer') || lowercaseName.includes('atelier')) {
    return ['#D97706', '#F5F5DC', '#000000']; // brown, beige, black
  } else if (lowercaseName.includes('brisa') || lowercaseName.includes('saia')) {
    return ['#86EFAC', '#A7F3D0', '#1F2937']; // light green, sage, dark gray
  } else if (lowercaseName.includes('terracota') || lowercaseName.includes('tricot')) {
    return ['#EA580C', '#E5E7EB', '#6B7280']; // orange, silver, gray
  }
  return ['#F5F5DC', '#CBD5E1', '#000000'];
};

const getColorName = (hex: string) => {
  const map: Record<string, string> = {
    '#F5F5DC': 'Marfim',
    '#CBD5E1': 'Azul Sereno',
    '#D1D5DB': 'Cinza Claro',
    '#4B5563': 'Grafite',
    '#000000': 'Preto Noir',
    '#EF4444': 'Vermelho',
    '#7F1D1D': 'Borgonha',
    '#D97706': 'Caramelo',
    '#86EFAC': 'Verde Brisa',
    '#A7F3D0': 'Sage Menta',
    '#1F2937': 'Chumbo',
    '#EA580C': 'Terracota',
    '#E5E7EB': 'Off-White',
    '#6B7280': 'Nude'
  };
  return map[hex] || 'Cores';
};

export default function StorefrontDemo({ userSession, onNavigate }: StorefrontDemoProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('TUDO');
  const [searchQuery, setSearchQuery] = useState('');
  const [isOrderBumpChecked, setIsOrderBumpChecked] = useState(false);

  // Dynamic order bump suggestion from store registered products
  const dynamicOrderBump = React.useMemo(() => {
    // Collect IDs of products that are already in the cart
    const cartProductIds = new Set(cart.map(item => item.product.id));
    // Find all products that are NOT currently in the cart
    const availableBumpProducts = products.filter(p => !cartProductIds.has(p.id));
    
    if (availableBumpProducts.length > 0) {
      // Pick a product to showcase as the order bump deterministically
      const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
      const selectedIndex = totalQuantity % availableBumpProducts.length;
      const selected = availableBumpProducts[selectedIndex];
      
      return {
        id: selected.id,
        name: selected.name,
        // Offer a discount on the product to make it an attractive order bump (e.g. 50% discount)
        price: Math.max(100, Math.round(selected.price * 0.5)), 
        image_url: selected.image_url,
        description: selected.description || `Oferta complementar exclusiva para a sua compra!`
      };
    }
    
    // Fallback if no other products are registered/available in the store
    return ORDER_BUMP_ACC;
  }, [cart, products]);
  
  // Product details focus state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedColorHex, setSelectedColorHex] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('P');
  const [detailQuantity, setDetailQuantity] = useState<number>(1);

  // Merchant admin gateway parameters
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  const [isLoading, setIsLoading] = useState(true);

  // Store metadata fallback
  const storeSlug = userSession?.storeSlug || 'outono';
  const storeName = userSession?.storeName || 'Vestelo Boutique';
  const whatsappNumber = userSession?.whatsappNumber || '+258841234567';

  // Customized live store settings with LocalStorage backing
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'visual' | 'add' | 'remove'>('visual');
  const [bannerUploadProgress, setBannerUploadProgress] = useState<number | null>(null);
  const [productUploadProgress, setProductUploadProgress] = useState<number | null>(null);

  const [storeNameState, setStoreNameState] = useState<string>(() => {
    return localStorage.getItem(`grofy_custom_name_${storeSlug}`) || storeName;
  });

  const [whatsappNumberState, setWhatsappNumberState] = useState<string>(() => {
    return localStorage.getItem(`grofy_custom_whatsapp_${storeSlug}`) || whatsappNumber;
  });

  const [storeDescriptionState, setStoreDescriptionState] = useState<string>(() => {
    return localStorage.getItem(`grofy_custom_desc_${storeSlug}`) || 'A melhor seleção de produtos de alta qualidade, feitos para o seu dia a dia.';
  });

  const [bannerTitleState, setBannerTitleState] = useState<string>(() => {
    return localStorage.getItem(`grofy_custom_banner_title_${storeSlug}`) || 'Tudo o que precisa para o seu dia a dia em um só lugar.';
  });

  const [storeBannerUrlState, setStoreBannerUrlState] = useState<string>(() => {
    return localStorage.getItem(`grofy_custom_banner_url_${storeSlug}`) || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80';
  });

  const [isBannerEnabled, setIsBannerEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem(`grofy_custom_banner_enabled_${storeSlug}`);
    return stored !== 'false';
  });

  // Manual product catalog inputs inside Drawer
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState<number | ''>('');
  const [newProdStock, setNewProdStock] = useState<number | ''>('');
  const [newProdCategory, setNewProdCategory] = useState('VESTIDO');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdImage, setNewProdImage] = useState('');
  const [productImageName, setProductImageName] = useState('');

  // Uploader Handlers
  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerUploadProgress(0);
      const interval = setInterval(() => {
        setBannerUploadProgress(prev => {
          if (prev === null) return 0;
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 20;
        });
      }, 150);

      const reader = new FileReader();
      reader.onloadend = () => {
        setTimeout(() => {
          setStoreBannerUrlState(reader.result as string);
          localStorage.setItem(`grofy_custom_banner_url_${storeSlug}`, reader.result as string);
          setBannerUploadProgress(null);
        }, 900);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProductUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProductImageName(file.name);
      setProductUploadProgress(0);
      const interval = setInterval(() => {
        setProductUploadProgress(prev => {
          if (prev === null) return 0;
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 25;
        });
      }, 120);

      const reader = new FileReader();
      reader.onloadend = () => {
        setTimeout(() => {
          setNewProdImage(reader.result as string);
          setProductUploadProgress(null);
        }, 600);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProductFromSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdPrice || !newProdStock) return;

    const defaultImageByCat: Record<string, string> = {
      'VESTIDO': 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80',
      'VESTIDOS': 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&auto=format&fit=crop&q=80',
      'ALFAIATARIA': 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80',
      'SAIAS': 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80',
      'MALHAS': 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&auto=format&fit=crop&q=80',
      'CONJUNTOS': 'https://images.unsplash.com/photo-1621431759453-3d9691456041?w=600&auto=format&fit=crop&q=80'
    };

    const finalImage = newProdImage || defaultImageByCat[newProdCategory] || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80';
    
    const { data, error } = await dbService.addProduct({
      store_id: storeSlug,
      name: newProdName,
      description: newProdDesc || 'Corte fluido com caimento impecável.',
      price: Number(newProdPrice),
      stock: Number(newProdStock),
      image_url: finalImage,
      category: newProdCategory
    });

    if (!error) {
      // Reload products catalog in store
      const { data: updatedProducts } = await dbService.getProductsByStore(storeSlug);
      if (updatedProducts) setProducts(updatedProducts);

      // Reset fields
      setNewProdName('');
      setNewProdPrice('');
      setNewProdStock('');
      setNewProdDesc('');
      setNewProdImage('');
      setProductImageName('');
    }
  };

  const handleDeleteProductFromSettings = async (productId: string) => {
    const { success } = await dbService.deleteProduct(productId, storeSlug);
    if (success) {
      const { data: updatedProducts } = await dbService.getProductsByStore(storeSlug);
      if (updatedProducts) setProducts(updatedProducts);
    }
  };

  const [categories, setCategories] = useState<string[]>(['TUDO', 'VESTIDO', 'VESTIDOS', 'ALFAIATARIA', 'SAIAS', 'MALHAS', 'CONJUNTOS']);

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      const { data, error } = await dbService.getProductsByStore(storeSlug);
      if (!error) {
        setProducts(data);
      }
      const catsOfStore = dbService.getCategories(storeSlug);
      setCategories(['TUDO', ...catsOfStore]);
      if (catsOfStore.length > 0) {
        setNewProdCategory(prev => catsOfStore.includes(prev) ? prev : catsOfStore[0]);
      }
      setIsLoading(false);
    };
    loadProducts();
  }, [storeSlug]);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    const colors = getColorDots(product.name);
    setSelectedColorHex(colors[0] || '#F5F5DC');
    setSelectedSize('P');
    setDetailQuantity(1);
    
    // Automatically reset vertical scroll of standard viewport page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addToCart = (product: Product, size?: string, colorName?: string, qty: number = 1) => {
    const finalSize = size || 'P';
    const finalColor = colorName || getColorName(getColorDots(product.name)[0]);

    setCart(prev => {
      const existing = prev.find(item => 
        item.product.id === product.id && 
        item.selectedSize === finalSize && 
        item.selectedColor === finalColor
      );
      if (existing) {
        return prev.map(item => 
          (item.product.id === product.id && item.selectedSize === finalSize && item.selectedColor === finalColor) 
            ? { ...item, quantity: item.quantity + qty } 
            : item
        );
      }
      return [...prev, { product, quantity: qty, selectedSize: finalSize, selectedColor: finalColor }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string, size?: string, color?: string) => {
    setCart(prev => prev.filter(item => 
      !(item.product.id === productId && item.selectedSize === size && item.selectedColor === color)
    ));
  };

  const updateQuantity = (productId: string, delta: number, size?: string, color?: string) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId && item.selectedSize === size && item.selectedColor === color) {
        const nextQty = item.quantity + delta;
        return nextQty > 0 ? { ...item, quantity: nextQty } : item;
      }
      return item;
    }));
  };

  // Compute checkout totals
  const getSubtotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const getTotal = () => {
    let sub = getSubtotal();
    if (isOrderBumpChecked) {
      sub += dynamicOrderBump.price;
    }
    return sub;
  };

  // Generate Portuguese message link for WhatsApp Direct Redirection
  const handleCheckoutWhatsApp = () => {
    if (cart.length === 0) return;

    let textMessage = `Olá! Gostaria de fazer uma encomenda no catálogo WhatsApp da *"Loja ${storeNameState}"* via *Grofy*:\n\n`;
    textMessage += `*PRODUTOS SELECIONADOS:*\n`;
    
    cart.forEach(item => {
      textMessage += `• *${item.product.name}*`;
      if (item.selectedSize || item.selectedColor) {
        textMessage += ` (`;
        const parts = [];
        if (item.selectedSize) parts.push(`Tam: ${item.selectedSize}`);
        if (item.selectedColor) parts.push(`Cor: ${item.selectedColor}`);
        textMessage += parts.join(', ');
        textMessage += `)`;
      }
      textMessage += ` — Qtd: ${item.quantity} — _${(item.product.price * item.quantity).toLocaleString('pt-MZ')} MT_\n`;
    });

    if (isOrderBumpChecked) {
      textMessage += `\n*✨ OFERTA EXCLUSIVA (ORDER BUMP ADICIONADO):*\n`;
      textMessage += `• *${dynamicOrderBump.name}* — _${dynamicOrderBump.price.toLocaleString('pt-MZ')} MT_\n`;
    }

    textMessage += `\n*TOTAL DO PEDIDO:* *${getTotal().toLocaleString('pt-MZ')} MT*\n\n`;
    textMessage += `Por favor, confirmem o estoque e me passem as coordenadas de entrega! Obrigado.`;

    // Sanitize phone and create wa.me/wa.me URI string
    const cleanedPhone = whatsappNumberState.replace(/[^\d+]/g, '');
    const encodedMessage = encodeURIComponent(textMessage);
    const whatsappUrl = `https://wa.me/${cleanedPhone}?text=${encodedMessage}`;

    // Redirect
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // Handles direct quick order redirection
  const handleBuyNowWhatsApp = (product: Product, size: string, color: string, qty: number) => {
    let textMessage = `Olá! Gostaria de comprar o seguinte item na lojista *"Loja ${storeNameState}"* via *Grofy*:\n\n`;
    textMessage += `• *${product.name}*\n`;
    textMessage += `  - *Tamanho:* ${size}\n`;
    textMessage += `  - *Cor:* ${color}\n`;
    textMessage += `  - *Quantidade:* ${qty}\n`;
    textMessage += `  - *Preço Unitário:* ${product.price.toLocaleString('pt-MZ')} MT\n`;
    textMessage += `  - *Valor Total:* ${(product.price * qty).toLocaleString('pt-MZ')} MT\n\n`;
    
    if (isOrderBumpChecked) {
       textMessage += `*✨ OFERTA EXCLUSIVA (ORDER BUMP ADICIONADO):*\n`;
       textMessage += `• *${dynamicOrderBump.name}* — _${dynamicOrderBump.price.toLocaleString('pt-MZ')} MT_\n`;
       textMessage += `\n*TOTAL CONSOLIDADO:* *${(product.price * qty + dynamicOrderBump.price).toLocaleString('pt-MZ')} MT*\n\n`;
    } else {
       textMessage += `*TOTAL CONSOLIDADO:* *${(product.price * qty).toLocaleString('pt-MZ')} MT*\n\n`;
    }
    
    textMessage += `Por favor, confirmem o estoque e me passem as informações para pagamento via M-Pesa. Obrigado!`;

    const cleanedPhone = whatsappNumberState.replace(/[^\d+]/g, '');
    const encodedMessage = encodeURIComponent(textMessage);
    const whatsappUrl = `https://wa.me/${cleanedPhone}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // Verify Admin credential to enter Lojista Panel
  const handleVerifyAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    const registeredPassword = userSession?.password || '';
    if (adminPassword === 'admin123' || (registeredPassword && adminPassword === registeredPassword)) {
      setIsAdminModalOpen(false);
      setAdminPassword('');
      setAdminError('');
      onNavigate('dashboard');
    } else {
      setAdminError('Senha incorreta! Use a senha cadastrada na conta ou a padrão admin123.');
    }
  };

  // Advanced search and category combinations
  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'Todos' || activeCategory === 'TUDO' || p.category.toUpperCase() === activeCategory.toUpperCase();
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-white min-h-screen text-zinc-900 font-sans selection:bg-black selection:text-white w-full flex flex-col items-center justify-start relative overflow-x-hidden">
      
      {/* Absolute luxury ambient background vectors */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-neutral-200/40 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-orange-100/10 blur-[100px] pointer-events-none animate-pulse duration-10000" />

      {/* Main fully-responsive Boutique frame - occupies full width of any viewport without empty gaps */}
      <div className="w-full overflow-x-hidden bg-white min-h-screen flex flex-col justify-between relative z-10 animate-fade-in">
        
        <div className="flex-1 flex flex-col justify-between relative bg-white pb-12">
          
          {selectedProduct ? (
            /* PRODUCT DETAIL SCREEN VIEW (Matches screenshot style exactly) */
            <div className="flex-grow flex flex-col justify-start">
              
              {/* Boutique Sticky Header */}
              <header className="sticky top-0 z-30 bg-white border-b border-stone-100 px-6 py-4.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setSelectedProduct(null)}
                    className="p-1.5 hover:bg-stone-50 rounded-full transition-colors text-stone-700 outline-none"
                    title="Voltar ao Catálogo"
                  >
                    <ArrowLeft className="w-5 h-5 text-stone-900 stroke-[2.2]" />
                  </button>
                  <h1 className="font-serif text-2xl xs:text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-950 leading-none ml-2 border-l border-stone-200 pl-3">
                    {storeNameState}
                  </h1>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#8C8276] font-sans hidden sm:inline mr-1">
                    {selectedProduct.category}
                  </span>
                  <button 
                    onClick={() => setIsSettingsDrawerOpen(true)}
                    className="p-2 hover:bg-stone-50 rounded-full transition-colors text-stone-705 focus:outline-none cursor-pointer"
                    title="Acesso Lojista (Painel Rápido)"
                  >
                    <Menu className="w-6 h-6 text-stone-900 stroke-[2.2]" />
                  </button>
                </div>
              </header>

              {/* Return breadcrumb button back to lobby */}
              <div className="bg-white border-b border-stone-105/40 py-3.5 px-6 flex items-center justify-between">
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="text-[10px] font-bold text-[#8C8276] hover:text-stone-900 tracking-wider uppercase flex items-center gap-1.5 focus:outline-none"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> VOLTAR AO ACERVO
                </button>
                <button 
                  onClick={() => onNavigate('home')}
                  className="text-[9px] font-mono tracking-widest font-extrabold text-[#8C8276] hover:text-stone-900 uppercase flex items-center gap-1"
                >
                  Home • <GrofyLogo className="text-stone-400" size={10} /> Grofy
                </button>
              </div>

              {/* Hero display photo inside catalog */}
              <div className="px-5 pt-4">
                <div className="aspect-[3/4.2] w-full bg-[#FAF8F5] rounded-3xl overflow-hidden border border-stone-150/40 shadow-xs relative">
                  <img 
                    src={selectedProduct.image_url} 
                    alt={selectedProduct.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Detailed information card layout details */}
              <div className="px-5 py-5 text-left space-y-4.5">
                <div>
                  <span className="text-[10px] tracking-[0.2em] font-extrabold text-[#8C8276] uppercase block font-sans">
                    {selectedProduct.category} · EDIÇÃO LIMITADA
                  </span>
                  <h2 className="font-serif text-[24px] font-normal leading-tight tracking-tight text-stone-900 mt-1">
                    {selectedProduct.name}
                  </h2>
                  <span className="font-sans text-[18px] font-bold text-stone-950 block mt-1.5 font-mono">
                    {selectedProduct.price.toLocaleString('pt-MZ')} MT
                  </span>
                </div>

                <p className="text-stone-500 text-xs leading-relaxed">
                  {selectedProduct.description || 'Confeccionado em tecido fluido com acabamento acetinado, o item traz a elegância minimalista de alta-costura. Corte midi versátil, ideal para o dia ou para uma ocasião especial.'}
                </p>

                {/* Color Selecting Row matching visual dot checks */}
                <div className="space-y-2 border-t border-stone-100 pt-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-stone-900">Cor</span>
                    <span className="text-xs text-[#8C8276] font-bold">{getColorName(selectedColorHex)}</span>
                  </div>
                  <div className="flex gap-2.5">
                    {getColorDots(selectedProduct.name).map((color, cIdx) => (
                      <button 
                        key={cIdx}
                        onClick={() => setSelectedColorHex(color)}
                        style={{ backgroundColor: color }}
                        className={`w-7 h-7 rounded-full border relative flex items-center justify-center transition-all ${
                          selectedColorHex === color 
                            ? 'scale-110 ring-2 ring-stone-950 ring-offset-2 border-transparent' 
                            : 'border-stone-200 hover:scale-105'
                        }`}
                      >
                        {selectedColorHex === color && (
                          <Check className={`w-3.5 h-3.5 ${
                            color === '#000000' || color === '#1F2937' || color === '#4B5563' || color === '#7F1D1D'
                              ? 'text-white' 
                              : 'text-stone-900'
                          }`} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size Selecting Buttons exactly matching layout grids */}
                <div className="space-y-2 border-t border-stone-100 pt-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-stone-900">Tamanho</span>
                    <span className="text-[10px] text-stone-400 font-extrabold hover:underline cursor-pointer uppercase tracking-wider">Guia de tamanhos</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {['PP', 'P', 'M', 'G', 'GG'].map((size) => (
                      <button 
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`py-2 text-xs font-bold transition-all border rounded-lg ${
                          selectedSize === size 
                            ? 'bg-[#090909] text-white border-black' 
                            : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity adjustment section */}
                <div className="space-y-2 border-t border-stone-100 pt-3.5 flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900">Quantidade</span>
                  <div className="flex items-center gap-3 bg-[#FAF8F5] border border-stone-200 rounded-lg py-1.5 px-3">
                    <button 
                      onClick={() => setDetailQuantity(x => Math.max(1, x - 1))}
                      className="text-stone-600 hover:text-black focus:outline-none font-bold"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-xs font-extrabold px-1 min-w-[16px] text-center select-none">{detailQuantity}</span>
                    <button 
                      onClick={() => setDetailQuantity(x => x + 1)}
                      className="text-stone-600 hover:text-black focus:outline-none font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* CTA Checkout design actions stack */}
                <div className="space-y-2.5 pt-4.5">
                  <button 
                    onClick={() => handleBuyNowWhatsApp(selectedProduct, selectedSize, getColorName(selectedColorHex), detailQuantity)}
                    className="w-full bg-[#090909] hover:bg-stone-850 text-white font-extrabold py-4 px-4 rounded-xl text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] active:scale-98 cursor-pointer"
                  >
                    ⚡ COMPRAR AGORA (WHATSAPP)
                  </button>
                  <button 
                    onClick={() => {
                      addToCart(selectedProduct, selectedSize, getColorName(selectedColorHex), detailQuantity);
                      // Visual scroll update trigger or subtle alert
                    }}
                    className="w-full bg-white hover:bg-[#FAF8F5] text-stone-900 border border-stone-300 font-extrabold py-4 px-4 rounded-xl text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 shadow-xs hover:scale-[1.01] active:scale-98 cursor-pointer"
                  >
                    👜 ADICIONAR À SACOLA
                  </button>
                  <p className="text-[10px] text-stone-400 text-center font-sans tracking-tight">
                    Pedido direcionado para o WhatsApp do Lojista: <strong className="font-mono">{whatsappNumberState}</strong>
                  </p>
                </div>
              </div>

              {/* OUTRAS VERSÕES DA COLEÇÃO */}
              <div className="border-t border-stone-100 pt-6 px-5 mt-4 text-left">
                <span className="text-[10px] tracking-[0.16em] uppercase font-bold text-[#8C8276] block mb-1">OUTRAS PEÇAS RECOMENDADAS</span>
                <div className="flex justify-between items-baseline mb-4">
                  <h3 className="font-serif text-base sm:text-lg font-normal tracking-tight text-stone-900">Composições Minimalistas</h3>
                  <button 
                    onClick={() => {
                      setSelectedProduct(null);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }} 
                    className="text-[10px] font-bold text-[#8C8276] tracking-wider uppercase hover:underline"
                  >
                    Ver Tudo
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pb-12">
                  {products
                    .filter(p => p.id !== selectedProduct.id)
                    .slice(0, 4)
                    .map((p) => (
                      <div 
                        key={p.id}
                        onClick={() => handleProductClick(p)}
                        className="cursor-pointer group text-left"
                      >
                        <div className="aspect-[3/4.2] rounded-2xl overflow-hidden border border-stone-100 bg-stone-50 shadow-3xs mb-2">
                          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" />
                        </div>
                        <span className="text-[9px] text-[#8C8276] font-bold tracking-widest uppercase block">{p.category}</span>
                        <h4 className="font-sans font-medium text-stone-900 text-xs tracking-tight truncate mt-0.5">{p.name}</h4>
                        <span className="font-sans font-extrabold text-[11px] text-stone-950 block mt-0.5 font-mono">
                          {p.price.toLocaleString('pt-MZ')} MT
                        </span>
                      </div>
                    ))}
                </div>
              </div>

            </div>
          ) : (
            /* MAIN STOREFRONT CATALOGUE VIEW (Screen 1 - 100% RESPONSIVE) */
            <div className="flex-grow flex flex-col justify-start">
              
              {/* Boutique Sticky Header */}
              <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-100 px-6 py-4.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onNavigate('home')}
                    className="p-1 hover:bg-stone-50 rounded-full transition-colors text-stone-700 outline-none"
                    title="Voltar"
                  >
                    <ArrowLeft className="w-5 h-5 text-stone-900" />
                  </button>
                  <h1 className="font-serif text-2xl xs:text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-950 leading-none ml-2 border-l border-stone-200 pl-3">
                    {storeNameState}
                  </h1>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsSettingsDrawerOpen(true)}
                    className="p-2 hover:bg-stone-50 rounded-full transition-colors text-stone-700 focus:outline-none cursor-pointer"
                    title="Configurações da Loja (Três Barras)"
                  >
                    <Menu className="w-6 h-6 text-stone-900 stroke-[2.2]" />
                  </button>
                </div>
              </header>

              {/* Dynamic luxury fashion banner */}
              {isBannerEnabled && (
                <div className="px-5 pt-4 pb-2 animate-fade-in">
                  <div className="relative rounded-[2rem] overflow-hidden min-h-[300px] flex flex-col justify-end p-6 border border-stone-150/40 shadow-sm">
                    {/* Selected Banner image layer */}
                    <img 
                      src={storeBannerUrlState} 
                      alt="Luxury Satin Texture Layer" 
                      className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                      style={{ filter: "brightness(0.82) contrast(1.05)" }}
                    />
                    {/* Premium Dark overlay gradient to guarantee accessibility & high contrast readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
                    
                    <div className="relative z-10 text-left text-white space-y-1">
                      <span className="text-[10px] tracking-[0.25em] font-extrabold text-white/90 uppercase block font-sans">
                        COLEÇÃO PREMIUM
                      </span>
                      <h2 className="font-serif text-[26px] sm:text-[28px] font-normal leading-none tracking-tight text-white max-w-[280px]">
                        {bannerTitleState}
                      </h2>
                      <p className="text-white/80 text-[11px] leading-relaxed max-w-[250px] pt-1">
                        {storeDescriptionState}
                      </p>
                      
                      <div className="pt-4">
                        <button 
                          onClick={() => {
                            const el = document.getElementById('catalog-explore-section');
                            el?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="bg-white hover:bg-stone-100 text-stone-950 font-extrabold text-[9px] uppercase tracking-widest px-6 py-3.5 rounded-full transition-all duration-300 shadow-md transform hover:scale-102"
                        >
                          EXPLORAR ACERVO
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Categories Section Anchor */}
              <div id="catalog-explore-section" className="px-5 pt-5 pb-1 text-left">
                <h3 className="text-[10px] tracking-[0.16em] uppercase font-bold text-[#8C8276] font-sans">
                  FILTRAR CATEGORIAS
                </h3>
              </div>

              {/* Categories Row list with horizontal scroll - taking full width */}
              <div className="px-5 py-2.5 flex gap-2 overflow-x-auto scrollbar-none sticky top-[64px] bg-white z-20 shadow-xs border-b border-stone-50">
                {categories.map((cat, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveCategory(cat)}
                    className={`py-2 px-4.5 rounded-full text-[11px] font-bold tracking-wider uppercase transition-all select-none whitespace-nowrap ${
                      activeCategory === cat 
                      ? 'bg-[#090909] text-white shadow-sm' 
                      : 'bg-[#FAF8F5] text-[#605A54] hover:bg-stone-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Full-width clean Search bar below category options */}
              <div className="px-5 py-3">
                <div className="relative w-full">
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Procurar produtos, cores, blazers..."
                    className="w-full bg-[#FAF8F5] border border-stone-200/90 rounded-full py-3.5 pl-11 pr-10 text-xs text-stone-900 placeholder-[#9C9389] focus:outline-none focus:ring-1 focus:ring-black focus:bg-white transition-all shadow-3xs"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9C9389]" />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')} 
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9C9389] hover:text-black font-bold text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Pieces Count tag */}
              <div className="px-5 pt-2 pb-2.5 flex justify-between items-center border-t border-stone-100/60 mt-2">
                <span className="text-[10px] font-extrabold tracking-widest text-[#8C8276] uppercase">
                  {filteredProducts.length} ITENS EXIBIDOS
                </span>
                <span className="text-[9px] text-stone-400 font-sans">Loja de Alta Fidelidade</span>
              </div>

              {/* Catalogue Grid precisely aligned to the luxury layout */}
              <div className="px-5 pb-24 pt-3 flex-1">
                {isLoading ? (
                  <div className="py-20 text-center">
                    <div className="w-8 h-8 border-3 border-stone-200 border-t-stone-950 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-xs font-semibold text-stone-400 font-mono text-center">Buscando produtos...</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="py-20 text-center">
                    <ShoppingBag className="w-12 h-12 text-stone-300 stroke-[1.1] mx-auto mb-3" />
                    <p className="text-xs font-bold text-stone-700">Nenhum produto nesta categoria</p>
                    <p className="text-[10px] text-stone-400 mt-1 max-w-xs mx-auto">Adicione novos itens no menu de edição das Três Barras no topo direito.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-7">
                    {filteredProducts.map((p) => (
                      <div 
                        key={p.id} 
                        onClick={() => handleProductClick(p)}
                        className="group flex flex-col justify-between hover:scale-[1.01] transition-transform duration-300 cursor-pointer pointer-events-auto"
                      >
                        {/* Portrait aspect image container like fashion catalogs */}
                        <div className="aspect-[3/4.2] bg-[#FAF8F5] relative overflow-hidden rounded-2xl border border-stone-100 shadow-3xs">
                          <img 
                            src={p.image_url} 
                            alt={p.name} 
                            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                          />
                          
                          {/* Upper Category label */}
                          <span className="absolute top-2.5 left-2.5 bg-white text-stone-900 border border-stone-100 font-sans tracking-widest text-[8px] font-bold px-2.5 py-1 rounded-sm uppercase shadow-2xs select-none">
                            {p.category}
                          </span>
                        </div>

                        {/* Body textual information */}
                        <div className="mt-2.5 flex flex-col justify-between flex-1 text-left">
                          <div>
                            <h4 className="font-sans font-semibold text-stone-900 text-[13px] tracking-tight line-clamp-1 group-hover:underline">
                              {p.name}
                            </h4>
                            <p className="text-[11px] text-[#8C8276] font-light leading-snug line-clamp-1 mt-0.5">
                              {p.description || 'Corte fluido com caimento impecável.'}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-1.5 border-t border-stone-50/80 pt-1.5">
                            {/* Price standard for Moçambique */}
                            <span className="font-sans text-[12px] font-bold text-stone-950">
                              {p.price.toLocaleString('pt-MZ') + ' MT'}
                            </span>
                            
                            {/* Fabric Color circles indicators underneath */}
                            <div className="flex gap-1.5">
                              {getColorDots(p.name).map((color, cIdx) => (
                                <span 
                                  key={cIdx} 
                                  style={{ backgroundColor: color }} 
                                  className="w-2.5 h-2.5 rounded-full border border-stone-200/50 shadow-3xs"
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Elegant design-focused footer */}
        <footer className="py-7 bg-stone-50 border-t border-stone-100 text-center px-4">
          <p className="text-[9px] text-stone-400 font-bold tracking-widest uppercase flex items-center justify-center gap-1.5">
            <GrofyLogo className="text-stone-400" size={12} />
            <span>Grofy Technology • Moçambique</span>
          </p>
          <p className="text-[8px] text-stone-400 mt-1 block">Checkout Direcionado para o WhatsApp {whatsappNumberState} • Loja de Luxo Ativa</p>
        </footer>

      </div>

        {/* INTERACTIVE FLOATING SHOPPING BAG ELEMENT */}
        {cart.length > 0 && (
          <button 
            onClick={() => setIsCartOpen(true)}
            className="absolute bottom-6 right-6 z-40 bg-black hover:bg-stone-900 text-white rounded-full p-4.5 shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border border-stone-850 flex items-center justify-center pointer-events-auto cursor-pointer"
            title="Sua Sacola"
          >
            <ShoppingBag className="w-5 h-5 text-white" />
            <span className="absolute -top-1.5 -right-1 bg-red-500 text-white font-mono font-extrabold text-[9px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-md">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          </button>
        )}

        {/* EXPANSIVE INTERACTIVE CART SLIDE SIDE SHEET DRAWER */}
        {isCartOpen && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-3xs z-50 flex justify-end">
            <div className="w-full max-w-sm bg-stone-50 h-full shadow-2xl flex flex-col justify-between py-6 px-5 fade-in-up rounded-l-3xl">
              
              {/* Drawer header */}
              <div>
                <div className="flex justify-between items-center border-b border-stone-200 pb-4 mb-5">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-black" />
                    <h3 className="font-extrabold text-stone-950 text-base">Sua sacola de compras</h3>
                  </div>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="p-1.5 text-stone-500 hover:text-black hover:bg-stone-100 rounded-full transition-colors focus:outline-none"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Listing of cart items */}
                {cart.length === 0 ? (
                  <div className="text-center py-20 px-4">
                    <ShoppingCart className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                    <p className="text-xs font-bold text-stone-700">Sua sacola está vazia</p>
                    <p className="text-[10px] text-stone-400 mt-1">Toque nos vestidos e alfaiataria do catálogo para aditivar a sacola!</p>
                  </div>
                ) : (
                  <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`} className="bg-white p-3 rounded-2xl border border-stone-150 shadow-3xs flex justify-between items-center gap-3">
                        <img src={item.product.image_url} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0 bg-stone-100" />
                        
                        <div className="flex-1 min-w-0 text-left">
                          <h4 className="font-bold text-stone-950 text-xs truncate">{item.product.name}</h4>
                          <span className="font-mono text-[10px] text-stone-900 block mt-0.5">
                            {(item.product.price * item.quantity).toLocaleString('pt-MZ') + ' MT'}
                          </span>
                          {(item.selectedSize || item.selectedColor) && (
                            <span className="text-[9px] text-[#8C8276] font-bold uppercase tracking-wider block mt-0.5">
                              {item.selectedSize} · {item.selectedColor}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-100 rounded-lg p-1">
                          <button 
                            onClick={() => updateQuantity(item.product.id, -1, item.selectedSize, item.selectedColor)}
                            className="p-1 hover:bg-stone-200 text-stone-600 rounded transition"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono text-xs font-bold px-1 select-none">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.product.id, 1, item.selectedSize, item.selectedColor)}
                            className="p-1 hover:bg-stone-200 text-stone-600 rounded transition"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button 
                          onClick={() => removeFromCart(item.product.id, item.selectedSize, item.selectedColor)}
                          className="text-stone-400 hover:text-red-500 text-xs p-1"
                          title="Remover"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order bump accessor suggest element */}
              {cart.length > 0 && (
                <div className="border-t border-stone-200 pt-5 space-y-4">
                  
                  {/* Suggest bump accessories */}
                  <div className="bg-gradient-to-tr from-indigo-50/50 to-purple-50/20 border border-indigo-150 p-4 rounded-2xl shadow-3xs">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-1.5 bg-indigo-100 text-indigo-700 font-extrabold uppercase py-0.5 px-2 rounded-full font-mono text-[8px] tracking-wider w-fit">
                        <Sparkles className="w-2.5 h-2.5" /> Oferta Bump Exclusiva
                      </div>
                      <span className="font-mono text-[11px] font-bold text-indigo-700 bg-white border border-indigo-100 px-1.5 py-0.5 rounded">
                        +{dynamicOrderBump.price.toLocaleString('pt-MZ')} MT
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-2.5">
                      <img src={dynamicOrderBump.image_url} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0 shadow bg-stone-200" />
                      <div>
                        <h4 className="font-extrabold text-stone-900 text-xs">{dynamicOrderBump.name}</h4>
                        <p className="text-[10px] text-stone-500 leading-normal line-clamp-1 mt-0.5">{dynamicOrderBump.description}</p>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl text-xs font-bold mt-3.5 cursor-pointer shadow-sm transition-all text-center justify-center">
                      <input 
                        type="checkbox" 
                        checked={isOrderBumpChecked}
                        onChange={(e) => setIsOrderBumpChecked(e.target.checked)}
                        className="rounded text-indigo-700 focus:ring-indigo-500 focus:border-indigo-500 w-4 h-4 text-white"
                      />
                      <span>{isOrderBumpChecked ? `✨ ${dynamicOrderBump.name} Adicionado!` : `Adicionar ${dynamicOrderBump.name} à Sacola`}</span>
                    </label>
                  </div>

                  {/* Pricing receipt items summary */}
                  <div className="space-y-2 text-xs font-medium text-stone-550">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-mono text-stone-900">{getSubtotal().toLocaleString('pt-MZ')} MT</span>
                    </div>
                    {isOrderBumpChecked && (
                      <div className="flex justify-between text-indigo-600">
                        <span>Oferta Bump</span>
                        <span className="font-mono">+{dynamicOrderBump.price.toLocaleString('pt-MZ')} MT</span>
                      </div>
                    )}
                    <div className="flex justify-between font-extrabold text-sm text-stone-950 pt-2 border-t border-dashed border-stone-200">
                      <span>Total Geral</span>
                      <span className="font-mono text-stone-950">{getTotal().toLocaleString('pt-MZ')} MT</span>
                    </div>
                  </div>

                  {/* Send as direct checkout through WhatsApp */}
                  <button 
                    id="whatsapp-finalize-btn"
                    onClick={handleCheckoutWhatsApp}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 px-4 rounded-xl text-xs transition-transform flex items-center justify-center gap-1.5 shadow-lg active:scale-95 duration-200"
                  >
                    <MessageSquare className="w-4 h-4 fill-white" /> Fechar Encomenda via WhatsApp
                  </button>

                  <p className="text-[9px] text-stone-400 text-center">Nosso checkout conversacional abre o WhatsApp pré-preenchido para fechar a compra em 1 clique.</p>
                </div>
              )}

            </div>
          </div>
        )}

        {/* BOUTIQUE OWNER LIVE CUSTOMIZER SETTINGS DRAWER */}
        {isSettingsDrawerOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-3xs flex justify-end">
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={() => setIsSettingsDrawerOpen(false)} />
            
            <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between py-6 px-6 z-10 animate-fade-in overflow-y-auto">
              <div>
                {/* Header of Drawer */}
                <div className="flex justify-between items-center border-b border-stone-200 pb-4 mb-5">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-stone-900" />
                    <div>
                      <h3 className="font-serif text-lg font-bold text-stone-950">Ajustes da Loja</h3>
                      <p className="text-[10px] text-[#8C8276] tracking-tight">Personalize e gerencie sua loja em tempo real</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsSettingsDrawerOpen(false)}
                    className="p-1.5 text-stone-500 hover:text-black hover:bg-stone-100 rounded-full transition-colors focus:outline-none cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Tab select buttons */}
                <div className="grid grid-cols-3 gap-2 bg-stone-100 p-1.5 rounded-xl mb-6">
                  <button 
                    onClick={() => setActiveSettingsTab('visual')}
                    className={`py-2 px-1 text-[11px] font-bold tracking-wider rounded-lg uppercase transition-all whitespace-nowrap cursor-pointer ${
                      activeSettingsTab === 'visual' 
                      ? 'bg-white text-stone-950 shadow-xs' 
                      : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    🎨 Visual
                  </button>
                  <button 
                    onClick={() => setActiveSettingsTab('add')}
                    className={`py-2 px-1 text-[11px] font-bold tracking-wider rounded-lg uppercase transition-all whitespace-nowrap cursor-pointer ${
                      activeSettingsTab === 'add' 
                      ? 'bg-white text-stone-950 shadow-xs' 
                      : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    ➕ Adicionar prod.
                  </button>
                  <button 
                    onClick={() => setActiveSettingsTab('remove')}
                    className={`py-2 px-1 text-[11px] font-bold tracking-wider rounded-lg uppercase transition-all whitespace-nowrap cursor-pointer ${
                      activeSettingsTab === 'remove' 
                      ? 'bg-white text-stone-950 shadow-xs' 
                      : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    ❌ Remover prod.
                  </button>
                </div>

                {/* Tab content 1: Visual Settings */}
                {activeSettingsTab === 'visual' && (
                  <div className="space-y-5 text-left pb-6">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-extrabold text-[#8C8276] mb-1.5">Nome da Loja</label>
                      <input 
                        type="text"
                        value={storeNameState}
                        onChange={(e) => {
                          setStoreNameState(e.target.value);
                          localStorage.setItem(`grofy_custom_name_${storeSlug}`, e.target.value);
                        }}
                        className="w-full bg-[#FAF8F5] border border-stone-200 rounded-xl py-3 px-4 text-xs font-medium text-stone-900 focus:outline-none focus:ring-1 focus:ring-black focus:bg-white transition-all shadow-3xs"
                        placeholder="Nome da sua loja de moda"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-extrabold text-[#8C8276] mb-1.5">Contacto WhatsApp (Moçambique)</label>
                      <input 
                        type="text"
                        value={whatsappNumberState}
                        onChange={(e) => {
                          setWhatsappNumberState(e.target.value);
                          localStorage.setItem(`grofy_custom_whatsapp_${storeSlug}`, e.target.value);
                        }}
                        className="w-full bg-[#FAF8F5] border border-stone-200 rounded-xl py-3 px-4 text-xs font-mono font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-black focus:bg-white transition-all shadow-3xs"
                        placeholder="ex: +258841234567"
                      />
                      <p className="text-[9px] text-stone-400 mt-1">Insira com o código do país para que os redirecionamentos de pedidos no WhatsApp funcionem 100%.</p>
                    </div>

                    <div className="border-t border-stone-100 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-[10px] uppercase tracking-wider font-extrabold text-[#8C8276]">Status do Banner Superior</label>
                        <button 
                          onClick={() => {
                            const val = !isBannerEnabled;
                            setIsBannerEnabled(val);
                            localStorage.setItem(`grofy_custom_banner_enabled_${storeSlug}`, String(val));
                          }}
                          className={`w-11 h-6 rounded-full p-0.5 transition-colors focus:outline-none ${
                            isBannerEnabled ? 'bg-emerald-500' : 'bg-stone-300'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                            isBannerEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>

                      {!isBannerEnabled ? (
                        <div className="bg-stone-50 border border-dashed border-stone-200 rounded-xl p-4 text-center space-y-2 mt-2 animate-fade-in">
                          <p className="text-[10px] font-medium text-stone-500">O banner superior está oculto. Seus produtos aparecem no topo.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setIsBannerEnabled(true);
                              localStorage.setItem(`grofy_custom_banner_enabled_${storeSlug}`, 'true');
                            }}
                            className="inline-flex bg-stone-900 hover:bg-stone-850 active:scale-98 text-white font-bold py-1.5 px-4 rounded-xl text-xs transition-colors cursor-pointer items-center justify-center gap-1.5 shadow-3xs"
                          >
                            ✨ Ativar & Configurar Banner
                          </button>
                        </div>
                      ) : null}

                      {isBannerEnabled && (
                        <div className="space-y-4 animate-fade-in bg-stone-50 p-4 rounded-xl border border-stone-200/60">
                          <div>
                            <label className="block text-[10px] uppercase tracking-wider font-extrabold text-[#8C8276] mb-1.5">Título em destaque no Banner</label>
                            <input 
                              type="text"
                              value={bannerTitleState}
                              onChange={(e) => {
                                setBannerTitleState(e.target.value);
                                localStorage.setItem(`grofy_custom_banner_title_${storeSlug}`, e.target.value);
                              }}
                              className="w-full bg-white border border-stone-200 rounded-lg py-2.5 px-3 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-black focus:bg-white transition-all shadow-3xs"
                              placeholder="Título Principal"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase tracking-wider font-extrabold text-[#8C8276] mb-1.5">Descrição Curta da Loja</label>
                            <textarea 
                              rows={2}
                              value={storeDescriptionState}
                              onChange={(e) => {
                                setStoreDescriptionState(e.target.value);
                                localStorage.setItem(`grofy_custom_desc_${storeSlug}`, e.target.value);
                              }}
                              className="w-full bg-white border border-stone-200 rounded-lg py-2.5 px-3 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-black focus:bg-white transition-all shadow-3xs resize-none"
                              placeholder="Diga aos clientes o que torna a sua loja única..."
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase tracking-wider font-extrabold text-[#8C8276] mb-1.5">Fazer Upload de Foto do Banner</label>
                            <div className="flex items-center gap-3">
                              <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-stone-300 hover:border-black rounded-lg py-4 cursor-pointer bg-white transition-colors relative">
                                <UploadCloud className="w-5 h-5 text-stone-400 mb-1" />
                                <span className="text-[10px] font-bold text-stone-700">Escolha um arquivo</span>
                                <input 
                                  type="file"
                                  accept="image/*"
                                  onChange={handleBannerUpload}
                                  className="hidden"
                                />
                                {bannerUploadProgress !== null && (
                                  <div className="absolute inset-0 bg-white/90 rounded-lg flex flex-col items-center justify-center px-4">
                                    <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                                      <div style={{ width: `${bannerUploadProgress}%` }} className="bg-black h-full" />
                                    </div>
                                    <span className="text-[9px] font-bold text-stone-700 mt-1 font-mono">{bannerUploadProgress}% Processando...</span>
                                  </div>
                                )}
                              </label>

                              {storeBannerUrlState && (
                                <div className="w-14 h-14 bg-stone-100 rounded-lg overflow-hidden border border-stone-200 shrink-0">
                                  <img src={storeBannerUrlState} alt="Cover preview" className="w-full h-full object-cover" />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quick Preset Covers to select instantly */}
                          <div>
                            <span className="block text-[8px] uppercase tracking-widest font-extrabold text-[#8C8276] mb-1.5">Presets Premium Curtidos</span>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { name: 'Cetim Marfim', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80' },
                                { name: 'Atelier Luxo', url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1200' },
                                { name: 'Seda Minimal', url: 'https://images.unsplash.com/photo-1502499140228-cb55b22dc47e?w=1200' }
                              ].map((preset) => (
                                <button 
                                  key={preset.name}
                                  type="button"
                                  onClick={() => {
                                    setStoreBannerUrlState(preset.url);
                                    localStorage.setItem(`grofy_custom_banner_url_${storeSlug}`, preset.url);
                                  }}
                                  className="border border-stone-200 rounded-lg overflow-hidden text-[9px] text-stone-600 bg-white hover:border-black focus:outline-none relative h-10 flex items-center justify-center p-1"
                                >
                                  <img src={preset.url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 hover:opacity-40" />
                                  <span className="relative font-bold truncate z-10">{preset.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Remove Banner Action Button */}
                          <div className="border-t border-stone-200/60 pt-3.5 mt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setIsBannerEnabled(false);
                                localStorage.setItem(`grofy_custom_banner_enabled_${storeSlug}`, 'false');
                              }}
                              className="w-full bg-red-50 hover:bg-red-100/90 active:scale-98 border border-red-100 text-red-650 font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                            >
                              <X className="w-3.5 h-3.5 stroke-[2.5]" />
                              Remover Banner
                            </button>
                            <p className="text-[9px] text-[#8C8276] text-center mt-1.5 italic font-sans">
                              Ao remover o banner, os produtos subirão instantaneamente no catálogo público.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab content 2: Add Product Form */}
                {activeSettingsTab === 'add' && (
                  <form onSubmit={handleAddProductFromSettings} className="space-y-4 text-left pb-6">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-extrabold text-[#8C8276] mb-1.5">Nome do produto</label>
                      <input 
                        type="text"
                        required
                        value={newProdName}
                        onChange={(e) => setNewProdName(e.target.value)}
                        placeholder="ex: Vestido Noir Plissado"
                        className="w-full bg-[#FAF8F5] border border-stone-200 rounded-xl py-2.5 px-3 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-black focus:bg-white transition-all shadow-3xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-extrabold text-[#8C8276] mb-1.5">Preço (MT)</label>
                        <input 
                          type="number"
                          required
                          value={newProdPrice}
                          onChange={(e) => setNewProdPrice(e.target.value ? Number(e.target.value) : '')}
                          placeholder="ex: 4500"
                          className="w-full bg-[#FAF8F5] border border-stone-200 rounded-xl py-2.5 px-3 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-black focus:bg-white transition-all shadow-3xs font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-extrabold text-[#8C8276] mb-1.5">Estoque</label>
                        <input 
                          type="number"
                          required
                          value={newProdStock}
                          onChange={(e) => setNewProdStock(e.target.value ? Number(e.target.value) : '')}
                          placeholder="ex: 15"
                          className="w-full bg-[#FAF8F5] border border-stone-200 rounded-xl py-2.5 px-3 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-black focus:bg-white transition-all shadow-3xs font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-extrabold text-[#8C8276] mb-1.5">Categoria</label>
                      <select 
                        value={newProdCategory}
                        onChange={(e) => setNewProdCategory(e.target.value)}
                        className="w-full bg-[#FAF8F5] border border-stone-200 rounded-xl py-2.5 px-3 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-black focus:bg-white transition-all shadow-3xs"
                      >
                        {categories.filter(c => c !== 'TUDO').map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-extrabold text-[#8C8276] mb-1.5">Descrição Fluida da Peça</label>
                      <textarea 
                        rows={2}
                        value={newProdDesc}
                        onChange={(e) => setNewProdDesc(e.target.value)}
                        className="w-full bg-[#FAF8F5] border border-stone-200 rounded-xl py-2 px-3 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-black focus:bg-white transition-all shadow-3xs resize-none"
                        placeholder="Corte fluído, costura italiana impecável, acabamento premium."
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-extrabold text-[#8C8276] mb-1.5">Foto do Produto</label>
                      <div className="flex items-center gap-3">
                        <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-stone-300 hover:border-black rounded-lg py-4 cursor-pointer bg-stone-50 transition-colors relative">
                          <UploadCloud className="w-5 h-5 text-stone-400 mb-1" />
                          <span className="text-[10px] font-bold text-stone-700">
                            {productImageName ? productImageName : 'Fazer Upload'}
                          </span>
                          <input 
                            type="file"
                            accept="image/*"
                            onChange={handleProductUpload}
                            className="hidden"
                          />
                          {productUploadProgress !== null && (
                            <div className="absolute inset-0 bg-white/90 rounded-lg flex flex-col items-center justify-center px-4">
                              <div className="w-full bg-stone-100 h-1 rounded-full overflow-hidden">
                                <div style={{ width: `${productUploadProgress}%` }} className="bg-black h-full" />
                              </div>
                            </div>
                          )}
                        </label>
                        {newProdImage && (
                          <div className="w-14 h-14 rounded-lg overflow-hidden border border-stone-200 shrink-0">
                            <img src={newProdImage} alt="Cover preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-black hover:bg-stone-900 text-white font-extrabold py-3 px-4 rounded-xl text-xs tracking-widest uppercase transition-all shadow-md flex items-center justify-center gap-2 mt-4 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-white" /> CADASTRAR PEÇA NO ACERVO
                    </button>
                  </form>
                )}

                {/* Tab content 3: Delete / Remove Product List */}
                {activeSettingsTab === 'remove' && (
                  <div className="space-y-3.5 text-left pb-6 max-h-[380px] overflow-y-auto pr-1">
                    <span className="block text-[10px] uppercase tracking-wider font-extrabold text-[#8C8276] mb-1.5">Selecione produtos para remover</span>
                    
                    {products.length === 0 ? (
                      <p className="text-stone-400 font-mono text-[10px] text-center py-8">Nenhum produto cadastrado.</p>
                    ) : (
                      products.map((p) => (
                        <div 
                          key={p.id}
                          className="flex items-center justify-between gap-3 bg-white border border-stone-150 p-3 rounded-2xl shadow-3xs"
                        >
                          <img src={p.image_url} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0 bg-stone-100" />
                          
                          <div className="flex-grow min-w-0 text-left">
                            <h4 className="font-bold text-stone-950 text-xs truncate">{p.name}</h4>
                            <span className="text-[9px] text-[#8C8276] tracking-widest uppercase font-extrabold block">
                              {p.category}
                            </span>
                            <span className="font-mono text-[10px] text-stone-900 block mt-0.5">
                              {p.price.toLocaleString('pt-MZ') + ' MT'}
                            </span>
                          </div>

                          <button 
                            onClick={() => {
                              if (confirm('Deseja realmente remover este produto em definitivo?')) {
                                handleDeleteProductFromSettings(p.id);
                              }
                            }}
                            className="bg-red-50 hover:bg-red-100/90 text-red-650 p-2.5 rounded-xl transition-all border border-red-100 hover:scale-102 focus:outline-none cursor-pointer"
                            title="Remover produto"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Drawer footer link back to merchant admin panel */}
              <div className="border-t border-stone-200 pt-4.5 text-center mt-3">
                <button 
                  onClick={() => {
                    setIsSettingsDrawerOpen(false);
                    onNavigate('dashboard');
                  }}
                  className="bg-[#090909] hover:bg-stone-850 text-white w-full py-3 px-4 rounded-xl text-[10px] tracking-widest uppercase transition-all font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Shield className="w-4 h-4 text-emerald-400 fill-emerald-400" /> ACESSAR PAINEL ANALÍTICO COMPLETO
                </button>
                <span className="text-[8px] text-stone-400 mt-2 block tracking-tight">Todas as alterações sincronizam na vitrine atual de Moçambique</span>
              </div>
            </div>
          </div>
        )}

        {/* MERCHANT GATEWAY GATE PASSWORD INPUT OVERLAY MODAL */}
        {isAdminModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-3xl max-w-sm w-full shadow-2xl border border-stone-100 relative fade-in-up">
              
              <button 
                onClick={() => {
                  setIsAdminModalOpen(false);
                  setAdminPassword('');
                  setAdminError('');
                }}
                className="absolute top-4 right-4 text-stone-400 hover:text-black hover:bg-stone-100 p-1 rounded-full transition-colors focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center mb-5">
                <div className="w-11 h-11 bg-stone-100 text-stone-900 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-5 h-5 text-stone-900" />
                </div>
                <h3 className="font-extrabold text-stone-900 text-base">Acesso de Lojista</h3>
                <p className="text-[11px] text-stone-500 mt-1">Insira a senha de administrador configurada para editar a vitrine e visualizar o painel.</p>
              </div>

              <form onSubmit={handleVerifyAdmin} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-extrabold text-stone-400 mb-1.5">Senha de Acesso</label>
                  <input 
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="ex: admin123"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 px-4 text-sm text-stone-900 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
                    autoFocus
                  />
                  {adminError && (
                    <p className="text-red-500 font-bold text-[10px] mt-2 block animate-pulse">
                      {adminError}
                    </p>
                  )}
                  <p className="text-[9px] text-stone-400 mt-2">Dica: Use a senha cadastrada na conta ou a padrão <strong className="font-mono text-stone-600">admin123</strong>.</p>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-black hover:bg-stone-900 text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 uppercase tracking-wider shadow"
                >
                  <Check className="w-4 h-4" /> Validar Acesso
                </button>
              </form>

            </div>
          </div>
        )}

    </div>
  );
}
