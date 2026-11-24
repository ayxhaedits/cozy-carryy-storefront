import React from 'react';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { CartItem, Product, StoreSettings } from '../types/store';

interface CartDrawerProps {
  open: boolean;
  cart: CartItem[];
  products: Product[];
  settings: StoreSettings;
  onClose: () => void;
  onUpdateQty: (id: number, delta: number) => void;
  onRemoveItem: (id: number) => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  open,
  cart,
  products,
  settings,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onCheckout,
}) => {
  if (!open) return null;

  const lineItems = cart
    .map((item) => {
      const product = products.find((p) => p.id === item.id);
      return product ? { product, qty: item.qty } : null;
    })
    .filter((x): x is { product: Product; qty: number } => x !== null);

  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.product.price * item.qty,
    0
  );
  const qualifiesFree = subtotal >= settings.freeDeliveryThreshold;
  const remainingForFree = Math.max(0, settings.freeDeliveryThreshold - subtotal);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-stone-950/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <aside className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-stone-800" />
            <h3 className="font-display text-xl font-bold text-stone-900">
              Shopping Cart
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="p-2 text-stone-500 hover:text-stone-900 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Delivery Progress */}
        {lineItems.length > 0 && (
          <div className="px-6 py-3 bg-stone-50 border-b border-stone-200 text-xs text-stone-600">
            {qualifiesFree ? (
              <span className="font-medium text-emerald-700">
                Your order qualifies for complimentary free delivery.
              </span>
            ) : (
              <span>
                Add{' '}
                <strong className="tabular-nums text-stone-900">
                  {settings.currency} {remainingForFree.toLocaleString()}
                </strong>{' '}
                more for free delivery.
              </span>
            )}
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {lineItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <ShoppingBag className="w-12 h-12 text-stone-300 mb-3" />
              <p className="text-base font-medium text-stone-800 mb-1">
                Your cart is empty
              </p>
              <p className="text-sm text-stone-500">
                Add items from the collection to place an order.
              </p>
            </div>
          ) : (
            lineItems.map(({ product, qty }) => (
              <div
                key={product.id}
                className="flex gap-4 pb-5 border-b border-stone-100 last:border-b-0"
              >
                <img
                  src={product.coverImage || product.images[0]}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-xl object-cover bg-stone-100 border border-stone-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-stone-900 truncate">
                    {product.name}
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {product.category}
                    {product.subCat ? ` · ${product.subCat}` : ''}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="inline-flex items-center border border-stone-200 rounded-lg bg-stone-50">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(product.id, -1)}
                        className="p-1.5 text-stone-600 hover:text-stone-950"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2.5 text-xs font-semibold tabular-nums">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQty(product.id, 1)}
                        className="p-1.5 text-stone-600 hover:text-stone-950"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-stone-900 tabular-nums">
                      {settings.currency} {(product.price * qty).toLocaleString()}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveItem(product.id)}
                  aria-label={`Remove ${product.name}`}
                  className="self-start p-1.5 text-stone-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-stone-200 bg-stone-50/70 space-y-4">
          <div className="flex items-center justify-between text-base font-bold text-stone-900">
            <span>Subtotal</span>
            <span className="tabular-nums text-lg">
              {settings.currency} {subtotal.toLocaleString()}
            </span>
          </div>
          <button
            type="button"
            disabled={lineItems.length === 0}
            onClick={onCheckout}
            className="w-full py-3.5 px-6 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-40"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            Proceed to Checkout
          </button>
        </div>
      </aside>
    </div>
  );
};
