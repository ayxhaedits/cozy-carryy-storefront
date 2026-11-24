import React, { useState } from 'react';
import {
  Check,
  Code2,
  Copy,
  Download,
  ImagePlus,
  LayoutGrid,
  Package,
  Palette,
  Plus,
  RotateCcw,
  Settings,
  Shield,
  Sliders,
  Star,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import {
  OrderStatus,
  Product,
  StoreState,
  TrafficData,
} from '../types/store';
import { buildSingleFileHtml, preparePortableState } from '../utils/singleFileHtmlGenerator';

type AdminTab =
  | 'overview'
  | 'products'
  | 'categories'
  | 'hero'
  | 'branding'
  | 'orders'
  | 'customers'
  | 'settings';

interface AdminPanelProps {
  open: boolean;
  state: StoreState;
  traffic: TrafficData;
  onClose: () => void;
  onUpdateState: (updater: (prev: StoreState) => StoreState) => void;
  onResetAll: () => void;
  onNotify: (msg: string) => void;
}

function resizeImageFile(file: File, maxDim = 1000): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight, 1);
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas error'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.84));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  open,
  state,
  traffic,
  onClose,
  onUpdateState,
  onResetAll,
  onNotify,
}) => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginUser, setLoginUser] = useState('admin');
  const [loginPass, setLoginPass] = useState('admin123');
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Product Editor state
  const [editingProductId, setEditingProductId] = useState<number | 'new' | null>(null);
  const [epName, setEpName] = useState('');
  const [epPrice, setEpPrice] = useState('');
  const [epOldPrice, setEpOldPrice] = useState('');
  const [epRating, setEpRating] = useState('4.8');
  const [epCat, setEpCat] = useState('');
  const [epSubCat, setEpSubCat] = useState('');
  const [epTag, setEpTag] = useState<Product['tag']>('New');
  const [epFeatured, setEpFeatured] = useState(true);
  const [epInStock, setEpInStock] = useState(true);
  const [epDesc, setEpDesc] = useState('');
  const [epImages, setEpImages] = useState<(string | null)[]>([null, null, null, null]);
  const [epCoverIndex, setEpCoverIndex] = useState(0);
  const [epUrlInput, setEpUrlInput] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Category editor state
  const [newCatName, setNewCatName] = useState('');
  const [newCatImg, setNewCatImg] = useState('');
  const [subParent, setSubParent] = useState('');
  const [newSubName, setNewSubName] = useState('');

  // Export feedback
  const [exporting, setExporting] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  if (!open) return null;

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      loginUser.trim() === (state.settings.adminUser || 'admin') &&
      loginPass === (state.settings.adminPass || 'admin123')
    ) {
      setLoggedIn(true);
      onNotify('Admin dashboard unlocked');
    } else {
      onNotify('Invalid admin username or password');
    }
  };

  const openProductEditor = (product: Product | null) => {
    if (product) {
      setEditingProductId(product.id);
      setEpName(product.name);
      setEpPrice(String(product.price));
      setEpOldPrice(product.oldPrice ? String(product.oldPrice) : '');
      setEpRating(String(product.rating || 4.8));
      setEpCat(product.category);
      setEpSubCat(product.subCat || '');
      setEpTag(product.tag || '');
      setEpFeatured(product.featured);
      setEpInStock(product.inStock !== false);
      setEpDesc(product.desc || '');
      const slots: (string | null)[] = [null, null, null, null];
      (product.images || []).slice(0, 4).forEach((img, idx) => {
        slots[idx] = img;
      });
      setEpImages(slots);
      const covIdx = product.coverImage
        ? Math.max(0, slots.indexOf(product.coverImage))
        : 0;
      setEpCoverIndex(covIdx);
    } else {
      const firstCat = state.categories[0];
      setEditingProductId('new');
      setEpName('');
      setEpPrice('');
      setEpOldPrice('');
      setEpRating('4.8');
      setEpCat(firstCat?.name || 'Electronics');
      setEpSubCat(firstCat?.subCats?.[0] || '');
      setEpTag('New');
      setEpFeatured(true);
      setEpInStock(true);
      setEpDesc('');
      setEpImages([null, null, null, null]);
      setEpCoverIndex(0);
    }
    setEpUrlInput('');
  };

  const handleMultipleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const nextSlots = [...epImages];
    let firstAddedIdx = -1;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const emptyIdx = nextSlots.findIndex((x) => !x);
      if (emptyIdx === -1) break;
      try {
        const dataUrl = await resizeImageFile(file);
        nextSlots[emptyIdx] = dataUrl;
        if (firstAddedIdx === -1) firstAddedIdx = emptyIdx;
      } catch {
        onNotify('Could not read one of the selected images');
      }
    }

    setEpImages(nextSlots);
    if (!nextSlots[epCoverIndex] && firstAddedIdx !== -1) {
      setEpCoverIndex(firstAddedIdx);
    }
  };

  const handleAddImageUrl = () => {
    const trimmed = epUrlInput.trim();
    if (!trimmed) return;
    const nextSlots = [...epImages];
    const emptyIdx = nextSlots.findIndex((x) => !x);
    if (emptyIdx === -1) {
      onNotify('Maximum 4 images per product');
      return;
    }
    nextSlots[emptyIdx] = trimmed;
    setEpImages(nextSlots);
    if (!nextSlots[epCoverIndex]) setEpCoverIndex(emptyIdx);
    setEpUrlInput('');
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const validImages = epImages.filter((x): x is string => Boolean(x));
    if (validImages.length === 0) {
      onNotify('Please upload or add at least 1 product image');
      return;
    }

    const cover = epImages[epCoverIndex] || validImages[0];
    const orderedImages = [cover, ...validImages.filter((img) => img !== cover)];

    const saved: Product = {
      id: editingProductId === 'new' ? Date.now() : Number(editingProductId),
      name: epName.trim(),
      price: Number(epPrice) || 0,
      oldPrice: Number(epOldPrice) || undefined,
      rating: Number(epRating) || 4.8,
      category: epCat,
      subCat: epSubCat,
      tag: epTag,
      featured: epFeatured,
      inStock: epInStock,
      desc: epDesc.trim(),
      images: orderedImages,
      coverImage: cover,
    };

    onUpdateState((prev) => {
      const exists = prev.products.some((p) => p.id === saved.id);
      return {
        ...prev,
        products: exists
          ? prev.products.map((p) => (p.id === saved.id ? saved : p))
          : [saved, ...prev.products],
      };
    });

    setEditingProductId(null);
    onNotify('Product saved to storefront');
  };

  const handleExportSingleHtml = async (mode: 'download' | 'copy') => {
    setExporting(true);
    try {
      const portable = await preparePortableState(state);
      const html = buildSingleFileHtml(portable);
      if (mode === 'download') {
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
        onNotify('Single HTML file downloaded!');
      } else {
        await navigator.clipboard.writeText(html);
        setCopiedHtml(true);
        setTimeout(() => setCopiedHtml(false), 2500);
        onNotify('Complete single HTML code copied to clipboard!');
      }
    } catch {
      onNotify('Export failed — please try Download instead');
    } finally {
      setExporting(false);
    }
  };

  const totalRevenue = state.orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const pendingCount = state.orders.filter((o) => o.status === 'Pending').length;
  const todayKey = new Date().toISOString().slice(0, 10);
  const last7Days = Object.entries(traffic.daily || {})
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 7);

  const tabs: { id: AdminTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: Sliders },
    { id: 'hero', label: 'Hero Slides', icon: ImagePlus },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'orders', label: 'Orders', icon: Shield },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'settings', label: 'Settings & HTML', icon: Settings },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-stone-950/55 backdrop-blur-xs"
        onClick={onClose}
      />

      <div className="relative w-full max-w-5xl bg-white h-full shadow-2xl flex flex-col z-10 animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-white">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-stone-900">
              {loggedIn ? `${state.settings.brandName} Admin Studio` : 'Admin Sign In'}
            </h2>
            <p className="text-xs text-stone-500">
              {loggedIn
                ? 'Full local store control — changes reflect immediately'
                : 'Default credentials: admin / admin123'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {loggedIn && (
              <button
                type="button"
                disabled={exporting}
                onClick={() => handleExportSingleHtml('download')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-50"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                <Download className="w-3.5 h-3.5" />
                <span>{exporting ? 'Packaging...' : 'Download 1-File HTML'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close admin panel"
              className="p-2 text-stone-500 hover:text-stone-900 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!loggedIn ? (
          <div className="flex-1 flex items-center justify-center p-6 bg-stone-50">
            <form
              onSubmit={handleAdminLogin}
              className="w-full max-w-sm bg-white p-7 rounded-2xl border border-stone-200 shadow-sm space-y-4"
            >
              <h3 className="font-display text-xl font-bold text-stone-900">
                Sign In to Dashboard
              </h3>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
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
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                Unlock Admin Panel
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="flex items-center gap-1.5 px-6 py-3 bg-stone-50 border-b border-stone-200 overflow-x-auto shrink-0">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setActiveTab(id);
                    setEditingProductId(null);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    activeTab === id
                      ? 'text-white shadow-xs'
                      : 'text-stone-600 hover:bg-stone-200/70 hover:text-stone-900'
                  }`}
                  style={
                    activeTab === id
                      ? { backgroundColor: 'var(--primary)' }
                      : undefined
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Tab Workspace */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8">
              {/* OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Products', value: state.products.length },
                      {
                        label: 'Total Orders',
                        value: `${state.orders.length} (${pendingCount} pending)`,
                      },
                      {
                        label: 'Total Revenue',
                        value: `${state.settings.currency} ${totalRevenue.toLocaleString()}`,
                      },
                      { label: 'Store Visits', value: traffic.total || 0 },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="p-4 rounded-xl bg-stone-50 border border-stone-200"
                      >
                        <p className="text-xs font-medium text-stone-500 mb-1">
                          {stat.label}
                        </p>
                        <p className="text-xl sm:text-2xl font-bold text-stone-900 tabular-nums">
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Single HTML Export Card */}
                  <div className="p-6 rounded-2xl border border-stone-200 bg-stone-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-display text-lg font-bold text-stone-900">
                        Export Complete Single-File HTML Website
                      </h3>
                      <p className="text-xs text-stone-600 mt-1 max-w-xl leading-relaxed">
                        Packages all HTML, CSS, JavaScript, animations, products, hero
                        slides, and embedded images into one standalone{' '}
                        <code className="font-mono bg-stone-200/70 px-1 rounded">
                          .html
                        </code>{' '}
                        file that runs directly on any computer or local host.
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <button
                        type="button"
                        disabled={exporting}
                        onClick={() => handleExportSingleHtml('copy')}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 text-xs font-semibold text-stone-800"
                      >
                        {copiedHtml ? (
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedHtml ? 'Copied!' : 'Copy HTML Code'}</span>
                      </button>
                      <button
                        type="button"
                        disabled={exporting}
                        onClick={() => handleExportSingleHtml('download')}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold text-white"
                        style={{ backgroundColor: 'var(--primary)' }}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download .HTML</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-stone-800 mb-3">
                      Quick Control Shortcuts
                    </h3>
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('products');
                          openProductEditor(null);
                        }}
                        className="px-4 py-2 rounded-lg text-xs font-semibold text-white"
                        style={{ backgroundColor: 'var(--accent)' }}
                      >
                        + Add New Product
                      </button>
                      {(['hero', 'categories', 'orders', 'branding'] as const).map(
                        (t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setActiveTab(t)}
                            className="px-4 py-2 rounded-lg text-xs font-semibold border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 capitalize"
                          >
                            Manage {t}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* PRODUCTS */}
              {activeTab === 'products' &&
                (editingProductId !== null ? (
                  <form onSubmit={handleSaveProduct} className="space-y-5 max-w-3xl">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-xl font-bold text-stone-900">
                        {editingProductId === 'new' ? 'Add New Product' : 'Edit Product'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setEditingProductId(null)}
                        className="text-xs font-semibold text-stone-600 hover:text-stone-950"
                      >
                        ← Back to Products
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                          Product Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={epName}
                          onChange={(e) => setEpName(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                            Price ({state.settings.currency}) *
                          </label>
                          <input
                            type="number"
                            min={1}
                            required
                            value={epPrice}
                            onChange={(e) => setEpPrice(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                            Old Price
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={epOldPrice}
                            onChange={(e) => setEpOldPrice(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                          Category
                        </label>
                        <select
                          value={epCat}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEpCat(val);
                            const catObj = state.categories.find(
                              (c) => c.name === val
                            );
                            setEpSubCat(catObj?.subCats?.[0] || '');
                          }}
                          className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-300 bg-white"
                        >
                          {state.categories.map((c) => (
                            <option key={c.name} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                          Sub-Category
                        </label>
                        <select
                          value={epSubCat}
                          onChange={(e) => setEpSubCat(e.target.value)}
                          className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-300 bg-white"
                        >
                          <option value="">General</option>
                          {(
                            state.categories.find((c) => c.name === epCat)?.subCats ||
                            []
                          ).map((sc) => (
                            <option key={sc} value={sc}>
                              {sc}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                          Tag
                        </label>
                        <select
                          value={epTag}
                          onChange={(e) =>
                            setEpTag(e.target.value as Product['tag'])
                          }
                          className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-300 bg-white"
                        >
                          <option value="">None</option>
                          <option value="New">New</option>
                          <option value="Bestseller">Bestseller</option>
                          <option value="Sale">Sale</option>
                          <option value="Limited">Limited</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                          Rating
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={5}
                          step={0.1}
                          value={epRating}
                          onChange={(e) => setEpRating(e.target.value)}
                          className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-300"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-6">
                      <label className="inline-flex items-center gap-2 text-sm font-medium text-stone-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={epFeatured}
                          onChange={(e) => setEpFeatured(e.target.checked)}
                          className="w-4 h-4 rounded"
                        />
                        <span>Featured Product</span>
                      </label>
                      <label className="inline-flex items-center gap-2 text-sm font-medium text-stone-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={epInStock}
                          onChange={(e) => setEpInStock(e.target.checked)}
                          className="w-4 h-4 rounded"
                        />
                        <span>In Stock (Available for Purchase)</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Description
                      </label>
                      <textarea
                        rows={3}
                        value={epDesc}
                        onChange={(e) => setEpDesc(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900"
                      />
                    </div>

                    {/* STYLED MULTIPLE IMAGE UPLOAD DROPZONE */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-stone-700">
                          Product Images (Up to 4 — select ★ for Cover)
                        </label>
                        <span className="text-xs text-stone-500">
                          {epImages.filter(Boolean).length} / 4 uploaded
                        </span>
                      </div>

                      <label
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragActive(true);
                        }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragActive(false);
                          handleMultipleFiles(e.dataTransfer.files);
                        }}
                        className={`flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                          dragActive
                            ? 'border-stone-900 bg-stone-100'
                            : 'border-stone-300 bg-stone-50 hover:border-stone-500 hover:bg-stone-100/70'
                        }`}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            handleMultipleFiles(e.target.files);
                            e.target.value = '';
                          }}
                        />
                        <div className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-700 shadow-2xs">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-stone-900">
                            Click to browse or drag & drop multiple images
                          </p>
                          <p className="text-xs text-stone-500 mt-0.5">
                            Select up to 4 JPG, PNG, or WEBP photos at once
                          </p>
                        </div>
                      </label>

                      {/* Optional URL Adder */}
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={epUrlInput}
                          onChange={(e) => setEpUrlInput(e.target.value)}
                          placeholder="Or paste an image URL and click Add..."
                          className="flex-1 px-3.5 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900"
                        />
                        <button
                          type="button"
                          onClick={handleAddImageUrl}
                          className="px-4 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-800"
                        >
                          Add URL
                        </button>
                      </div>

                      {/* 4 Image Slots Preview */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {epImages.map((img, idx) => (
                          <div
                            key={idx}
                            className={`relative aspect-square rounded-xl border overflow-hidden flex items-center justify-center bg-stone-50 ${
                              img && idx === epCoverIndex
                                ? 'border-amber-500 ring-2 ring-amber-400/40'
                                : 'border-dashed border-stone-300'
                            }`}
                          >
                            {img ? (
                              <>
                                <img
                                  src={img}
                                  alt={`Slot ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = [...epImages];
                                    next[idx] = null;
                                    setEpImages(next);
                                    if (epCoverIndex === idx) {
                                      const firstValid = next.findIndex(Boolean);
                                      setEpCoverIndex(Math.max(0, firstValid));
                                    }
                                  }}
                                  aria-label="Remove image"
                                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/95 text-red-600 shadow-xs flex items-center justify-center hover:bg-red-50"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEpCoverIndex(idx)}
                                  className={`absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shadow-xs ${
                                    idx === epCoverIndex
                                      ? 'bg-amber-400 text-stone-950'
                                      : 'bg-white/90 text-stone-700 hover:bg-white'
                                  }`}
                                >
                                  <Star className="w-2.5 h-2.5 fill-current" />
                                  <span>{idx === epCoverIndex ? 'Cover' : 'Set Cover'}</span>
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-stone-400 font-medium">
                                Image {idx + 1}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white"
                        style={{ backgroundColor: 'var(--primary)' }}
                      >
                        Save Product
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingProductId(null)}
                        className="px-5 py-2.5 rounded-lg border border-stone-300 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <h3 className="font-display text-xl font-bold text-stone-900">
                          Product Catalogue ({state.products.length})
                        </h3>
                        <p className="text-xs text-stone-500">
                          Manage multi-image products, pricing, stock, and featured flags.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openProductEditor(null)}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold text-white"
                        style={{ backgroundColor: 'var(--primary)' }}
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Product</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto border border-stone-200 rounded-xl">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-stone-50 border-b border-stone-200 text-xs font-semibold text-stone-500 uppercase">
                          <tr>
                            <th className="px-4 py-3">Product</th>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3">Price</th>
                            <th className="px-4 py-3">Featured</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {state.products.map((p) => (
                            <tr key={p.id} className="hover:bg-stone-50/70">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={p.coverImage || p.images[0]}
                                    alt={p.name}
                                    referrerPolicy="no-referrer"
                                    className="w-11 h-11 rounded-lg object-cover bg-stone-100 shrink-0"
                                  />
                                  <div>
                                    <p className="font-semibold text-stone-900">
                                      {p.name}
                                    </p>
                                    <p className="text-xs text-stone-500">
                                      {p.images.length} photo(s) ·{' '}
                                      {p.inStock !== false ? 'In Stock' : 'Out of Stock'}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-xs text-stone-600">
                                {p.category}
                                {p.subCat ? ` · ${p.subCat}` : ''}
                              </td>
                              <td className="px-4 py-3 font-semibold tabular-nums">
                                {state.settings.currency} {p.price.toLocaleString()}
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onUpdateState((prev) => ({
                                      ...prev,
                                      products: prev.products.map((item) =>
                                        item.id === p.id
                                          ? { ...item, featured: !item.featured }
                                          : item
                                      ),
                                    }))
                                  }
                                  className={`px-2.5 py-1 rounded text-xs font-semibold border ${
                                    p.featured
                                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                                      : 'bg-stone-50 text-stone-500 border-stone-200'
                                  }`}
                                >
                                  {p.featured ? 'Featured' : 'Standard'}
                                </button>
                              </td>
                              <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => openProductEditor(p)}
                                  className="text-xs font-semibold text-stone-800 hover:underline"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onUpdateState((prev) => ({
                                      ...prev,
                                      products: prev.products.filter(
                                        (x) => x.id !== p.id
                                      ),
                                    }));
                                    onNotify('Product deleted');
                                  }}
                                  className="text-xs font-semibold text-red-600 hover:underline"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}

              {/* CATEGORIES */}
              {activeTab === 'categories' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Add Category */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const name = newCatName.trim();
                        if (!name) return;
                        if (
                          state.categories.some(
                            (c) => c.name.toLowerCase() === name.toLowerCase()
                          )
                        ) {
                          onNotify('Category already exists');
                          return;
                        }
                        const img =
                          newCatImg.trim() ||
                          '/src/assets/images/prod_leather_tote_1795556294539.jpg';
                        onUpdateState((prev) => ({
                          ...prev,
                          categories: [
                            ...prev.categories,
                            { name, img, subCats: [] },
                          ],
                        }));
                        setNewCatName('');
                        setNewCatImg('');
                        onNotify('Category added');
                      }}
                      className="p-5 rounded-xl bg-stone-50 border border-stone-200 space-y-3"
                    >
                      <h4 className="font-semibold text-sm text-stone-900">
                        Add Category
                      </h4>
                      <input
                        type="text"
                        required
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="Category Name (e.g. Footwear)"
                        className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 bg-white"
                      />
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={newCatImg}
                          onChange={(e) => setNewCatImg(e.target.value)}
                          placeholder="Image URL or upload →"
                          className="flex-1 px-3.5 py-2 text-sm rounded-lg border border-stone-300 bg-white"
                        />
                        <label className="px-3 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 text-xs font-semibold cursor-pointer shrink-0">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const dataUrl = await resizeImageFile(file, 600);
                              setNewCatImg(dataUrl);
                            }}
                          />
                          Upload
                        </label>
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg text-xs font-semibold text-white"
                        style={{ backgroundColor: 'var(--primary)' }}
                      >
                        Add Category
                      </button>
                    </form>

                    {/* Add Sub-Category */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const parent = subParent || state.categories[0]?.name;
                        const sub = newSubName.trim();
                        if (!parent || !sub) return;
                        onUpdateState((prev) => ({
                          ...prev,
                          categories: prev.categories.map((c) =>
                            c.name === parent && !c.subCats.includes(sub)
                              ? { ...c, subCats: [...c.subCats, sub] }
                              : c
                          ),
                        }));
                        setNewSubName('');
                        onNotify('Sub-category added to navbar hover menu');
                      }}
                      className="p-5 rounded-xl bg-stone-50 border border-stone-200 space-y-3"
                    >
                      <h4 className="font-semibold text-sm text-stone-900">
                        Add Sub-Category (Hover Dropdown Item)
                      </h4>
                      <select
                        value={subParent || state.categories[0]?.name || ''}
                        onChange={(e) => setSubParent(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 bg-white"
                      >
                        {state.categories.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        required
                        value={newSubName}
                        onChange={(e) => setNewSubName(e.target.value)}
                        placeholder="Sub-Category Name (e.g. Sneakers)"
                        className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 bg-white"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg text-xs font-semibold text-white"
                        style={{ backgroundColor: 'var(--accent)' }}
                      >
                        Add Sub-Category
                      </button>
                    </form>
                  </div>

                  {/* Category List */}
                  <div className="space-y-3">
                    {state.categories.map((cat, idx) => (
                      <div
                        key={cat.name}
                        className="p-4 rounded-xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white"
                      >
                        <div className="flex items-center gap-3.5">
                          <img
                            src={cat.img}
                            alt={cat.name}
                            referrerPolicy="no-referrer"
                            className="w-14 h-14 rounded-xl object-cover bg-stone-100 shrink-0"
                          />
                          <div>
                            <h5 className="font-semibold text-stone-900">
                              {cat.name}
                            </h5>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {cat.subCats.length === 0 ? (
                                <span className="text-xs text-stone-400">
                                  No sub-categories
                                </span>
                              ) : (
                                cat.subCats.map((sc) => (
                                  <span
                                    key={sc}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-100 text-xs text-stone-700"
                                  >
                                    {sc}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onUpdateState((prev) => ({
                                          ...prev,
                                          categories: prev.categories.map((c) =>
                                            c.name === cat.name
                                              ? {
                                                  ...c,
                                                  subCats: c.subCats.filter(
                                                    (s) => s !== sc
                                                  ),
                                                }
                                              : c
                                          ),
                                        }))
                                      }
                                      className="text-stone-400 hover:text-red-600 ml-0.5"
                                      aria-label={`Remove ${sc}`}
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateState((prev) => ({
                              ...prev,
                              categories: prev.categories.filter(
                                (_, i) => i !== idx
                              ),
                            }))
                          }
                          className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline self-start sm:self-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Category</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* HERO SLIDES (3+ SLIDES FULL CONTROL) */}
              {activeTab === 'hero' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h3 className="font-display text-xl font-bold text-stone-900">
                        Hero Banner Slides ({state.heroSlides.length})
                      </h3>
                      <p className="text-xs text-stone-500">
                        Customize all 3+ animated hero slides, headlines, CTA targets, and
                        images.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateState((prev) => ({
                          ...prev,
                          heroSlides: [
                            ...prev.heroSlides,
                            {
                              id: Date.now(),
                              img: '/src/assets/images/hero_modern_living_1795556293112.jpg',
                              kicker: 'New Season',
                              title: 'Curated essentials for modern life',
                              desc: 'Explore limited-batch craftsmanship built to last.',
                              btn: 'Shop Collection',
                              targetCategory: 'All',
                            },
                          ],
                        }))
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white"
                      style={{ backgroundColor: 'var(--primary)' }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Slide</span>
                    </button>
                  </div>

                  {state.heroSlides.map((slide, idx) => (
                    <div
                      key={slide.id || idx}
                      className="p-5 rounded-xl border border-stone-200 bg-white space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-stone-900">
                          Slide {idx + 1}
                        </span>
                        {state.heroSlides.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateState((prev) => ({
                                ...prev,
                                heroSlides: prev.heroSlides.filter(
                                  (_, i) => i !== idx
                                ),
                              }))
                            }
                            className="text-xs font-semibold text-red-600 hover:underline"
                          >
                            Remove Slide
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                        <div className="space-y-2">
                          <img
                            src={slide.img}
                            alt={slide.title}
                            referrerPolicy="no-referrer"
                            className="w-full aspect-video rounded-lg object-cover border border-stone-200 bg-stone-100"
                          />
                          <label className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-dashed border-stone-300 bg-stone-50 hover:bg-stone-100 text-xs font-semibold text-stone-700 cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const dataUrl = await resizeImageFile(file, 1400);
                                onUpdateState((prev) => ({
                                  ...prev,
                                  heroSlides: prev.heroSlides.map((s, i) =>
                                    i === idx ? { ...s, img: dataUrl } : s
                                  ),
                                }));
                                onNotify(`Slide ${idx + 1} image updated`);
                              }}
                            />
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload New Slide Image</span>
                          </label>
                        </div>

                        <div className="md:col-span-2 space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-stone-600 mb-1">
                                Kicker Label
                              </label>
                              <input
                                type="text"
                                value={slide.kicker}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  onUpdateState((prev) => ({
                                    ...prev,
                                    heroSlides: prev.heroSlides.map((s, i) =>
                                      i === idx ? { ...s, kicker: val } : s
                                    ),
                                  }));
                                }}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-stone-600 mb-1">
                                Target Category
                              </label>
                              <select
                                value={slide.targetCategory}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  onUpdateState((prev) => ({
                                    ...prev,
                                    heroSlides: prev.heroSlides.map((s, i) =>
                                      i === idx ? { ...s, targetCategory: val } : s
                                    ),
                                  }));
                                }}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 bg-white"
                              >
                                <option value="All">All Products</option>
                                {state.categories.map((c) => (
                                  <option key={c.name} value={c.name}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-stone-600 mb-1">
                              Headline
                            </label>
                            <input
                              type="text"
                              value={slide.title}
                              onChange={(e) => {
                                const val = e.target.value;
                                onUpdateState((prev) => ({
                                  ...prev,
                                  heroSlides: prev.heroSlides.map((s, i) =>
                                    i === idx ? { ...s, title: val } : s
                                  ),
                                }));
                              }}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block text-xs font-semibold text-stone-600 mb-1">
                                Description
                              </label>
                              <input
                                type="text"
                                value={slide.desc}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  onUpdateState((prev) => ({
                                    ...prev,
                                    heroSlides: prev.heroSlides.map((s, i) =>
                                      i === idx ? { ...s, desc: val } : s
                                    ),
                                  }));
                                }}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-stone-600 mb-1">
                                CTA Button Text
                              </label>
                              <input
                                type="text"
                                value={slide.btn}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  onUpdateState((prev) => ({
                                    ...prev,
                                    heroSlides: prev.heroSlides.map((s, i) =>
                                      i === idx ? { ...s, btn: val } : s
                                    ),
                                  }));
                                }}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* BRANDING */}
              {activeTab === 'branding' && (
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <h3 className="font-display text-xl font-bold text-stone-900">
                      Branding & Visual Theme
                    </h3>
                    <p className="text-xs text-stone-500">
                      Changes apply live to the storefront header, palette, and typography.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Store Name
                      </label>
                      <input
                        type="text"
                        value={state.settings.brandName}
                        onChange={(e) =>
                          onUpdateState((prev) => ({
                            ...prev,
                            settings: { ...prev.settings, brandName: e.target.value },
                          }))
                        }
                        className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Monogram Letter
                      </label>
                      <input
                        type="text"
                        maxLength={3}
                        value={state.settings.brandIcon}
                        onChange={(e) =>
                          onUpdateState((prev) => ({
                            ...prev,
                            settings: { ...prev.settings, brandIcon: e.target.value },
                          }))
                        }
                        className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Announcement Bar Text
                    </label>
                    <input
                      type="text"
                      value={state.settings.announcement}
                      onChange={(e) =>
                        onUpdateState((prev) => ({
                          ...prev,
                          settings: { ...prev.settings, announcement: e.target.value },
                        }))
                      }
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-300"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-display font-bold text-2xl overflow-hidden border border-stone-200"
                      style={{
                        backgroundColor: state.settings.brandIconUrl
                          ? 'transparent'
                          : state.settings.primary,
                      }}
                    >
                      {state.settings.brandIconUrl ? (
                        <img
                          src={state.settings.brandIconUrl}
                          alt="Brand logo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        state.settings.brandIcon
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const url = await resizeImageFile(file, 400);
                            onUpdateState((prev) => ({
                              ...prev,
                              settings: { ...prev.settings, brandIconUrl: url },
                            }));
                            onNotify('Logo uploaded');
                          }}
                        />
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Brand Logo</span>
                      </label>
                      {state.settings.brandIconUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateState((prev) => ({
                              ...prev,
                              settings: { ...prev.settings, brandIconUrl: '' },
                            }))
                          }
                          className="px-3 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          Remove Logo
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Primary Color
                      </label>
                      <input
                        type="color"
                        value={state.settings.primary}
                        onChange={(e) =>
                          onUpdateState((prev) => ({
                            ...prev,
                            settings: { ...prev.settings, primary: e.target.value },
                          }))
                        }
                        className="w-full h-11 rounded-lg border border-stone-300 cursor-pointer p-1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Accent Color
                      </label>
                      <input
                        type="color"
                        value={state.settings.accent}
                        onChange={(e) =>
                          onUpdateState((prev) => ({
                            ...prev,
                            settings: { ...prev.settings, accent: e.target.value },
                          }))
                        }
                        className="w-full h-11 rounded-lg border border-stone-300 cursor-pointer p-1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Body Font
                      </label>
                      <select
                        value={state.settings.font}
                        onChange={(e) =>
                          onUpdateState((prev) => ({
                            ...prev,
                            settings: { ...prev.settings, font: e.target.value },
                          }))
                        }
                        className="w-full h-11 px-3 text-xs rounded-lg border border-stone-300 bg-white"
                      >
                        <option value="'Plus Jakarta Sans', sans-serif">
                          Plus Jakarta Sans
                        </option>
                        <option value="'Poppins', sans-serif">Poppins</option>
                        <option value="'Manrope', sans-serif">Manrope</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Display Font
                      </label>
                      <select
                        value={state.settings.headFont}
                        onChange={(e) =>
                          onUpdateState((prev) => ({
                            ...prev,
                            settings: { ...prev.settings, headFont: e.target.value },
                          }))
                        }
                        className="w-full h-11 px-3 text-xs rounded-lg border border-stone-300 bg-white"
                      >
                        <option value="'Playfair Display', serif">
                          Playfair Display
                        </option>
                        <option value="'Cormorant Garamond', serif">
                          Cormorant Garamond
                        </option>
                        <option value="'Plus Jakarta Sans', sans-serif">
                          Plus Jakarta Sans
                        </option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onUpdateState((prev) => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          primary: '#234736',
                          accent: '#c87a48',
                          font: "'Plus Jakarta Sans', sans-serif",
                          headFont: "'Playfair Display', serif",
                        },
                      }));
                      onNotify('Theme restored to default');
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Colors & Fonts</span>
                  </button>
                </div>
              )}

              {/* ORDERS */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-display text-xl font-bold text-stone-900">
                      Customer Orders ({state.orders.length})
                    </h3>
                    <p className="text-xs text-stone-500">
                      Update order status here — customers see changes immediately in
                      their Account Order History.
                    </p>
                  </div>

                  {state.orders.length === 0 ? (
                    <div className="py-12 text-center border border-dashed border-stone-200 rounded-xl text-sm text-stone-500">
                      No orders placed yet. Try clicking Buy Now on any product!
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {state.orders.map((order) => (
                        <div
                          key={order.id}
                          className="p-5 rounded-xl border border-stone-200 bg-white space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <span className="font-mono text-sm font-bold text-stone-900">
                                {order.id}
                              </span>
                              <span className="text-xs text-stone-500 ml-2">
                                {order.date} · {order.source}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-stone-950 tabular-nums">
                                {state.settings.currency} {order.total.toLocaleString()}
                              </span>
                              <select
                                value={order.status}
                                onChange={(e) => {
                                  const nextStatus = e.target.value as OrderStatus;
                                  onUpdateState((prev) => ({
                                    ...prev,
                                    orders: prev.orders.map((o) =>
                                      o.id === order.id
                                        ? { ...o, status: nextStatus }
                                        : o
                                    ),
                                  }));
                                  onNotify(`Order ${order.id} marked ${nextStatus}`);
                                }}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-stone-300 bg-stone-50"
                              >
                                {(
                                  [
                                    'Pending',
                                    'Confirmed',
                                    'Processing',
                                    'Shipped',
                                    'Delivered',
                                    'Cancelled',
                                  ] as OrderStatus[]
                                ).map((st) => (
                                  <option key={st} value={st}>
                                    {st}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => {
                                  onUpdateState((prev) => ({
                                    ...prev,
                                    orders: prev.orders.filter((o) => o.id !== order.id),
                                  }));
                                  onNotify('Order removed');
                                }}
                                aria-label="Delete order"
                                className="p-1.5 text-stone-400 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="text-xs text-stone-600 space-y-1">
                            <p>
                              <strong className="text-stone-900">{order.name}</strong> ·{' '}
                              {order.phone}
                              {order.email ? ` · ${order.email}` : ''}
                            </p>
                            <p>
                              {order.address}, {order.city} ({order.paymentMethod})
                            </p>
                            <p className="text-stone-800 font-medium pt-1">
                              {order.items
                                .map((i) => `${i.name} × ${i.qty}`)
                                .join(', ')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* CUSTOMERS */}
              {activeTab === 'customers' && (
                <div className="space-y-4">
                  <h3 className="font-display text-xl font-bold text-stone-900">
                    Registered Customers ({state.customers.length})
                  </h3>

                  <div className="overflow-x-auto border border-stone-200 rounded-xl">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-stone-50 border-b border-stone-200 text-xs font-semibold text-stone-500 uppercase">
                        <tr>
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Email</th>
                          <th className="px-4 py-3">Phone</th>
                          <th className="px-4 py-3">Orders</th>
                          <th className="px-4 py-3">Wishlist</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {state.customers.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-4 py-8 text-center text-stone-500"
                            >
                              No registered customers yet.
                            </td>
                          </tr>
                        ) : (
                          state.customers.map((c) => {
                            const ordCount = state.orders.filter(
                              (o) =>
                                o.customerEmail?.toLowerCase() ===
                                  c.email.toLowerCase() || o.phone === c.phone
                            ).length;
                            return (
                              <tr key={c.id}>
                                <td className="px-4 py-3 font-semibold text-stone-900">
                                  {c.name}
                                </td>
                                <td className="px-4 py-3 text-stone-600">{c.email}</td>
                                <td className="px-4 py-3 text-stone-600 tabular-nums">
                                  {c.phone}
                                </td>
                                <td className="px-4 py-3 tabular-nums">{ordCount}</td>
                                <td className="px-4 py-3 tabular-nums">
                                  {c.wishlist?.length || 0}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SETTINGS & SINGLE HTML EXPORT */}
              {activeTab === 'settings' && (
                <div className="space-y-8 max-w-2xl">
                  <div className="space-y-4">
                    <h3 className="font-display text-xl font-bold text-stone-900">
                      Store Configuration
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                          WhatsApp Order Number
                        </label>
                        <input
                          type="text"
                          value={state.settings.whatsapp}
                          onChange={(e) =>
                            onUpdateState((prev) => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                whatsapp: e.target.value.replace(/\D/g, ''),
                              },
                            }))
                          }
                          className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-300"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                          Currency Symbol
                        </label>
                        <input
                          type="text"
                          value={state.settings.currency}
                          onChange={(e) =>
                            onUpdateState((prev) => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                currency: e.target.value,
                              },
                            }))
                          }
                          className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-300"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                          Free Delivery Threshold
                        </label>
                        <input
                          type="number"
                          value={state.settings.freeDeliveryThreshold}
                          onChange={(e) =>
                            onUpdateState((prev) => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                freeDeliveryThreshold: Number(e.target.value) || 0,
                              },
                            }))
                          }
                          className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-300"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                          Standard Delivery Fee
                        </label>
                        <input
                          type="number"
                          value={state.settings.deliveryFee}
                          onChange={(e) =>
                            onUpdateState((prev) => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                deliveryFee: Number(e.target.value) || 0,
                              },
                            }))
                          }
                          className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Single HTML Export */}
                  <div className="p-5 rounded-xl border border-stone-200 bg-stone-50 space-y-3">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-5 h-5 text-stone-800" />
                      <h4 className="font-semibold text-sm text-stone-900">
                        Single-File HTML Bundle
                      </h4>
                    </div>
                    <p className="text-xs text-stone-600">
                      Download or copy a complete single `.html` file with inline CSS,
                      JS, and all current products/images embedded for local hosting.
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        disabled={exporting}
                        onClick={() => handleExportSingleHtml('download')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white"
                        style={{ backgroundColor: 'var(--primary)' }}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Single .HTML</span>
                      </button>
                      <button
                        type="button"
                        disabled={exporting}
                        onClick={() => handleExportSingleHtml('copy')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-stone-300 bg-white text-xs font-semibold text-stone-800"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Full HTML Code</span>
                      </button>
                    </div>
                  </div>

                  {/* Traffic */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-stone-900">
                      Local Traffic Analytics
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-xl border border-stone-200">
                        <p className="text-xs text-stone-500">Total Visits</p>
                        <p className="text-xl font-bold tabular-nums">
                          {traffic.total || 0}
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl border border-stone-200">
                        <p className="text-xs text-stone-500">Today</p>
                        <p className="text-xl font-bold tabular-nums">
                          {traffic.daily?.[todayKey] || 0}
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl border border-stone-200">
                        <p className="text-xs text-stone-500">Orders</p>
                        <p className="text-xl font-bold tabular-nums">
                          {state.orders.length}
                        </p>
                      </div>
                    </div>
                    {last7Days.length > 0 && (
                      <div className="border border-stone-200 rounded-xl overflow-hidden">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-stone-50 border-b border-stone-200 text-stone-500">
                            <tr>
                              <th className="px-4 py-2">Date</th>
                              <th className="px-4 py-2">Visits</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100">
                            {last7Days.map(([d, count]) => (
                              <tr key={d}>
                                <td className="px-4 py-2 font-mono">{d}</td>
                                <td className="px-4 py-2 tabular-nums font-semibold">
                                  {count}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-stone-200">
                    <button
                      type="button"
                      onClick={onResetAll}
                      className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                    >
                      Reset Store Data to Seed Defaults
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
