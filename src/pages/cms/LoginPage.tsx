import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useLoginMutation } from '../../lib/mutations';
import { toast } from 'sonner';
import logoUrl from '../../assets/images/logo.jpg';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { isLoggedIn, login } = useAuthStore();
  const navigate = useNavigate();

  const loginMutation = useLoginMutation();

  if (isLoggedIn) {
    return <Navigate to="/cms/menu" replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please enter username and password');
      return;
    }

    loginMutation.mutate(
      { username, password },
      {
        onSuccess: () => {
          // Based on API spec, login just returns success.
          // We don't get user details from login, we might need to fetch /users/me
          // but for now, we just set true and a dummy username until ProtectedRoute re-fetches.
          login({ id: 'dummy', username });
          toast.success('Login successful');
          navigate('/cms/menu');
        },
        onError: (err) => {
          toast.error(err.message || 'Invalid credentials');
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-earth-dark flex flex-col items-center justify-center p-6 selection:bg-wood selection:text-beige relative overflow-hidden">

      {/* Ambient backgrounds to match landing page */}
      <div className="absolute inset-0 bg-gradient-to-t from-earth-dark via-earth-dark/40 to-forest-dark/60 z-0" />

      <div className="w-full max-w-md bg-forest-dark/80 backdrop-blur-md border border-beige/10 rounded-3xl p-8 md:p-10 relative z-10 shadow-2xl">
        <div className="flex flex-col items-center mb-10">
          <div className="h-14 w-14 rounded-2xl overflow-hidden border border-beige/25 mb-4 shadow-lg">
            <img src={logoUrl} alt="Mirasa Coffee Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="font-serif text-3xl text-white font-light text-center">Mirasa Coffee</h1>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#dfc6b3] mt-2 block opacity-80">CMS Portal Access</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-mono tracking-widest text-beige/70 uppercase">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-beige/40">
                <User size={16} />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-earth-dark/50 border border-beige/10 text-beige text-sm rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-wood focus:ring-1 focus:ring-wood transition-all placeholder:text-beige/20 font-sans"
                placeholder="Enter username"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono tracking-widest text-beige/70 uppercase">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-beige/40">
                <Lock size={16} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-earth-dark/50 border border-beige/10 text-beige text-sm rounded-xl py-3 pl-10 pr-12 focus:outline-none focus:border-wood focus:ring-1 focus:ring-wood transition-all placeholder:text-beige/20 font-sans"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-beige/40 hover:text-beige/80 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full bg-wood hover:bg-wood-dark text-white py-3.5 rounded-xl text-xs font-mono font-medium tracking-widest uppercase cursor-pointer transition-all duration-300 shadow-xl border border-transparent disabled:opacity-50 mt-4"
          >
            {loginMutation.isPending ? 'Authenticating...' : 'Enter Portal'}
          </button>
        </form>
      </div>

      <div className="mt-8 text-center relative z-10">
        <span className="font-mono text-[10px] tracking-widest text-beige/40 uppercase">
          &copy; {new Date().getFullYear()} Sava Reyhano. Authorized Access Only.
        </span>
      </div>
    </div>
  );
}
