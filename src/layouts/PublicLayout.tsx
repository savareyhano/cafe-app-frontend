import { Outlet, Link } from 'react-router';
import { useOrderStore } from '../store/useOrderStore';
import { useCartStore } from '../store/useCartStore';
import { ShoppingBag, ShoppingCart } from 'lucide-react';

export default function PublicLayout() {
  const activeOrderIds = useOrderStore((state) => state.activeOrderIds);
  const totalItems = useCartStore((state) => state.totalItems());
  const setIsCartOpen = useCartStore((state) => state.setIsCartOpen);

  return (
    <div className="min-h-screen bg-earth font-sans text-beige flex flex-col">
      {/* Public Header */}
      <header className="sticky top-0 z-50 bg-forest-dark border-b border-beige/10 p-4 shadow-xl">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl overflow-hidden border border-beige/25">
              <img src="/src/assets/images/logo.jpg" alt="Mirasa Coffee Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="font-serif text-lg tracking-widest text-white uppercase block leading-tight">Mirasa Coffee</span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#dfc6b3] block opacity-80">Order & Enjoy</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            {activeOrderIds.length > 0 && (
              <Link 
                to="/track"
                className="flex items-center gap-2 bg-wood hover:bg-wood-dark px-4 py-2 rounded-xl text-white font-mono text-xs tracking-widest uppercase transition-colors shadow-md relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                <ShoppingBag size={16} className="relative z-10" />
                <span className="hidden sm:inline relative z-10">Active Orders ({activeOrderIds.length})</span>
                <span className="sm:hidden relative z-10">({activeOrderIds.length})</span>
              </Link>
            )}

            {totalItems > 0 && (
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="flex items-center gap-2 bg-wood hover:bg-wood-dark px-4 py-2 rounded-xl text-white font-mono text-xs tracking-widest uppercase transition-colors shadow-md border border-wood-light/20"
              >
                <ShoppingCart size={16} />
                <span className="hidden sm:inline">Cart ({totalItems})</span>
                <span className="sm:hidden">({totalItems})</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full mx-auto bg-earth relative">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="py-6 border-t border-beige/10 text-center bg-forest-dark/50">
        <span className="font-mono text-[10px] tracking-widest text-beige/40 uppercase">
          &copy; {new Date().getFullYear()} Mirasa Coffee. All rights reserved.
        </span>
      </footer>
    </div>
  );
}
