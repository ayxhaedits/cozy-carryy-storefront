import React, { useEffect, useState } from 'react';
import { CheckCircle2, MessageCircle, Minus, Plus, Truck, X } from 'lucide-react';
import { Customer, Order, OrderItem, Product, StoreSettings } from '../types/store';

export interface CheckoutTarget {
  mode: 'buyNow' | 'cart';
  buyNowProduct?: Product;
  buyNowQty?: number;
}

interface CheckoutModalProps {
  target: CheckoutTarget | null;
  cartItems: { product: Product; qty: number }[];
  settings: StoreSettings;
  currentCustomer: Customer | null;
  onClose: () => void;
  onPlaceOrder: (order: Order, clearCart: boolean) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  target,
  cartItems,
  settings,
  currentCustomer,
  onClose,
  onPlaceOrder,
}) => {
  const [directQty, setDirectQty] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash on Delivery' | 'WhatsApp Order'>(
    'Cash on Delivery'
  );
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (target) {
      setConfirmedOrder(null);
      setDirectQty(target.buyNowQty || 1);
      setName(currentCustomer?.name || '');
      setPhone(currentCustomer?.phone || '');
      setEmail(currentCustomer?.email || '');
      setAddress(currentCustomer?.address || '');
      setCity(currentCustomer?.city || '');
      setNotes('');
    }
  }, [target, currentCustomer]);

  if (!target) return null;

  const items: OrderItem[] =
    target.mode === 'buyNow' && target.buyNowProduct
      ? [
          {
            productId: target.buyNowProduct.id,
            name: target.buyNowProduct.name,
            qty: directQty,
            price: target.buyNowProduct.price,
            image: target.buyNowProduct.coverImage || target.buyNowProduct.images[0],
          },
        ]
      : cartItems.map((c) => ({
          productId: c.product.id,
          name: c.product.name,
          qty: c.qty,
          price: c.product.price,
          image: c.product.coverImage || c.product.images[0],
        }));

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const deliveryFee =
    subtotal >= settings.freeDeliveryThreshold || subtotal === 0
      ? 0
      : settings.deliveryFee;
  const total = subtotal + deliveryFee;

  const buildWhatsAppLink = (order: Order) => {
    let msg = `*New Order (${order.id})*%0A`;
    msg += `*Customer:* ${encodeURIComponent(order.name)}%0A`;
    msg += `*Phone:* ${encodeURIComponent(order.phone)}%0A`;
    if (order.email) msg += `*Email:* ${encodeURIComponent(order.email)}%0A`;
    msg += `*Address:* ${encodeURIComponent(order.address)}, ${encodeURIComponent(order.city)}%0A`;
    if (order.notes) msg += `*Notes:* ${encodeURIComponent(order.notes)}%0A`;
    msg += `%0A*Items:*%0A`;
    order.items.forEach((i) => {
      msg += `• ${encodeURIComponent(i.name)} × ${i.qty} — ${settings.currency} ${(
        i.price * i.qty
      ).toLocaleString()}%0A`;
    });
    msg += `%0A*Delivery:* ${
      order.deliveryFee === 0
        ? 'Free'
        : `${settings.currency} ${order.deliveryFee.toLocaleString()}`
    }`;
    msg += `%0A*Total:* ${settings.currency} ${order.total.toLocaleString()}`;
    return `https://wa.me/${settings.whatsapp}?text=${msg}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    const order: Order = {
      id: 'CC-' + Math.floor(100000 + Math.random() * 900000),
      date: new Date().toLocaleString(),
      customerEmail: currentCustomer?.email || email.trim() || undefined,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: address.trim(),
      city: city.trim(),
      notes: notes.trim() || undefined,
      paymentMethod,
      items,
      subtotal,
      deliveryFee,
      total,
      status: 'Pending',
      source: target.mode === 'buyNow' ? 'Direct Buy Now' : 'Cart Checkout',
    };

    onPlaceOrder(order, target.mode === 'cart');
    setConfirmedOrder(order);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-display text-2xl font-bold text-stone-900">
              {confirmedOrder ? 'Order Confirmed' : 'Customer Information & Checkout'}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {confirmedOrder
                ? 'Your order has been saved and can be tracked from your account.'
                : target.mode === 'buyNow'
                ? 'Direct Express Checkout'
                : 'Cart Order Summary'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close checkout"
            className="p-2 text-stone-500 hover:text-stone-900 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {confirmedOrder ? (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-start gap-4 p-5 rounded-xl bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-emerald-950 text-base">
                  Order #{confirmedOrder.id} Placed — Status: {confirmedOrder.status}
                </h3>
                <p className="text-sm text-emerald-800 mt-1">
                  Thank you, {confirmedOrder.name}. Delivery to {confirmedOrder.address},{' '}
                  {confirmedOrder.city}.
                </p>
              </div>
            </div>

            <div className="border border-stone-200 rounded-xl divide-y divide-stone-100">
              {confirmedOrder.items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <span className="text-stone-800">
                    {item.name}{' '}
                    <span className="text-stone-500 tabular-nums">× {item.qty}</span>
                  </span>
                  <span className="font-semibold text-stone-900 tabular-nums">
                    {settings.currency} {(item.price * item.qty).toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between px-4 py-3 text-sm text-stone-600">
                <span>Delivery</span>
                <span className="tabular-nums">
                  {confirmedOrder.deliveryFee === 0
                    ? 'Free'
                    : `${settings.currency} ${confirmedOrder.deliveryFee.toLocaleString()}`}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3.5 text-base font-bold text-stone-950 bg-stone-50">
                <span>Total Payable ({confirmedOrder.paymentMethod})</span>
                <span className="tabular-nums">
                  {settings.currency} {confirmedOrder.total.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={buildWhatsAppLink(confirmedOrder)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Send Confirmation on WhatsApp</span>
              </a>
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-6 rounded-lg border border-stone-300 text-stone-800 hover:bg-stone-50 font-semibold text-sm"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {/* Order Summary Strip */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-stone-500">
                <span>Order Items ({items.length})</span>
                <span className="inline-flex items-center gap-1 text-stone-600 normal-case">
                  <Truck className="w-3.5 h-3.5" />
                  {deliveryFee === 0
                    ? 'Free delivery applied'
                    : `Delivery: ${settings.currency} ${deliveryFee}`}
                </span>
              </div>

              <div className="space-y-2.5">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 rounded-lg object-cover border border-stone-200 shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-stone-900 truncate">{item.name}</p>
                        <p className="text-xs text-stone-500 tabular-nums">
                          {settings.currency} {item.price.toLocaleString()} each
                        </p>
                      </div>
                    </div>

                    {target.mode === 'buyNow' ? (
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="inline-flex items-center border border-stone-200 rounded-lg bg-white">
                          <button
                            type="button"
                            onClick={() => setDirectQty((q) => Math.max(1, q - 1))}
                            className="p-1.5 text-stone-600 hover:text-stone-950"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2.5 text-xs font-semibold tabular-nums">
                            {directQty}
                          </span>
                          <button
                            type="button"
                            onClick={() => setDirectQty((q) => q + 1)}
                            className="p-1.5 text-stone-600 hover:text-stone-950"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="font-bold text-stone-900 tabular-nums">
                          {settings.currency} {(item.price * directQty).toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <span className="font-semibold text-stone-900 tabular-nums shrink-0">
                        × {item.qty} · {settings.currency}{' '}
                        {(item.price * item.qty).toLocaleString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-2.5 border-t border-stone-200 flex items-center justify-between text-base font-bold text-stone-950">
                <span>Total</span>
                <span className="tabular-nums">
                  {settings.currency} {total.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Customer Details Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ali Raza"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0300 1234567"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Email Address (for order tracking)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Lahore, Karachi, Islamabad..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Complete Delivery Address *
              </label>
              <textarea
                required
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House / Street / Sector / Landmark"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Cash on Delivery', 'WhatsApp Order'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2.5 px-3 rounded-lg text-xs font-semibold border transition-colors ${
                        paymentMethod === method
                          ? 'border-stone-900 bg-stone-900 text-white'
                          : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Delivery Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Call before arriving..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-95"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              Confirm & Place Order ({settings.currency} {total.toLocaleString()})
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
