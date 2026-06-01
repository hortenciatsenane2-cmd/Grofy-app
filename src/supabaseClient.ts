import { createClient } from '@supabase/supabase-js';
import { Store, Product } from './types';

const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL || 'https://iaoruzpqqvuxblahdlle.supabase.co';
const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_HuhshzJEy9os7Iyvv87LUg_Wib94Arf';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper to determine if we need fallback storage (e.g., if tables don't exist yet)
let useLocalStorageFallback = false;

export const setFallbackMode = (val: boolean) => {
  useLocalStorageFallback = val;
};

export const getFallbackMode = () => useLocalStorageFallback;

// SQL script provided to user in the dashboard to set up their Supabase database in 1 click
export const DB_SQL_SCHEMA = `-- Copie e cole este script no Editor SQL (SQL Editor) do seu painel Supabase

-- 1. Tabela de Lojas
CREATE TABLE IF NOT EXISTS grofy_stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  whatsapp_number TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  subscription_plan TEXT DEFAULT '3 Dias Grátis',
  subscription_status TEXT DEFAULT 'trial',
  subscription_expires_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now() + interval '3 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Produtos
CREATE TABLE IF NOT EXISTS grofy_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id TEXT NOT NULL, -- pode ser slug ou UUID
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  image_url TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Row Level Security) - Permissões Públicas para leitura / Escritura simples para este SaaS
ALTER TABLE grofy_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE grofy_products ENABLE ROW LEVEL SECURITY;

-- Exemplo de políticas permissivas para a demonstração do SaaS
CREATE POLICY "Leitura pública de lojas" ON grofy_stores FOR SELECT USING (true);
CREATE POLICY "Inserção pública de lojas" ON grofy_stores FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização pública de lojas" ON grofy_stores FOR UPDATE USING (true);
CREATE POLICY "Leitura pública de produtos" ON grofy_products FOR SELECT USING (true);
CREATE POLICY "Inserção pública de produtos" ON grofy_products FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização pública de produtos" ON grofy_products FOR UPDATE USING (true);
CREATE POLICY "Deleção pública de produtos" ON grofy_products FOR DELETE USING (true);
`;

// Helper storage function
const getLocalData = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(`grofy_${key}`);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalData = <T>(key: string, data: T[]) => {
  try {
    localStorage.setItem(`grofy_${key}`, JSON.stringify(data));
  } catch (e) {
    console.error('Error writing to localStorage', e);
  }
};

// Initial local seeds so the app has dummy products out-of-the-box
const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    store_id: 'outono',
    name: 'Vestido branco',
    description: 'Vestido midi minimalista com detalhe trançado de costas abertas em acabamento premium.',
    price: 350,
    stock: 12,
    image_url: 'https://images.unsplash.com/photo-1621431759453-3d9691456041?w=600&auto=format&fit=crop&q=80',
    category: 'VESTIDO'
  },
  {
    id: 'prod-2',
    store_id: 'outono',
    name: 'Vestido Sereno Midi',
    description: 'Corte midi fluido em acabamento acetinado com alças finas reguláveis.',
    price: 250,
    stock: 8,
    image_url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&auto=format&fit=crop&q=80',
    category: 'VESTIDOS'
  },
  {
    id: 'prod-3',
    store_id: 'outono',
    name: 'Vestido Noir Longo',
    description: 'Longo fluido em chiffon noir para noites elegantes com fenda sutil lateral.',
    price: 5200,
    stock: 5,
    image_url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&auto=format&fit=crop&q=80',
    category: 'VESTIDOS'
  },
  {
    id: 'prod-4',
    store_id: 'outono',
    name: 'Blazer Atelier',
    description: 'Blazer estruturado em lã leve, corte atemporal e lapelas clássicas elegantes.',
    price: 4490,
    stock: 15,
    image_url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80',
    category: 'ALFAIATARIA'
  },
  {
    id: 'prod-5',
    store_id: 'outono',
    name: 'Saia Brisa Midi',
    description: 'Saia midi em seda fluida, tom verde sálvia sofisticado.',
    price: 2890,
    stock: 9,
    image_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80',
    category: 'SAIAS'
  },
  {
    id: 'prod-6',
    store_id: 'outono',
    name: 'Tricot Terracota',
    description: 'Camisola em caxemira macia, tom terracota aconchegante para a estação fria.',
    price: 3290,
    stock: 14,
    image_url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&auto=format&fit=crop&q=80',
    category: 'MALHAS'
  }
];

