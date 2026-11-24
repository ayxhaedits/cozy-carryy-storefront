import React, { useEffect, useState } from 'react';
import { Heart, Minus, Plus, ShoppingBag, Star, X, Zap } from 'lucide-react';
import { Product } from '../types/store';

interface ProductModalProps {
  product: Product | null;
  currency: string;
  isWishlisted: boolean;
  onClose: () => void;
  onToggleWishlist: (id: number) => void;
  onAddToCart: (id: number, qty: number) => void;
  onBuyNow: (product: Product, qty: number) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  currency,
  isWishlisted,
  onClose,
  onToggleWishlist,
  onAddToCart,
  onBuyNow,
}) => {
  const [selectedImg, setSelectedImg] = useState<string>('');
  const [qty, setQty] = useState<number>(1);

  useEffect(() => {
    if (product) {
      setSelectedImg(product.coverImage || product.images[0] || '');
      setQty(1);
    }
  }, [product]);

  if (!product) return null;

  const images =
    product.images && product.images.length > 0
      ? product.images
      : product.coverImage
      ? [product.coverImage]
      : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 animate-fade-up max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close product details"
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left: Multi-Image Gallery */}
        <div className="bg-stone-100 p-5 sm:p-6 flex flex-col gap-3">
          <div className="aspect-square rounded-xl overflow-hidden bg-white border border-stone-200">
            {selectedImg ? (
              <img
                src={selectedImg}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-opacity duration-200"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-stone-400 text-sm">
                No image available
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2.5">
              {images.slice(0, 4).map((img, i) => (
                <button
                  key={`${img}-${i}`}
                  type="button"
                  onClick={() => setSelectedImg(img)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImg === img
                      ? 'border-stone-900 ring-1 ring-stone-900'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} view ${i + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Contiguous Purchase Module */}
        <div className="p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500 uppercase tracking-wider font-medium mb-2">
              <span>{product.category}</span>
              {product.subCat && (
                <>
                  <span aria-hidden="true">/</span>
                  <span>{product.subCat}</span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span className={product.inStock ? 'text-emerald-700' : 'text-red-600'}>
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 mb-3">
              {product.name}
            </h2>

            <div className="flex items-center gap-2 text-sm text-stone-600 mb-5">
              <div className="flex items-center gap-0.5 text-amber-500">
                <Star className="w-4 h-4 fill-amber-500" />
                <span className="font-semibold text-stone-900 ml-1 tabular-nums">
                  {product.rating}
                </span>
              </div>
              <span aria-hidden="true">·</span>
              <span>Verified Quality</span>
            </div>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-2xl sm:text-3xl font-bold text-stone-950 tabular-nums">
                {currency} {product.price.toLocaleString()}
              </span>
              {product.oldPrice && product.oldPrice > product.price && (
                <span className="text-base text-stone-400 line-through tabular-nums">
                  {currency} {product.oldPrice.toLocaleString()}
                </span>
              )}
            </div>

            <p className="text-sm sm:text-base text-stone-600 leading-relaxed mb-6">
              {product.desc || 'Crafted for reliable daily performance.'}
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-stone-700">Quantity</span>
              <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="p-2.5 text-stone-600 hover:text-stone-950"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center text-sm font-semibold tabular-nums">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  className="p-2.5 text-stone-600 hover:text-stone-950"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={!product.inStock}
                onClick={() => {
                  onAddToCart(product.id, qty);
                  onClose();
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-900 font-semibold text-sm transition-colors disabled:opacity-50"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>

              <button
                type="button"
                disabled={!product.inStock}
                onClick={() => {
                  onBuyNow(product, qty);
                  onClose();
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-95 disabled:opacity-50"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                <Zap className="w-4 h-4" />
                <span>Buy Now</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleWishlist(product.id)}
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                className={`p-3 rounded-lg border transition-colors ${
                  isWishlisted
                    ? 'border-red-200 bg-red-50 text-red-600'
                    : 'border-stone-200 bg-white text-stone-500 hover:text-red-500'
                }`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
