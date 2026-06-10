import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router';
import { Menu, X, LogOut, Coffee, ShoppingBag, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useLogoutMutation } from '../lib/mutations';

export default function CmsLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuthStore();
  const logoutMutation = useLogoutMutation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => navigate('/cms/login')
    });
  };

  const navItems = [
    { name: 'Menu Items', to: '/cms/menu', icon: <Coffee size={18} /> },
    { name: 'Orders', to: '/cms/orders', icon: <ShoppingBag size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-earth-dark text-beige font-sans selection:bg-wood selection:text-beige flex flex-col md:flex-row">
      
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-forest-dark border-b border-beige/10 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-forest-light to-wood flex items-center justify-center border border-beige/25">
            <span className="font-serif text-sm font-bold text-beige tracking-wide">M</span>
          </div>
          <span className="font-serif text-sm tracking-widest text-beige uppercase">Mirasa CMS</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-beige p-2 hover:bg-forest/50 rounded-md transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 bg-forest-dark border-r border-beige/10 transform transition-transform duration-300 ease-in-out flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Sidebar Header (Desktop) */}
        <div className="hidden md:flex items-center gap-3 p-6 border-b border-beige/10">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-forest-light to-wood flex items-center justify-center border border-beige/25">
            <span className="font-serif text-lg font-bold text-beige tracking-wide">M</span>
          </div>
          <div>
            <span className="font-serif text-base tracking-widest text-beige uppercase block">Mirasa</span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#dfc6b3] block opacity-80">CMS Portal</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl font-mono text-xs uppercase tracking-widest transition-all
                ${isActive 
                  ? 'bg-wood text-white shadow-md opacity-100' 
                  : 'text-beige opacity-60 hover:bg-forest hover:opacity-100'
                }
              `}
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-beige/10 bg-forest-dark/50">
          <div className="flex items-center justify-between px-2 mb-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono tracking-widest text-[#dfc6b3] uppercase">Logged in as</span>
              <span className="font-serif text-base text-white">{user?.username || 'Admin'}</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-forest border border-beige/10 hover:border-wood/50 text-beige hover:text-wood font-mono text-xs uppercase tracking-widest rounded-xl transition-all"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden bg-earth-dark relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </div>
        
        {/* Copyright Footer */}
        <footer className="py-4 px-8 border-t border-beige/5 text-center md:text-left bg-earth-dark mt-auto">
          <span className="font-mono text-[10px] tracking-widest text-beige/40 uppercase">
            &copy; {new Date().getFullYear()} Mirasa Sanctuary. All rights reserved.
          </span>
        </footer>
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