const INITIAL_STORES: Store[] = [
  {
    id: 'store-demo',
    name: 'Coleção Outono/Inverno',
    slug: 'outono',
    whatsappNumber: '+258841234567',
    ownerEmail: 'demo@grofy.co.mz'
  }
];

export const dbService = {
  // --- STORE METHODS ---
  async getStoreBySlug(slug: string): Promise<{ data: Store | null; error: any }> {
    if (useLocalStorageFallback) {
      const stores = getLocalData<Store>('stores');
      const store = stores.find(s => s.slug === slug) || INITIAL_STORES.find(s => s.slug === slug);
      return { data: store || null, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('grofy_stores')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) {
        // If table doesn't exist (code 42P01) or other connection issues, auto fallback
        if (error.code === '42P01') {
          useLocalStorageFallback = true;
          return this.getStoreBySlug(slug);
        }
        return { data: null, error };
      }
      return { data: data as Store | null, error: null };
    } catch (e: any) {
      useLocalStorageFallback = true;
      return this.getStoreBySlug(slug);
    }
  },

  async getStoreByEmail(email: string): Promise<{ data: Store | null; error: any }> {
    if (useLocalStorageFallback) {
      const stores = getLocalData<Store>('stores');
      const store = stores.find(s => s.ownerEmail.toLowerCase() === email.toLowerCase()) || INITIAL_STORES.find(s => s.ownerEmail.toLowerCase() === email.toLowerCase());
      return { data: store || null, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('grofy_stores')
        .select('*')
        .eq('owner_email', email)
        .maybeSingle();

      if (error) {
        if (error.code === '42P01') {
          useLocalStorageFallback = true;
          return this.getStoreByEmail(email);
        }
        return { data: null, error };
      }
      return { data: data as Store | null, error: null };
    } catch (e: any) {
      useLocalStorageFallback = true;
      return this.getStoreByEmail(email);
    }
  },

  async createStore(store: Omit<Store, 'id'>): Promise<{ data: Store | null; error: any }> {
    const newStore: Store = {
      ...store,
      id: Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString()
    };

    if (useLocalStorageFallback) {
      const stores = getLocalData<Store>('stores');
      stores.push(newStore);
      saveLocalData('stores', stores);
      return { data: newStore, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('grofy_stores')
        .insert([{
          name: store.name,
          slug: store.slug,
          whatsapp_number: store.whatsappNumber,
          owner_email: store.ownerEmail
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '42P01') {
          useLocalStorageFallback = true;
          return this.createStore(store);
        }
        return { data: null, error };
      }
      return { data: data as Store, error: null };
    } catch (e) {
      useLocalStorageFallback = true;
      return this.createStore(store);
    }
  },

  async updateStoreSubscription(slug: string, plan: string, status: 'trial' | 'active' | 'expired', expiresAt: string): Promise<{ success: boolean; error: any }> {
    if (useLocalStorageFallback) {
      const stores = getLocalData<Store>('stores');
      const idx = stores.findIndex(s => s.slug === slug);
      if (idx > -1) {
        stores[idx].subscriptionPlan = plan;
        stores[idx].subscriptionStatus = status;
        stores[idx].subscriptionExpiresAt = expiresAt;
        saveLocalData('stores', stores);
      } else {
        // Also seed active session if not fully listed
        const newSeed: Store = {
          id: Math.random().toString(36).substring(2, 9),
          name: 'Coleção Outono/Inverno',
          slug: slug,
          ownerEmail: 'marlon@grofy.co.mz',
          whatsappNumber: '+258841234567',
          subscriptionPlan: plan,
          subscriptionStatus: status,
          subscriptionExpiresAt: expiresAt
        };
        stores.push(newSeed);
        saveLocalData('stores', stores);
      }
      return { success: true, error: null };
    }

    try {
      const { error } = await supabase
        .from('grofy_stores')
        .update({
          subscription_plan: plan,
          subscription_status: status,
          subscription_expires_at: expiresAt
        })
        .eq('slug', slug);

      if (error) {
        if (error.code === '42P01') {
          useLocalStorageFallback = true;
          return this.updateStoreSubscription(slug, plan, status, expiresAt);
        }
        return { success: false, error };
      }
      return { success: true, error: null };
    } catch (e: any) {
      useLocalStorageFallback = true;
      return this.updateStoreSubscription(slug, plan, status, expiresAt);
    }
  },

  // --- PRODUCT METHODS ---
  async getProductsByStore(storeSlug: string): Promise<{ data: Product[]; error: any }> {
    if (useLocalStorageFallback) {
      const pList = getLocalData<Product>('products');
      const mergedList = [...INITIAL_PRODUCTS, ...pList];
      const filtered = mergedList.filter(p => p.store_id === storeSlug);
      return { data: filtered, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('grofy_products')
        .select('*')
        .eq('store_id', storeSlug);

      if (error) {
        if (error.code === '42P01') {
          useLocalStorageFallback = true;
          return this.getProductsByStore(storeSlug);
        }
        return { data: [], error };
      }
      return { data: data as Product[], error: null };
    } catch (e) {
      useLocalStorageFallback = true;
      return this.getProductsByStore(storeSlug);
    }
  },

  async addProduct(product: Omit<Product, 'id'>): Promise<{ data: Product | null; error: any }> {
    const newProd: Product = {
      ...product,
      id: Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString()
    };

    if (useLocalStorageFallback) {
      const pList = getLocalData<Product>('products');
      pList.unshift(newProd); // Add to the beginning
      saveLocalData('products', pList);
      return { data: newProd, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('grofy_products')
        .insert([{
          store_id: product.store_id,
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          image_url: product.image_url,
          category: product.category
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '42P01') {
          useLocalStorageFallback = true;
          return this.addProduct(product);
        }
        return { data: null, error };
      }
      return { data: data as Product, error: null };
    } catch (e) {
      useLocalStorageFallback = true;
      return this.addProduct(product);
    }
  },

  async deleteProduct(productId: string, storeSlug: string): Promise<{ success: boolean; error: any }> {
    if (useLocalStorageFallback) {
      const pList = getLocalData<Product>('products');
      // Check if it's one of the initial products
      const filtered = pList.filter(p => p.id !== productId);
      saveLocalData('products', filtered);
      
      // Also filter from initial if requested (to keep user session clean)
      const indexInInit = INITIAL_PRODUCTS.findIndex(p => p.id === productId);
      if (indexInInit > -1) {
        INITIAL_PRODUCTS.splice(indexInInit, 1);
      }
      return { success: true, error: null };
    }

    try {
      const { error } = await supabase
        .from('grofy_products')
        .delete()
        .eq('id', productId);

      if (error) {
        if (error.code === '42P01') {
          useLocalStorageFallback = true;
          return this.deleteProduct(productId, storeSlug);
        }
        return { success: false, error };
      }
      return { success: true, error: null };
    } catch (e) {
      useLocalStorageFallback = true;
      return this.deleteProduct(productId, storeSlug);
    }
  },

  // --- CATEGORIES METHODS (PER STORE) ---
  getCategories(storeSlug: string): string[] {
    const defaultCategories = ['VESTIDO', 'VESTIDOS', 'ALFAIATARIA', 'SAIAS', 'MALHAS', 'CONJUNTOS'];
    try {
      const stored = localStorage.getItem(`grofy_categories_${storeSlug}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Error reading categories:", e);
    }
    return defaultCategories;
  },

  saveCategories(storeSlug: string, categories: string[]): void {
    try {
      localStorage.setItem(`grofy_categories_${storeSlug}`, JSON.stringify(categories));
    } catch (e) {
      console.error("Error saving categories:", e);
    }
  }
};
