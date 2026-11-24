export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export interface Product {
  id: number;
  name: string;
  category: string;
  subCat: string;
  price: number;
  oldPrice?: number;
  rating: number;
  tag?: 'New' | 'Bestseller' | 'Sale' | 'Limited' | '';
  featured: boolean;
  inStock: boolean;
  images: string[];
  coverImage?: string;
  desc: string;
  buyLink?: string;
}

export interface Category {
  name: string;
  img: string;
  subCats: string[];
}

export interface HeroSlide {
  id: number;
  img: string;
  kicker: string;
  title: string;
  desc: string;
  btn: string;
  targetCategory: string;
}

export interface CartItem {
  id: number;
  qty: number;
}

export interface OrderItem {
  productId: number;
  name: string;
  qty: number;
  price: number;
  image?: string;
}

export interface Order {
  id: string;
  date: string;
  customerEmail?: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  notes?: string;
  paymentMethod: 'Cash on Delivery' | 'WhatsApp Order';
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  source: 'Direct Buy Now' | 'Cart Checkout';
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  pass: string;
  address?: string;
  city?: string;
  wishlist: number[];
  joinedAt: string;
}

export interface StoreSettings {
  brandName: string;
  brandIcon: string;
  brandIconUrl: string;
  primary: string;
  accent: string;
  font: string;
  headFont: string;
  announcement: string;
  whatsapp: string;
  currency: string;
  freeDeliveryThreshold: number;
  deliveryFee: number;
  adminUser: string;
  adminPass: string;
}

export interface StoreState {
  products: Product[];
  categories: Category[];
  heroSlides: HeroSlide[];
  cart: CartItem[];
  guestWishlist: number[];
  orders: Order[];
  customers: Customer[];
  currentCustomerEmail: string | null;
  settings: StoreSettings;
}

export interface TrafficData {
  total: number;
  daily: Record<string, number>;
}
