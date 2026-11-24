import React, { useEffect, useState } from 'react';
import { ChevronDown, Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { Category, Customer, StoreSettings } from '../types/store';

interface NavbarProps {
  settings: StoreSettings;
  categories: Category[];
  activeCategory: string;
  activeSubCategory: string;
  searchQuery: string;
  cartCount: number;
  wishlistCount: number;
  currentCustomer: Customer | null;
  onSelectCategory: (category: string, subCategory?: string) => void;
  onSearchChange: (q: string) => void;
  onOpenAccount: () => void;
  onOpenWishlist: () => void;
  onOpenCart: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  categories,
  activeCategory,
  activeSubCategory,
  searchQuery,
  cartCount,
  wishlistCount,
  currentCustomer,
  onSelectCategory,
  onSearchChange,
  onOpenAccount,
  onOpenWishlist,
  onOpenCart,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const firstName = currentCustomer ? currentCustomer.name.trim().split(/\s+/)[0] : '';

  return (
    <div className="sticky top-0 z-40">
      {/* Slim Announcement Bar (<= 36px) */}
      {settings.announcement && (
        <div
          className="h-8 overflow-hidden flex items-center text-white text-xs font-medium tracking-wide"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          <div className="animate-marquee whitespace-nowrap">
            <span className="px-10">{settings.announcement}</span>
            <span className="px-10" aria-hidden="true">
              {settings.announcement}
            </span>
            <span className="px-10" aria-hidden="true">
              {settings.announcement}
            </span>
          </div>
        </div>
      )}

      {/* Main Header */}
      <header
        className={`bg-white/95 backdrop-blur-md border-b border-stone-200 transition-shadow duration-200 ${
          scrolled ? 'shadow-sm' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 sm:h-18 flex items-center justify-between gap-4 lg:gap-8">
            {/* Zone 1: Brand Wordmark */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 -ml-2 text-stone-700 hover:text-stone-950 rounded-lg transition-colors"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => onSelectCategory('All')}
                className="flex items-center gap-2.5 text-left group shrink-0"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-display font-bold text-lg overflow-hidden transition-transform duration-200 group-hover:scale-105"
                  style={{
                    backgroundColor: settings.brandIconUrl ? 'transparent' : 'var(--primary)',
                  }}
                >
                  {settings.brandIconUrl ? (
                    <img
                      src={settings.brandIconUrl}
                      alt={settings.brandName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span>{settings.brandIcon || 'C'}</span>
                  )}
                </div>
                <span className="font-display text-xl sm:text-2xl font-bold tracking-tight text-stone-900 whitespace-nowrap">
                  {settings.brandName}
                </span>
              </button>
            </div>

            {/* Zone 2: Desktop Category Nav with Hover Subcategory Dropdowns */}
            <nav
              className="hidden lg:flex items-center gap-7"
              aria-label="Primary categories"
            >
              <button
                type="button"
                onClick={() => onSelectCategory('All')}
                className={`nav-underline py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                  activeCategory === 'All'
                    ? 'active text-stone-950'
                    : 'text-stone-600 hover:text-stone-950'
                }`}
              >
                All Finds
              </button>

              {categories.map((cat) => {
                const isActive = activeCategory === cat.name;
                const hasSubs = cat.subCats && cat.subCats.length > 0;
                const isHovered = hoveredCat === cat.name;

                return (
                  <div
                    key={cat.name}
                    className="relative py-2"
                    onMouseEnter={() => setHoveredCat(cat.name)}
                    onMouseLeave={() => setHoveredCat(null)}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onSelectCategory(cat.name);
                        setHoveredCat(null);
                      }}
                      className={`nav-underline inline-flex items-center gap-1 py-1 text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                        isActive
                          ? 'active text-stone-950'
                          : 'text-stone-600 hover:text-stone-950'
                      }`}
                    >
                      <span>{cat.name}</span>
                      {hasSubs && (
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            isHovered ? 'rotate-180 text-stone-950' : 'text-stone-400'
                          }`}
                        />
                      )}
                    </button>

                    {/* Hover Subcategory Dropdown */}
                    {hasSubs && isHovered && (
                      <div className="absolute left-0 top-full pt-1.5 w-56 z-50 animate-dropdown">
                        <div className="bg-white border border-stone-200 rounded-xl shadow-lg py-2 overflow-hidden">
                          <div className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                            {cat.name}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              onSelectCategory(cat.name, 'All');
                              setHoveredCat(null);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors ${
                              isActive && activeSubCategory === 'All'
                                ? 'bg-stone-100 font-semibold text-stone-950'
                                : 'text-stone-700 hover:bg-stone-50 hover:text-stone-950'
                            }`}
                          >
                            <span>All {cat.name}</span>
                          </button>
                          <div className="my-1 border-t border-stone-100" />
                          {cat.subCats.map((sub) => (
                            <button
                              key={sub}
                              type="button"
                              onClick={() => {
                                onSelectCategory(cat.name, sub);
                                setHoveredCat(null);
                              }}
                              className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors ${
                                isActive && activeSubCategory === sub
                                  ? 'bg-stone-100 font-semibold text-stone-950'
                                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-950 hover:translate-x-0.5'
                              }`}
                            >
                              <span>{sub}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Zone 3: Search + Account + Wishlist + Cart */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Desktop Search */}
              <div className="hidden md:flex items-center relative w-52 xl:w-64">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search products..."
                  className="w-full h-9 pl-9 pr-3 text-sm bg-stone-100/80 border border-stone-200 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-stone-400 transition-colors"
                />
              </div>

              {/* Mobile Search Toggle */}
              <button
                type="button"
                onClick={() => setMobileSearchOpen((v) => !v)}
                className="md:hidden p-2 text-stone-700 hover:text-stone-950 rounded-lg"
                aria-label="Toggle search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Wishlist Shortcut */}
              <button
                type="button"
                onClick={onOpenWishlist}
                className="relative p-2 text-stone-700 hover:text-stone-950 rounded-lg transition-colors"
                aria-label="Wishlist"
                title="Wishlist"
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center tabular-nums"
                    style={{ backgroundColor: 'var(--accent)' }}
                  >
                    {wishlistCount}
                  </span>
                )}
              </button>

              {/* Account Button */}
              <button
                type="button"
                onClick={onOpenAccount}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {currentCustomer ? firstName : 'Account'}
                </span>
              </button>

              {/* Cart Button */}
              <button
                type="button"
                onClick={onOpenCart}
                className="relative inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold text-white transition-transform duration-150 active:scale-95 whitespace-nowrap shrink-0"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Cart</span>
                <span className="tabular-nums text-xs bg-white/20 px-1.5 py-0.5 rounded">
                  {cartCount}
                </span>
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          {mobileSearchOpen && (
            <div className="md:hidden pb-3 animate-dropdown">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search products, categories..."
                  className="w-full h-10 pl-9 pr-4 text-sm bg-stone-100 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-400"
                />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-dropdown">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
              <span className="font-display text-lg font-bold text-stone-900">
                {settings.brandName}
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-stone-500 hover:text-stone-900"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <button
                type="button"
                onClick={() => {
                  onSelectCategory('All');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left py-2 px-3 rounded-lg text-sm font-semibold ${
                  activeCategory === 'All'
                    ? 'bg-stone-100 text-stone-950'
                    : 'text-stone-700'
                }`}
              >
                All Products
              </button>

              {categories.map((cat) => (
                <div key={cat.name} className="border-t border-stone-100 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectCategory(cat.name, 'All');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left py-1.5 px-3 text-sm font-semibold text-stone-900"
                  >
                    {cat.name}
                  </button>
                  {cat.subCats.length > 0 && (
                    <div className="pl-5 mt-1 space-y-1">
                      {cat.subCats.map((sub) => (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => {
                            onSelectCategory(cat.name, sub);
                            setMobileMenuOpen(false);
                          }}
                          className="block w-full text-left py-1.5 px-2 text-sm text-stone-600 hover:text-stone-950"
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
