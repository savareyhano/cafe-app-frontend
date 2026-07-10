import React, { useState } from 'react';
import { useCartStore } from '../../store/useCartStore';
import { useAddOrderMutation } from '../../lib/mutations';
import { useOrderStore } from '../../store/useOrderStore';
import { useNavigate } from 'react-router';
import { Plus, Minus, ShoppingCart, X } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';

const checkoutSchema = z.object({
  customerName: z.string().min(1, 'Name is required'),
  customerPhone: z.string().min(1, 'Phone number is required'),
  tableNumber: z.string().min(1, 'Table number is required'),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function CartSidebar() {
  const navigate = useNavigate();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState<CheckoutFormValues | null>(null);

  const addOrderMutation = useAddOrderMutation();
  const { addOrderId, activeOrderIds } = useOrderStore();
  const cart = useCartStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema) as any,
    defaultValues: {
      customerName: cart.customerName,
      customerPhone: cart.customerPhone,
      tableNumber: cart.tableNumber,
    }
  });

  const grandTotal = cart.subtotal();

  const executeOrder = (formData: CheckoutFormValues) => {
    // Persist details to store so it isn't lost
    cart.setCustomerName(formData.customerName);
    cart.setCustomerPhone(formData.customerPhone);
    cart.setTableNumber(formData.tableNumber);

    const payload = {
      customerName: formData.customerName,
      customerPhoneNumber: formData.customerPhone,
      tableNumber: parseInt(formData.tableNumber, 10),
      orderItems: cart.items.map((i) => ({
        menuItemId: i.menuItemId,
        quantity: i.quantity,
        note: i.note?.trim() || undefined,
      })),
    };

    addOrderMutation.mutate(payload as any, {
      onSuccess: (res: any) => {
        const newOrderId = res.data.orderId;
        addOrderId(newOrderId);
        cart.clearCart();
        reset();
        cart.setIsOpen(false);
        setIsConfirmModalOpen(false);
        setPendingOrderData(null);
        navigate('/track');
      },
      onError: () => {
        toast.error('Failed to place order. Please try again.');
        setIsConfirmModalOpen(false);
      }
    });
  };

  const onSubmit = (data: CheckoutFormValues) => {
    if (cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (activeOrderIds.length > 0) {
      setPendingOrderData(data);
      setIsConfirmModalOpen(true);
      return;
    }

    executeOrder(data);
  };

  return (
    <>
      {/* Cart Sidebar / Drawer */}
      <div className={`
        fixed inset-y-0 right-0 z-50 w-full md:w-[400px] lg:w-[350px] xl:w-[400px] bg-forest-dark border-l border-beige/10 transform transition-transform duration-300 ease-in-out flex flex-col h-full shadow-2xl
        ${cart.isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Close Button */}
        <div className="flex items-center justify-between p-4 border-b border-beige/10 bg-forest-dark sticky top-0 z-10">
          <h2 className="font-serif text-xl text-white">Order Summary</h2>
          <button type="button" onClick={() => cart.setIsOpen(false)} className="p-2 text-beige/50 hover:text-white bg-earth-dark rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-forest-dark flex flex-col">
          {/* Customer Details */}
          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-beige/60 mb-2">Customer Name</label>
              <input 
                type="text" 
                placeholder="Enter your name"
                {...register('customerName')}
                className="w-full bg-earth-dark border border-beige/10 rounded-xl px-4 py-2.5 text-sm text-beige focus:outline-none focus:border-wood transition-colors"
              />
              {errors.customerName && <p className="text-red-400 text-xs mt-1">{errors.customerName.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-beige/60 mb-2">Phone Number</label>
                <input 
                  type="text" 
                  placeholder="e.g. 0812..."
                  {...register('customerPhone')}
                  className="w-full bg-earth-dark border border-beige/10 rounded-xl px-4 py-2.5 text-sm text-beige focus:outline-none focus:border-wood transition-colors"
                />
                {errors.customerPhone && <p className="text-red-400 text-xs mt-1">{errors.customerPhone.message}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-beige/60 mb-2">Table No.</label>
                <input 
                  type="text" 
                  placeholder="E.g. 12"
                  {...register('tableNumber')}
                  className="w-full bg-earth-dark border border-beige/10 rounded-xl px-4 py-2.5 text-sm text-beige focus:outline-none focus:border-wood transition-colors"
                />
                {errors.tableNumber && <p className="text-red-400 text-xs mt-1">{errors.tableNumber.message}</p>}
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg text-white">Order Items</h3>
              {cart.items.length > 0 && (
                <button type="button" onClick={cart.clearCart} className="text-[10px] font-mono text-red-400 uppercase tracking-widest hover:text-red-300">
                  Clear
                </button>
              )}
            </div>

            {cart.items.length === 0 ? (
              <div className="text-center py-8 text-beige/40 font-mono text-xs border border-dashed border-beige/10 rounded-xl">
                Cart is empty
              </div>
            ) : (
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <div key={item.menuItemId} className="flex gap-4 p-3 bg-earth-dark rounded-xl border border-beige/5">
                    <div className="w-16 h-16 rounded-lg bg-forest overflow-hidden flex-shrink-0">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] font-mono text-beige/30">No Img</div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <h4 className="font-serif text-sm text-white line-clamp-1">{item.name}</h4>
                        <button type="button" onClick={() => cart.removeItem(item.menuItemId)} className="text-beige/40 hover:text-red-400">
                          <X size={14} />
                        </button>
                      </div>
                      <input 
                        type="text"
                        placeholder="Add note (optional)..."
                        value={item.note || ''}
                        onChange={(e) => cart.updateNote(item.menuItemId, e.target.value)}
                        className="w-full bg-transparent border-b border-beige/10 text-[10px] font-sans text-beige/80 placeholder-beige/30 focus:outline-none focus:border-wood py-1 mt-1"
                      />
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-mono text-wood text-xs">Rp {item.price.toLocaleString()}</span>
                        <div className="flex items-center gap-3 bg-forest rounded-lg px-2 py-1">
                          <button type="button" onClick={() => cart.updateQuantity(item.menuItemId, -1)} className="text-beige/60 hover:text-white"><Minus size={12} /></button>
                          <span className="font-mono text-xs text-white w-4 text-center">{item.quantity}</span>
                          <button type="button" onClick={() => cart.updateQuantity(item.menuItemId, 1)} className="text-beige/60 hover:text-white"><Plus size={12} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Summary */}
          {cart.items.length > 0 && (
            <div className="mt-auto pt-6 border-t border-beige/10 space-y-3">
              <div className="flex justify-between text-sm font-mono text-wood pt-3">
                <span className="uppercase tracking-widest">Grand Total</span>
                <span className="font-bold">Rp {grandTotal.toLocaleString()}</span>
              </div>
              <button
                type="submit"
                disabled={addOrderMutation.isPending}
                className="w-full mt-6 py-3.5 bg-wood hover:bg-wood-dark text-white rounded-xl font-mono text-sm uppercase tracking-widest transition-all shadow-lg shadow-wood/20 disabled:opacity-50"
              >
                {addOrderMutation.isPending ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Multi-Order Confirmation Modal */}
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent className="bg-earth-dark border border-beige/10 text-beige sm:max-w-md" aria-describedby="confirm-dialog-description">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-light text-white">Active Orders Found</DialogTitle>
            <DialogDescription id="confirm-dialog-description" className="sr-only">
              Confirmation modal for placing another order when active orders exist.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="font-sans text-sm text-beige/80">
              You already have <strong className="text-wood">{activeOrderIds.length}</strong> active order(s) currently being processed.
            </p>
            <p className="font-sans text-sm text-beige/80 mt-2">
              Are you sure you want to place another separate order?
            </p>
          </div>
          <DialogFooter className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setIsConfirmModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-beige/10 hover:bg-forest text-xs font-mono uppercase tracking-widest transition-colors w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => pendingOrderData && executeOrder(pendingOrderData)}
              disabled={addOrderMutation.isPending}
              className="px-4 py-2 bg-wood hover:bg-wood-dark text-white rounded-lg text-xs font-mono uppercase tracking-widest transition-colors disabled:opacity-50 w-full sm:w-auto"
            >
              Yes, Place Order
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
