import React, { useEffect, useState } from 'react';
import {
  Heart,
  KeyRound,
  LogOut,
  Package,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  User,
  X,
  Zap,
} from 'lucide-react';
import { Customer, Order, OrderStatus, Product, StoreSettings } from '../types/store';

export type AccountTab = 'profile' | 'orders' | 'wishlist' | 'security';

interface AccountModalProps {
  open: boolean;
  initialTab?: AccountTab;
  currentCustomer: Customer | null;
  customers: Customer[];
  orders: Order[];
  products: Product[];
  guestWishlist: number[];
  settings: StoreSettings;
  onClose: () => void;
  onLogin: (email: string, pass: string) => boolean;
  onRegister: (data: {
    name: string;
    email: string;
    phone: string;
    pass: string;
    city: string;
    address: string;
  }) => boolean;
  onLogout: () => void;
  onUpdateProfile: (updates: Partial<Customer>) => void;
  onChangePassword: (currentPass: string, newPass: string) => boolean;
  onToggleWishlist: (productId: number) => void;
  onAddToCart: (productId: number) => void;
  onBuyNow: (product: Product) => void;
  onOpenAdminLogin: () => void;
}

const STATUS_STYLES: Record<OrderStatus, string> = {
  Pending: 'bg-amber-50 text-amber-800 border-amber-200',
  Confirmed: 'bg-sky-50 text-sky-800 border-sky-200',
  Processing: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  Shipped: 'bg-violet-50 text-violet-800 border-violet-200',
  Delivered: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Cancelled: 'bg-red-50 text-red-800 border-red-200',
};

