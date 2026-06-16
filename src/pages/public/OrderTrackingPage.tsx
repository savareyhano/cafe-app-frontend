import React, { useEffect, useRef, useState } from 'react';
import { useOrderStore } from '../../store/useOrderStore';
import { useOrderQuery } from '../../lib/queries';
import { Link } from 'react-router';
import { ChevronLeft, Coffee, CheckCircle2, Clock, Volume2, VolumeX } from 'lucide-react';
import alarmSound from '../../assets/audio/alarm.mp3';

interface OrderStatusCardProps {
  orderId: string;
  onReadyChange: (id: string, isReady: boolean) => void;
}

const OrderStatusCard: React.FC<OrderStatusCardProps> = ({ orderId, onReadyChange }) => {
  const { data, isLoading } = useOrderQuery(orderId, 5000);
  const { removeOrderId } = useOrderStore();

  useEffect(() => {
    if (data?.data) {
      const status = data.data.status;
      if (status === 'paid') {
        removeOrderId(orderId);
      }
      onReadyChange(orderId, status === 'ready');
    }
  }, [data?.data?.status, orderId]);

  if (isLoading) {
    return (
      <div className="bg-forest-dark border border-beige/10 rounded-2xl p-6 animate-pulse">
        <div className="h-6 w-32 bg-earth-dark rounded mb-4"></div>
        <div className="h-20 w-full bg-earth-dark rounded"></div>
      </div>
    );
  }

  if (!data?.data) return null;

  const order = data.data;

  const getStatusDisplay = () => {
    switch (order.status) {
      case 'pending':
        return {
          icon: <Clock size={24} className="text-wood" />,
          title: 'Preparing Your Order',
          desc: 'Your order has been received. Please wait while we prepare your meal.',
          color: 'border-wood/50 bg-earth-dark'
        };
      case 'ready':
        return {
          icon: <CheckCircle2 size={24} className="text-green-500" />,
          title: 'Meal is Ready!',
          desc: 'Your meal is ready! Please pick it up at the counter.',
          color: 'border-green-500/50 bg-green-900/20 shadow-lg shadow-green-900/20 animate-pulse'
        };
      case 'served':
        return {
          icon: <Coffee size={24} className="text-beige" />,
          title: 'Meal Served',
          desc: 'Enjoy your meal! Please proceed to the cashier to complete your payment.',
          color: 'border-beige/30 bg-earth-dark'
        };
      case 'paid':
        return {
          icon: <CheckCircle2 size={24} className="text-beige/30" />,
          title: 'Order Completed',
          desc: 'Thank you for your visit!',
          color: 'border-beige/10 bg-transparent text-beige/50'
        };
      default:
        return {
          icon: <Clock size={24} />,
          title: 'Unknown Status',
          desc: 'Please check with staff.',
          color: 'border-beige/10 text-beige'
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className={`border-2 rounded-2xl p-6 transition-all duration-500 ${statusDisplay.color}`}>
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-black/20 rounded-xl shadow-inner border border-beige/5">
            {statusDisplay.icon}
          </div>
          <div>
            <h3 className="font-serif text-2xl text-white">{statusDisplay.title}</h3>
            <span className="font-mono text-xs uppercase tracking-widest text-beige/70">Table {order.tableNumber} • {order.customerName}</span>
          </div>
        </div>
      </div>
      
      <p className="text-sm font-sans mb-6 leading-relaxed text-beige/90">{statusDisplay.desc}</p>
      
      <div className="bg-black/20 rounded-xl p-4 border border-beige/10">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-mono text-[10px] uppercase tracking-widest opacity-50">Order Details</h4>
          {order.customerPhoneNumber && (
            <span className="font-mono text-[10px] tracking-widest opacity-50">📞 {order.customerPhoneNumber}</span>
          )}
        </div>
        <div className="space-y-3 mb-4">
          {order.orderItems?.map((item: any) => (
            <div key={item.id} className="flex flex-col text-sm font-sans">
              <div className="flex justify-between items-start">
                <span className="font-serif">{item.quantity}x {item.menuItems?.name}</span>
                <span className="font-mono text-xs text-wood">Rp {(item.priceAtOrder * item.quantity).toLocaleString()}</span>
              </div>
              {item.note && <span className="text-xs text-beige/50 italic pl-5 mt-1">Note: {item.note}</span>}
            </div>
          ))}
        </div>
        <div className="pt-3 border-t border-beige/10 flex justify-between items-center text-sm">
          <span className="font-mono uppercase tracking-widest text-wood">Grand Total</span>
          <span className="font-mono font-bold text-wood">Rp {order.total?.toLocaleString() || 0}</span>
        </div>
      </div>
    </div>
  );
}

export default function OrderTrackingPage() {
  const { activeOrderIds } = useOrderStore();
  const [readyOrders, setReadyOrders] = useState<Record<string, boolean>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioError, setAudioError] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  const hasReadyOrder = Object.values(readyOrders).some(v => v);

  useEffect(() => {
    if (hasReadyOrder && !isAudioMuted) {
      if (audioRef.current) {
        audioRef.current.play().catch((err) => {
          console.error("Audio autoplay blocked:", err);
          setAudioError(true);
        });
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [hasReadyOrder, isAudioMuted]);

  const handleReadyChange = (id: string, isReady: boolean) => {
    setReadyOrders(prev => {
      if (prev[id] === isReady) return prev;
      return { ...prev, [id]: isReady };
    });
  };

  const handleEnableAudio = () => {
    if (audioRef.current) {
      audioRef.current.play()
        .then(() => {
          setAudioError(false);
        })
        .catch(console.error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 md:px-6">
      <audio ref={audioRef} src={alarmSound} loop />
      
      <div className="flex items-center justify-between mb-8">
        <Link to="/" className="flex items-center gap-2 text-beige/50 hover:text-wood font-mono text-xs uppercase tracking-widest transition-colors">
          <ChevronLeft size={16} /> Back to Menu
        </Link>
        
        {hasReadyOrder && (
          <button 
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-wood hover:text-wood-dark transition-colors px-3 py-1.5 border border-wood/30 rounded-lg bg-wood/10"
          >
            {isAudioMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            {isAudioMuted ? 'Unmute Alarm' : 'Mute Alarm'}
          </button>
        )}
      </div>

      <h1 className="font-serif text-4xl text-white font-light mb-8">Order Status</h1>

      {audioError && hasReadyOrder && !isAudioMuted && (
        <div className="mb-8 p-4 bg-wood/10 border border-wood/30 rounded-xl flex items-center justify-between">
          <span className="text-sm font-sans text-wood">Browser blocked audio alarm. Please enable it to hear when your order is ready.</span>
          <button 
            onClick={handleEnableAudio}
            className="px-4 py-2 bg-wood text-white rounded-lg text-xs font-mono uppercase tracking-widest hover:bg-wood-dark"
          >
            Enable Sound
          </button>
        </div>
      )}

      {activeOrderIds.length === 0 ? (
        <div className="text-center py-20 bg-forest-dark border border-beige/10 rounded-3xl">
          <Coffee size={48} className="mx-auto text-beige/20 mb-4" />
          <h2 className="font-serif text-2xl text-white mb-2">No Active Orders</h2>
          <p className="font-sans text-sm text-beige/60 mb-6">You don't have any orders currently being prepared.</p>
          <Link to="/" className="inline-block px-6 py-3 bg-wood hover:bg-wood-dark text-white rounded-xl font-mono text-xs uppercase tracking-widest transition-all">
            Browse Menu
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {activeOrderIds.map(id => (
            <OrderStatusCard key={id} orderId={id} onReadyChange={handleReadyChange} />
          ))}
        </div>
      )}
    </div>
  );
}
