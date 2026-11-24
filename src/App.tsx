/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Download,
  Heart,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  Zap,
} from 'lucide-react';
import { AccountModal, AccountTab } from './components/AccountModal';
import { AdminPanel } from './components/AdminPanel';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal, CheckoutTarget } from './components/CheckoutModal';
import { HeroSlider } from './components/HeroSlider';
import { Navbar } from './components/Navbar';
import { ProductModal } from './components/ProductModal';
import { DEFAULT_STATE } from './data/seedData';
import { Customer, Order, Product, StoreState, TrafficData } from './types/store';
import { buildSingleFileHtml, preparePortableState } from './utils/singleFileHtmlGenerator';

const STORAGE_KEY = 'cozycaryy_store_v2';
const TRAFFIC_KEY = 'storeTraffic';

function loadInitialState(): StoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<StoreState>;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) },
      products:
        parsed.products && parsed.products.length > 0
          ? parsed.products
          : DEFAULT_STATE.products,
      categories:
        parsed.categories && parsed.categories.length > 0
          ? parsed.categories
          : DEFAULT_STATE.categories,
      heroSlides:
        parsed.heroSlides && parsed.heroSlides.length > 0
          ? parsed.heroSlides
          : DEFAULT_STATE.heroSlides,
      cart: parsed.cart || [],
      guestWishlist: parsed.guestWishlist || [],
      orders: parsed.orders || [],
      customers: parsed.customers || [],
      currentCustomerEmail: parsed.currentCustomerEmail ?? null,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function recordVisit(): TrafficData {
  try {
    const raw = localStorage.getItem(TRAFFIC_KEY);
    const current: TrafficData = raw ? JSON.parse(raw) : { total: 0, daily: {} };
    const today = new Date().toISOString().slice(0, 10);
    const updated: TrafficData = {
      total: (current.total || 0) + 1,
      daily: {
        ...(current.daily || {}),
        [today]: ((current.daily || {})[today] || 0) + 1,
      },
    };
    localStorage.setItem(TRAFFIC_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return { total: 1, daily: {} };
  }
}

export default function App() {
  const [state, setState] = useState<StoreState>(loadInitialState);
  const [traffic, setTraffic] = useState<TrafficData>({ total: 1, daily: {} });

  // Catalog Filters
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeSubCategory, setActiveSubCategory] = useState<string>('All');
  const [activeTag, setActiveTag] = useState<string>('All');
  const [featuredOnly, setFeaturedOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'featured' | 'low-high' | 'high-low'>('featured');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Overlays & Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const [checkoutTarget, setCheckoutTarget] = useState<CheckoutTarget | null>(null);
  const [accountOpen, setAccountOpen] = useState<boolean>(false);
  const [accountInitialTab, setAccountInitialTab] = useState<AccountTab>('profile');
  const [adminOpen, setAdminOpen] = useState<boolean>(false);

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const notify = (msg: string) => {
    setToastMsg(msg);
  };

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 2600);
    return () => clearTimeout(t);
  }, [toastMsg]);

  useEffect(() => {
    setTraffic(recordVisit());
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota overflow if huge base64 images are added
    }
  }, [state]);

  // Apply live CSS variables from Branding settings
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', state.settings.primary);
    root.style.setProperty('--accent', state.settings.accent);
    root.style.setProperty('--font-body', state.settings.font);
    root.style.setProperty('--font-head', state.settings.headFont);
    document.title = `${state.settings.brandName} — Curated Everyday Storefront`;
  }, [state.settings]);

  const currentCustomer = useMemo(
    () =>
      state.customers.find(
        (c) => c.email.toLowerCase() === (state.currentCustomerEmail || '').toLowerCase()
      ) || null,
    [state.customers, state.currentCustomerEmail]
  );

  const activeWishlist = useMemo(
    () => (currentCustomer ? currentCustomer.wishlist || [] : state.guestWishlist || []),
    [currentCustomer, state.guestWishlist]
  );

  const cartItemsDetailed = useMemo(() => {
    return state.cart
      .map((item) => {
        const product = state.products.find((p) => p.id === item.id);
        return product ? { product, qty: item.qty } : null;
      })
      .filter((x): x is { product: Product; qty: number } => x !== null);
  }, [state.cart, state.products]);

  const cartCount = useMemo(
    () => state.cart.reduce((sum, i) => sum + i.qty, 0),
    [state.cart]
  );

  const filteredProducts = useMemo(() => {
    let list = [...state.products];

    if (activeCategory !== 'All') {
      list = list.filter((p) => p.category === activeCategory);
    }
    if (activeSubCategory !== 'All') {
      list = list.filter((p) => p.subCat === activeSubCategory);
    }
    if (activeTag !== 'All') {
      list = list.filter((p) => p.tag === activeTag);
    }
    if (featuredOnly) {
      list = list.filter((p) => p.featured);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.subCat || '').toLowerCase().includes(q) ||
          (p.desc || '').toLowerCase().includes(q)
      );
    }

    if (sortBy === 'low-high') list.sort((a, b) => a.price - b.price);
    else if (sortBy === 'high-low') list.sort((a, b) => b.price - a.price);
    else list.sort((a, b) => Number(b.featured) - Number(a.featured));

    return list;
  }, [
    state.products,
    activeCategory,
    activeSubCategory,
    activeTag,
    featuredOnly,
    searchQuery,
    sortBy,
  ]);

  const activeCategoryObj = useMemo(
    () => state.categories.find((c) => c.name === activeCategory),
    [state.categories, activeCategory]
  );

  const handleSelectCategory = (cat: string, sub = 'All') => {
    setActiveCategory(cat);
    setActiveSubCategory(sub);
    setSearchQuery('');
    const el = document.getElementById('shopSection');
    if (el && (cat !== 'All' || sub !== 'All')) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAddToCart = (id: number, qty = 1) => {
    setState((prev) => {
      const existing = prev.cart.find((i) => i.id === id);
      const nextCart = existing
        ? prev.cart.map((i) => (i.id === id ? { ...i, qty: i.qty + qty } : i))
        : [...prev.cart, { id, qty }];
      return { ...prev, cart: nextCart };
    });
    notify('Added to shopping cart');
  };

  const handleUpdateCartQty = (id: number, delta: number) => {
    setState((prev) => ({
      ...prev,
      cart: prev.cart
        .map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0),
    }));
  };

  const handleRemoveFromCart = (id: number) => {
    setState((prev) => ({
      ...prev,
      cart: prev.cart.filter((i) => i.id !== id),
    }));
  };

  const handleToggleWishlist = (productId: number) => {
    const isSaved = activeWishlist.includes(productId);
    setState((prev) => {
      if (prev.currentCustomerEmail) {
        return {
          ...prev,
          customers: prev.customers.map((c) =>
            c.email.toLowerCase() === prev.currentCustomerEmail!.toLowerCase()
              ? {
                  ...c,
                  wishlist: isSaved
                    ? (c.wishlist || []).filter((id) => id !== productId)
                    : [...(c.wishlist || []), productId],
                }
              : c
          ),
        };
      }
      return {
        ...prev,
        guestWishlist: isSaved
          ? prev.guestWishlist.filter((id) => id !== productId)
          : [...prev.guestWishlist, productId],
      };
    });
    notify(isSaved ? 'Removed from wishlist' : 'Saved to wishlist');
  };

  const handleBuyNow = (product: Product, qty = 1) => {
    setCheckoutTarget({ mode: 'buyNow', buyNowProduct: product, buyNowQty: qty });
  };

  const handlePlaceOrder = (order: Order, clearCart: boolean) => {
    setState((prev) => ({
      ...prev,
      orders: [order, ...prev.orders],
      cart: clearCart ? [] : prev.cart,
    }));
    notify(`Order ${order.id} placed!`);
  };

  const handleCustomerLogin = (email: string, pass: string): boolean => {
    const found = state.customers.find(
      (c) => c.email.toLowerCase() === email.trim().toLowerCase() && c.pass === pass
    );
    if (!found) {
      notify('Invalid email or password');
      return false;
    }
    setState((prev) => {
      const mergedWish = Array.from(
        new Set([...(found.wishlist || []), ...(prev.guestWishlist || [])])
      );
      return {
        ...prev,
        currentCustomerEmail: found.email,
        guestWishlist: [],
        customers: prev.customers.map((c) =>
          c.email === found.email ? { ...c, wishlist: mergedWish } : c
        ),
      };
    });
    notify(`Welcome back, ${found.name}`);
    return true;
  };

  const handleCustomerRegister = (data: {
    name: string;
    email: string;
    phone: string;
    pass: string;
    city: string;
    address: string;
  }): boolean => {
    const exists = state.customers.some(
      (c) => c.email.toLowerCase() === data.email.trim().toLowerCase()
    );
    if (exists) {
      notify('An account with this email already exists');
      return false;
    }
    const newCust: Customer = {
      id: 'CUST-' + Date.now(),
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      pass: data.pass,
      city: data.city.trim(),
      address: data.address.trim(),
      wishlist: [...state.guestWishlist],
      joinedAt: new Date().toLocaleDateString(),
    };
    setState((prev) => ({
      ...prev,
      customers: [...prev.customers, newCust],
      currentCustomerEmail: newCust.email,
      guestWishlist: [],
    }));
    notify('Account created — welcome to your dashboard!');
    return true;
  };

  const handleUpdateProfile = (updates: Partial<Customer>) => {
    if (!currentCustomer) return;
    setState((prev) => ({
      ...prev,
      customers: prev.customers.map((c) =>
        c.email === currentCustomer.email ? { ...c, ...updates } : c
      ),
    }));
    notify('Profile saved');
  };

  const handleChangePassword = (currPass: string, newPass: string): boolean => {
    if (!currentCustomer || currentCustomer.pass !== currPass) {
      return false;
    }
    setState((prev) => ({
      ...prev,
      customers: prev.customers.map((c) =>
        c.email === currentCustomer.email ? { ...c, pass: newPass } : c
      ),
    }));
    notify('Password changed');
    return true;
  };

  const handleQuickDownloadHtml = async () => {
    const portable = await preparePortableState(state);
    const html = buildSingleFileHtml(portable);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(state.settings.brandName || 'cozycaryy')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')}-single-file.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    notify('Single .HTML file downloaded');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation with Hover Subcategories */}
      <Navbar
        settings={state.settings}
        categories={state.categories}
        activeCategory={activeCategory}
        activeSubCategory={activeSubCategory}
        searchQuery={searchQuery}
        cartCount={cartCount}
        wishlistCount={activeWishlist.length}
        currentCustomer={currentCustomer}
        onSelectCategory={handleSelectCategory}
        onSearchChange={setSearchQuery}
        onOpenAccount={() => {
          setAccountInitialTab('profile');
          setAccountOpen(true);
        }}
        onOpenWishlist={() => {
          setAccountInitialTab('wishlist');
          setAccountOpen(true);
        }}
        onOpenCart={() => setCartOpen(true)}
      />

      {/* 3-Slide Animated Hero */}
      <HeroSlider
        slides={state.heroSlides}
        onAction={(targetCat) => handleSelectCategory(targetCat, 'All')}
      />

      {/* Curated Category Strip + Product Catalog */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-14">
        {/* Category Quick Strip */}
        <section aria-label="Shop by category">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-900">
                Shop by Category
              </h2>
              <p className="text-sm text-stone-500 mt-1">
                Hover categories in the navigation bar for sub-category shortcuts
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {state.categories.map((cat) => {
              const selected = activeCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => handleSelectCategory(cat.name, 'All')}
                  className={`group flex items-center gap-3.5 p-3.5 rounded-xl border text-left transition-all duration-200 hover:-translate-y-0.5 ${
                    selected
                      ? 'bg-stone-900 text-white border-stone-900 shadow-md'
                      : 'bg-white text-stone-900 border-stone-200 hover:shadow-sm'
                  }`}
                >
                  <img
                    src={cat.img}
                    alt={cat.name}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-lg object-cover bg-stone-100 shrink-0 transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base truncate">
                      {cat.name}
                    </h3>
                    <p
                      className={`text-xs truncate mt-0.5 ${
                        selected ? 'text-stone-300' : 'text-stone-500'
                      }`}
                    >
                      {cat.subCats.length > 0
                        ? cat.subCats.slice(0, 2).join(' · ')
                        : 'Browse collection'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Product Collection */}
        <section id="shopSection" aria-label="Product collection" className="scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-900">
                {activeCategory === 'All'
                  ? 'Our Collection'
                  : activeSubCategory !== 'All'
                  ? `${activeCategory} — ${activeSubCategory}`
                  : activeCategory}
              </h2>
              <p className="text-sm text-stone-500 mt-1 tabular-nums">
                Showing {filteredProducts.length} product
                {filteredProducts.length === 1 ? '' : 's'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as 'featured' | 'low-high' | 'high-low')
                }
                aria-label="Sort products"
                className="px-3.5 py-2 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-800 focus:outline-none focus:border-stone-900"
              >
                <option value="featured">Featured First</option>
                <option value="low-high">Price: Low to High</option>
                <option value="high-low">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Interactive Filter Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
            <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-stone-100 rounded-lg">
              {(['All', 'New', 'Bestseller'] as const).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTag(tag)}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    activeTag === tag
                      ? 'bg-white text-stone-950 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-950'
                  }`}
                >
                  {tag === 'All' ? 'All Products' : tag}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setFeaturedOnly((v) => !v)}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  featuredOnly
                    ? 'bg-white text-stone-950 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-950'
                }`}
              >
                Featured Only
              </button>
            </div>

            {activeCategory !== 'All' &&
              activeCategoryObj &&
              activeCategoryObj.subCats.length > 0 && (
                <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-stone-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setActiveSubCategory('All')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      activeSubCategory === 'All'
                        ? 'bg-white text-stone-950 shadow-2xs'
                        : 'text-stone-600 hover:text-stone-950'
                    }`}
                  >
                    All {activeCategory}
                  </button>
                  {activeCategoryObj.subCats.map((sc) => (
                    <button
                      key={sc}
                      type="button"
                      onClick={() => setActiveSubCategory(sc)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                        activeSubCategory === sc
                          ? 'bg-white text-stone-950 shadow-2xs'
                          : 'text-stone-600 hover:text-stone-950'
                      }`}
                    >
                      {sc}
                    </button>
                  ))}
                </div>
              )}
          </div>

          {/* 3-Column Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-stone-300 rounded-2xl bg-white">
              <p className="text-base font-medium text-stone-800">
                No products match your current filters
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('All');
                  setActiveSubCategory('All');
                  setActiveTag('All');
                  setFeaturedOnly(false);
                  setSearchQuery('');
                }}
                className="mt-3 px-4 py-2 rounded-lg text-xs font-semibold text-white"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
              {filteredProducts.map((product) => {
                const primaryImg = product.coverImage || product.images[0];
                const secondaryImg =
                  product.images.find((img) => img !== primaryImg) || null;
                const isSaved = activeWishlist.includes(product.id);

                return (
                  <article
                    key={product.id}
                    className="group bg-white border border-stone-200 rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    {/* Product Image */}
                    <div
                      onClick={() => setSelectedProduct(product)}
                      className="relative aspect-[4/3] bg-stone-100 overflow-hidden cursor-pointer"
                    >
                      <img
                        src={primaryImg}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className={`w-full h-full object-cover transition-all duration-500 ${
                          secondaryImg
                            ? 'group-hover:opacity-0 group-hover:scale-105'
                            : 'group-hover:scale-105'
                        }`}
                      />
                      {secondaryImg && (
                        <img
                          src={secondaryImg}
                          alt={`${product.name} alternate view`}
                          referrerPolicy="no-referrer"
                          className="absolute inset-0 w-full h-full object-cover opacity-0 scale-100 transition-all duration-500 group-hover:opacity-100 group-hover:scale-105"
                        />
                      )}

                      {product.tag && (
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded bg-stone-950/85 text-white text-[11px] font-semibold tracking-wide">
                          {product.tag}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleWishlist(product.id);
                        }}
                        aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
                        className={`absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 shadow-xs flex items-center justify-center transition-transform duration-150 hover:scale-105 ${
                          isSaved ? 'text-red-600' : 'text-stone-500 hover:text-red-500'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-500' : ''}`} />
                      </button>
                    </div>

                    {/* Product Info */}
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center justify-between gap-2 text-xs text-stone-500 mb-1.5">
                        <span className="uppercase tracking-wider font-medium truncate">
                          {product.category}
                          {product.subCat ? ` · ${product.subCat}` : ''}
                        </span>
                        <span className="inline-flex items-center gap-1 text-stone-700 font-medium shrink-0 tabular-nums">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {product.rating}
                        </span>
                      </div>

                      <h3
                        onClick={() => setSelectedProduct(product)}
                        className="text-base font-semibold text-stone-900 leading-snug mb-3 cursor-pointer hover:underline line-clamp-2"
                      >
                        {product.name}
                      </h3>

                      <div className="flex items-baseline gap-2.5 mt-auto mb-4">
                        <span className="text-lg font-bold text-stone-950 tabular-nums">
                          {state.settings.currency} {product.price.toLocaleString()}
                        </span>
                        {product.oldPrice && product.oldPrice > product.price && (
                          <span className="text-xs text-stone-400 line-through tabular-nums">
                            {state.settings.currency}{' '}
                            {product.oldPrice.toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          disabled={product.inStock === false}
                          onClick={() => handleAddToCart(product.id, 1)}
                          className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-900 text-xs sm:text-sm font-semibold transition-colors disabled:opacity-45"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </button>
                        <button
                          type="button"
                          disabled={product.inStock === false}
                          onClick={() => handleBuyNow(product, 1)}
                          className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-white text-xs sm:text-sm font-semibold transition-opacity hover:opacity-95 disabled:opacity-45"
                          style={{ backgroundColor: 'var(--primary)' }}
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Buy Now</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Store Value Pillars */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-stone-200">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-stone-100 text-stone-800 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-stone-900">
                Express Nationwide Dispatch
              </h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Free delivery on orders above {state.settings.currency}{' '}
                {state.settings.freeDeliveryThreshold.toLocaleString()} with real-time
                order status updates.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-stone-100 text-stone-800 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-stone-900">
                Curated Multi-Angle Gallery
              </h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Inspect every material detail across up to four studio views before
                checking out.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-stone-100 text-stone-800 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-stone-900">
                Customer Portal & Order Tracking
              </h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Register once to manage your profile, wishlist, password, and live order
                fulfillment.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Clean Footer */}
      <footer className="bg-white border-t border-stone-200 py-8 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>
            <strong className="text-stone-900 font-semibold">
              {state.settings.brandName}
            </strong>{' '}
            · Local Storefront & Customer Portal
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={() => {
                setAccountInitialTab('orders');
                setAccountOpen(true);
              }}
              className="hover:text-stone-950 font-medium"
            >
              Order Tracking
            </button>
            <button
              type="button"
              onClick={handleQuickDownloadHtml}
              className="inline-flex items-center gap-1.5 hover:text-stone-950 font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Single .HTML</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminOpen(true)}
              className="font-semibold hover:underline"
              style={{ color: 'var(--accent)' }}
            >
              Admin Dashboard
            </button>
          </div>
        </div>
      </footer>

      {/* Floating Subtle Admin Trigger */}
      <button
        type="button"
        onClick={() => setAdminOpen(true)}
        className="fixed bottom-4 right-4 z-30 px-3.5 py-2 rounded-lg bg-white/95 backdrop-blur-sm border border-stone-200 shadow-sm text-xs font-semibold text-stone-700 hover:text-stone-950 hover:border-stone-400 transition-colors"
      >
        Admin
      </button>

      {/* Modals & Drawers */}
      <ProductModal
        product={selectedProduct}
        currency={state.settings.currency}
        isWishlisted={
          selectedProduct ? activeWishlist.includes(selectedProduct.id) : false
        }
        onClose={() => setSelectedProduct(null)}
        onToggleWishlist={handleToggleWishlist}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />

      <CartDrawer
        open={cartOpen}
        cart={state.cart}
        products={state.products}
        settings={state.settings}
        onClose={() => setCartOpen(false)}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveFromCart}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutTarget({ mode: 'cart' });
        }}
      />

      <CheckoutModal
        target={checkoutTarget}
        cartItems={cartItemsDetailed}
        settings={state.settings}
        currentCustomer={currentCustomer}
        onClose={() => setCheckoutTarget(null)}
        onPlaceOrder={handlePlaceOrder}
      />

      <AccountModal
        open={accountOpen}
        initialTab={accountInitialTab}
        currentCustomer={currentCustomer}
        customers={state.customers}
        orders={state.orders}
        products={state.products}
        guestWishlist={state.guestWishlist}
        settings={state.settings}
        onClose={() => setAccountOpen(false)}
        onLogin={handleCustomerLogin}
        onRegister={handleCustomerRegister}
        onLogout={() => {
          setState((prev) => ({ ...prev, currentCustomerEmail: null }));
          notify('Signed out');
        }}
        onUpdateProfile={handleUpdateProfile}
        onChangePassword={handleChangePassword}
        onToggleWishlist={handleToggleWishlist}
        onAddToCart={(id) => handleAddToCart(id, 1)}
        onBuyNow={(product) => handleBuyNow(product, 1)}
        onOpenAdminLogin={() => {
          setAccountOpen(false);
          setAdminOpen(true);
        }}
      />

      <AdminPanel
        open={adminOpen}
        state={state}
        traffic={traffic}
        onClose={() => setAdminOpen(false)}
        onUpdateState={(updater) => setState(updater)}
        onResetAll={() => {
          localStorage.removeItem(STORAGE_KEY);
          setState(DEFAULT_STATE);
          notify('Store data reset to defaults');
        }}
        onNotify={notify}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-lg bg-stone-950 text-white text-xs sm:text-sm font-medium shadow-xl animate-fade-up"
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
