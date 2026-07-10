import React, { useState } from 'react';
import { useMenuItemsQuery as useItemsQuery } from '../../lib/queries';
import { useCartStore } from '../../store/useCartStore';
import { Search, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState<'All' | 'food' | 'drink'>('All');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useItemsQuery(1, 100, search, 'name', 'asc'); // Fetch all for simple public display
  const cart = useCartStore();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const filteredItems = data?.data?.filter((item: any) => {
    if (activeCategory !== 'All' && item.type !== activeCategory) return false;
    return true;
  });

  const handleAddToCart = (item: any) => {
    cart.addItem({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      imageUrl: item.imageUrl,
    });
    toast.success(`Added ${item.name} to cart`);
  };

  const categories = ['All', 'food', 'drink'];

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
      {/* Main Content Area */}
      <div className="flex-1 p-4 md:p-6 lg:p-8 pb-32 lg:pb-16">
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="font-serif text-3xl font-light text-white">Menu</h1>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-beige/40" size={18} />
            <input
              type="text"
              placeholder="Search foods..."
              value={search}
              onChange={handleSearch}
              className="w-full bg-forest border border-beige/10 rounded-xl py-2 pl-10 pr-4 text-sm text-beige focus:outline-none focus:border-wood transition-colors"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat as any)}
              className={`px-6 py-2 rounded-xl font-mono text-xs tracking-widest uppercase transition-all whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-wood text-white shadow-lg shadow-wood/20'
                  : 'bg-forest text-beige/70 hover:bg-forest-light hover:text-beige border border-beige/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-beige/50 font-mono text-sm">
            Loading menu...
          </div>
        ) : filteredItems?.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-beige/50 font-mono text-sm">
            No items found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredItems?.map((item: any) => (
              <div key={item.id} className="bg-forest-dark border border-beige/10 rounded-2xl overflow-hidden hover:border-wood/50 transition-all group flex flex-col h-full">
                <div className="h-48 bg-forest relative overflow-hidden">
                  {item.imageUrl ? (
                    <img 
                      src={`${item.imageUrl}${item.imageUrl.includes('?') ? '&' : '?'}v=${new Date(item.updatedAt).getTime()}`}
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-beige/20 font-mono text-xs">No Image</div>
                  )}
                  <div className="absolute top-3 left-3 bg-earth-dark/80 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-mono uppercase tracking-widest text-beige/90 border border-beige/10">
                    {item.type}
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-serif text-xl text-white mb-1 line-clamp-1">{item.name}</h3>
                  <p className="font-mono text-wood text-sm mb-4">Rp {item.price.toLocaleString()}</p>
                  {item.description && (
                    <p className="text-xs text-beige/50 line-clamp-2 mb-4 font-sans leading-relaxed flex-1">
                      {item.description}
                    </p>
                  )}
                  <button
                    onClick={() => handleAddToCart(item)}
                    className="w-full py-2.5 mt-auto bg-forest border border-beige/10 hover:bg-wood hover:border-wood text-white rounded-xl font-mono text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 group-hover:bg-wood"
                  >
                    <Plus size={14} /> Add to cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
