export interface Store {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  whatsappNumber: string;
  ownerEmail: string;
  subscriptionPlan?: string;
  subscriptionStatus?: 'trial' | 'active' | 'expired';
  subscriptionExpiresAt?: string;
  created_at?: string;
}

export interface Product {
  id: string;
  store_id: string;
  name: string;
  description: string;
  price: number; // In Meticais (MZN)
  stock: number;
  image_url: string;
  category: string;
  created_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface OrderBumpItem {
  id: string;
  name: string;
  price: number;
  image_url: string;
  description: string;
}

export interface UserSession {
  email: string;
  storeSlug: string;
  storeName: string;
  whatsappNumber: string;
  selectedPlan: string;
  password?: string; // Stored user password to lock/unlock merchant dashboard
}