export const AccountModal: React.FC<AccountModalProps> = ({
  open,
  initialTab = 'profile',
  currentCustomer,
  orders,
  products,
  guestWishlist,
  settings,
  onClose,
  onLogin,
  onRegister,
  onLogout,
  onUpdateProfile,
  onChangePassword,
  onToggleWishlist,
  onAddToCart,
  onBuyNow,
  onOpenAdminLogin,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [activeTab, setActiveTab] = useState<AccountTab>(initialTab);

  // Auth form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPass, setRegPass] = useState('');

  // Profile edit states
  const [profName, setProfName] = useState('');
  const [profPhone, setProfPhone] = useState('');
  const [profCity, setProfCity] = useState('');
  const [profAddress, setProfAddress] = useState('');

  // Password change states
  const [currPass, setCurrPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passMsg, setPassMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
      setPassMsg(null);
    }
  }, [open, initialTab]);

  useEffect(() => {
    if (currentCustomer) {
      setProfName(currentCustomer.name || '');
      setProfPhone(currentCustomer.phone || '');
      setProfCity(currentCustomer.city || '');
      setProfAddress(currentCustomer.address || '');
    }
  }, [currentCustomer]);

  if (!open) return null;

  const customerOrders = currentCustomer
    ? orders.filter(
        (o) =>
          o.customerEmail?.toLowerCase() === currentCustomer.email.toLowerCase() ||
          o.email?.toLowerCase() === currentCustomer.email.toLowerCase() ||
          (currentCustomer.phone && o.phone === currentCustomer.phone)
      )
    : [];

  const activeWishlistIds = currentCustomer ? currentCustomer.wishlist : guestWishlist;
  const wishlistProducts = products.filter((p) => activeWishlistIds.includes(p.id));

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = onLogin(loginEmail, loginPass);
    if (ok) {
      setLoginPass('');
      setActiveTab('profile');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = onRegister({
      name: regName,
      email: regEmail,
      phone: regPhone,
      pass: regPass,
      city: regCity,
      address: regAddress,
    });
    if (ok) {
      setRegName('');
      setRegEmail('');
      setRegPhone('');
      setRegPass('');
      setRegCity('');
      setRegAddress('');
      setActiveTab('profile');
    }
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name: profName.trim(),
      phone: profPhone.trim(),
      city: profCity.trim(),
      address: profAddress.trim(),
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);
    if (newPass.length < 4) {
      setPassMsg('New password must be at least 4 characters.');
      return;
    }
    if (newPass !== confirmPass) {
      setPassMsg('New password and confirmation do not match.');
      return;
    }
    const ok = onChangePassword(currPass, newPass);
    if (ok) {
      setCurrPass('');
      setNewPass('');
      setConfirmPass('');
      setPassMsg('Password updated successfully.');
    } else {
      setPassMsg('Current password is incorrect.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className={`relative bg-white w-full rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-fade-up ${
          currentCustomer ? 'max-w-4xl' : 'max-w-md'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200 bg-white">
          <div>
            <h2 className="font-display text-2xl font-bold text-stone-900">
              {currentCustomer
                ? `Welcome, ${currentCustomer.name}`
                : authMode === 'login'
                ? 'Customer Sign In'
                : 'Create Account'}
            </h2>
            {currentCustomer && (
              <p className="text-xs text-stone-500 mt-0.5">
                {currentCustomer.email} · Member since {currentCustomer.joinedAt}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {currentCustomer && (
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close account modal"
              className="p-2 text-stone-500 hover:text-stone-900 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        {!currentCustomer ? (
          <div className="p-6 sm:p-7 overflow-y-auto space-y-5">
            {/* Guest Wishlist Quick Preview Notice if user clicked Wishlist icon */}
            {initialTab === 'wishlist' && wishlistProducts.length > 0 && (
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Saved Wishlist ({wishlistProducts.length})
                  </span>
                  <span className="text-xs text-stone-500">
                    Sign in to sync across sessions
                  </span>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {wishlistProducts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-2 bg-white p-2 rounded-lg border border-stone-200"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={p.coverImage || p.images[0]}
                          alt={p.name}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-stone-900 truncate">
                            {p.name}
                          </p>
                          <p className="text-xs text-stone-500 tabular-nums">
                            {settings.currency} {p.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onAddToCart(p.id)}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-stone-900 text-white shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Auth Segmented Switch */}
            <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-lg">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`py-2 text-sm font-semibold rounded-md transition-colors ${
                  authMode === 'login'
                    ? 'bg-white text-stone-950 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className={`py-2 text-sm font-semibold rounded-md transition-colors ${
                  authMode === 'signup'
                    ? 'bg-white text-stone-950 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Register
              </button>
            </div>

            {authMode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-95"
                  style={{ backgroundColor: 'var(--primary)' }}
                >
                  Sign In to My Account
                </button>

                <div className="pt-3 border-t border-stone-200 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setAuthMode('signup')}
                    className="text-stone-600 hover:text-stone-950 font-medium"
                  >
                    New here? Create account
                  </button>
                  <button
                    type="button"
                    onClick={onOpenAdminLogin}
                    className="inline-flex items-center gap-1 font-semibold hover:underline"
                    style={{ color: 'var(--accent)' }}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Admin Panel</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Ali Raza"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="0300 1234567"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={regCity}
                      onChange={(e) => setRegCity(e.target.value)}
                      placeholder="Lahore"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={4}
                      value={regPass}
                      onChange={(e) => setRegPass(e.target.value)}
                      placeholder="Min 4 characters"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Delivery Address
                  </label>
                  <input
                    type="text"
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="Street, sector, house no."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-95"
                  style={{ backgroundColor: 'var(--primary)' }}
                >
                  Create Account & Open Dashboard
                </button>
              </form>
            )}
          </div>
        ) : (
          /* LOGGED-IN CUSTOMER DASHBOARD */
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
            {/* Sidebar Navigation */}
            <aside className="md:w-56 bg-stone-50 border-b md:border-b-0 md:border-r border-stone-200 p-3 md:p-4 flex md:flex-col gap-1.5 overflow-x-auto shrink-0">
              {(
                [
                  { id: 'profile', label: 'My Profile', icon: User },
                  {
                    id: 'orders',
                    label: `Orders (${customerOrders.length})`,
                    icon: Package,
                  },
                  {
                    id: 'wishlist',
                    label: `Wishlist (${wishlistProducts.length})`,
                    icon: Heart,
                  },
                  { id: 'security', label: 'Change Password', icon: KeyRound },
                ] as const
              ).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === id
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-700 hover:bg-stone-200/70'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{label}</span>
                </button>
              ))}
            </aside>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8">
              {activeTab === 'profile' && (
                <form onSubmit={handleProfileSave} className="space-y-5 max-w-lg">
                  <div>
                    <h3 className="font-display text-xl font-bold text-stone-900">
                      Personal Profile
                    </h3>
                    <p className="text-xs text-stone-500 mt-1">
                      Saved details auto-fill your checkout form on future orders.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={profName}
                        onChange={(e) => setProfName(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        required
                        value={profPhone}
                        onChange={(e) => setProfPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      disabled
                      value={currentCustomer.email}
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-200 bg-stone-100 text-stone-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      City
                    </label>
                    <input
                      type="text"
                      value={profCity}
                      onChange={(e) => setProfCity(e.target.value)}
                      placeholder="City"
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Default Delivery Address
                    </label>
                    <textarea
                      rows={2}
                      value={profAddress}
                      onChange={(e) => setProfAddress(e.target.value)}
                      placeholder="Street, House, Sector"
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-95"
                    style={{ backgroundColor: 'var(--primary)' }}
                  >
                    Save Profile Changes
                  </button>
                </form>
              )}

              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-display text-xl font-bold text-stone-900">
                      Order History & Live Status
                    </h3>
                    <p className="text-xs text-stone-500 mt-1">
                      Track fulfillment updates as your orders are confirmed and shipped.
                    </p>
                  </div>

                  {customerOrders.length === 0 ? (
                    <div className="py-12 text-center border border-dashed border-stone-200 rounded-xl">
                      <Package className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                      <p className="text-sm font-medium text-stone-800">
                        You have not placed any orders yet
                      </p>
                      <p className="text-xs text-stone-500 mt-1">
                        Orders placed using your email or phone appear here automatically.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {customerOrders.map((order) => (
                        <div
                          key={order.id}
                          className="border border-stone-200 rounded-xl p-4 sm:p-5 space-y-3 bg-white"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <span className="font-mono text-sm font-bold text-stone-900">
                                {order.id}
                              </span>
                              <span className="text-xs text-stone-500 ml-2">
                                {order.date}
                              </span>
                            </div>
                            <span
                              className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${
                                STATUS_STYLES[order.status] || STATUS_STYLES.Pending
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>

                          <div className="divide-y divide-stone-100 text-sm">
                            {order.items.map((item, idx) => (
                              <div
                                key={`${item.productId}-${idx}`}
                                className="py-2 flex items-center justify-between"
                              >
                                <span className="text-stone-700">
                                  {item.name}{' '}
                                  <span className="text-stone-400 tabular-nums">
                                    × {item.qty}
                                  </span>
                                </span>
                                <span className="font-medium text-stone-900 tabular-nums">
                                  {settings.currency}{' '}
                                  {(item.price * item.qty).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
                            <span>
                              Ship to: {order.address}, {order.city} · {order.paymentMethod}
                            </span>
                            <span className="text-sm font-bold text-stone-950 tabular-nums">
                              Total: {settings.currency} {order.total.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'wishlist' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-display text-xl font-bold text-stone-900">
                      Saved Wishlist
                    </h3>
                    <p className="text-xs text-stone-500 mt-1">
                      Products you saved for later purchase.
                    </p>
                  </div>

                  {wishlistProducts.length === 0 ? (
                    <div className="py-12 text-center border border-dashed border-stone-200 rounded-xl">
                      <Heart className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                      <p className="text-sm font-medium text-stone-800">
                        Your wishlist is empty
                      </p>
                      <p className="text-xs text-stone-500 mt-1">
                        Click the heart icon on any product to save it here.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {wishlistProducts.map((p) => (
                        <div
                          key={p.id}
                          className="border border-stone-200 rounded-xl p-3.5 flex gap-3.5 items-center bg-white"
                        >
                          <img
                            src={p.coverImage || p.images[0]}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-20 h-20 rounded-lg object-cover bg-stone-100 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-stone-500 uppercase">{p.category}</p>
                            <h4 className="text-sm font-semibold text-stone-900 truncate">
                              {p.name}
                            </h4>
                            <p className="text-sm font-bold text-stone-950 tabular-nums mt-1">
                              {settings.currency} {p.price.toLocaleString()}
                            </p>
                            <div className="flex items-center gap-2 mt-2.5">
                              <button
                                type="button"
                                onClick={() => onAddToCart(p.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-stone-200 text-xs font-semibold text-stone-800 hover:bg-stone-50"
                              >
                                <ShoppingBag className="w-3 h-3" />
                                <span>Cart</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  onBuyNow(p);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold text-white"
                                style={{ backgroundColor: 'var(--primary)' }}
                              >
                                <Zap className="w-3 h-3" />
                                <span>Buy</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onToggleWishlist(p.id)}
                                aria-label="Remove from wishlist"
                                className="p-1.5 text-stone-400 hover:text-red-600 ml-auto"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'security' && (
                <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                  <div>
                    <h3 className="font-display text-xl font-bold text-stone-900">
                      Change Password
                    </h3>
                    <p className="text-xs text-stone-500 mt-1">
                      Update your customer account password.
                    </p>
                  </div>

                  {passMsg && (
                    <div
                      className={`p-3 rounded-lg text-xs font-medium border ${
                        passMsg.includes('success')
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-red-50 text-red-800 border-red-200'
                      }`}
                    >
                      {passMsg}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Current Password
                    </label>
                    <input
                      type="password"
                      required
                      value={currPass}
                      onChange={(e) => setCurrPass(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={4}
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={4}
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-95"
                    style={{ backgroundColor: 'var(--primary)' }}
                  >
                    Update Password
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
