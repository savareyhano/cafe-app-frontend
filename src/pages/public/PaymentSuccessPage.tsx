import { Navigate, Link } from 'react-router';
import { CheckCircle2, ArrowRight, Utensils } from 'lucide-react';
import { useOrderStore } from '../../store/useOrderStore';

export default function PaymentSuccessPage() {
  const { activeOrderIds } = useOrderStore();

  // Prevent users from accessing this page if they haven't placed an order
  if (activeOrderIds.length === 0) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6 mt-16 lg:mt-24">
      <div className="max-w-md w-full bg-forest-light border border-wood-light/20 p-8 rounded-2xl shadow-xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={40} className="text-green-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-beige font-serif mb-4">
          Payment Successful!
        </h1>
        
        <p className="text-beige/70 font-sans mb-8">
          Thank you for your order! Your payment has been confirmed and our kitchen is preparing your order right now.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <Link
            to="/track"
            className="flex-1 flex items-center justify-center gap-2 bg-wood hover:bg-wood-dark px-6 py-3 rounded-xl text-white font-mono text-sm tracking-widest uppercase transition-colors shadow-md"
          >
            <span>Track Order</span>
            <ArrowRight size={16} />
          </Link>
          
          <Link
            to="/"
            className="flex-1 flex items-center justify-center gap-2 bg-transparent hover:bg-forest px-6 py-3 rounded-xl text-beige border border-wood/50 font-mono text-sm tracking-widest uppercase transition-colors shadow-md"
          >
            <Utensils size={16} />
            <span>Menu</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
