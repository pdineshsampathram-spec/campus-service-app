import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { healthService } from '../services/api';
import AnimatedBackground from '../components/layout/AnimatedBackground';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [pinging, setPinging] = useState(false);
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Step 1, 2 & 3: Robust Backend Wait
    setPinging(true);
    try {
      window.dispatchEvent(new CustomEvent('server-waking', { detail: true }));
      // This will wait up to 30s with 10 retries
      await healthService.waitForBackend();
    } catch (err) {
      toast.error("Backend did not wake up in time. Please try again.");
      setPinging(false);
      window.dispatchEvent(new CustomEvent('server-waking', { detail: false }));
      return;
    } finally {
      // Don't hide the "server waking" toast/UI yet if we are about to login
      // but clear the local pinging state to allow the next phase
      setPinging(false);
    }

    const result = await login(form.email, form.password);
    
    // Hide global loader after login attempt
    window.dispatchEvent(new CustomEvent('server-waking', { detail: false }));

    if (result.success) {
      toast.success('Welcome back! 👋');
      navigate('/dashboard');
    } else {
      toast.error(result.message);
    }
  };

  const fillDemo = () => {
    setForm({ email: 'alex@campus.edu', password: 'Demo@1234' });
    toast('Demo credentials filled!', { icon: '🔑' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <AnimatedBackground />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mx-4"
      >
        {/* Card */}
        <div className="glass-card p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-500/30">
              <GraduationCap size={28} className="text-white" />
            </div>
            <h1 className="font-grotesk font-bold text-2xl text-slate-800 dark:text-white">Welcome back</h1>
            <p className="text-slate-500 text-sm mt-1">Sign in to your CampusHub account</p>
          </div>

          {/* Demo banner */}
          <button
            onClick={fillDemo}
            className="w-full mb-6 p-3 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-xl text-sm text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
          >
            <span>🚀</span>
            <span>Try Demo Account</span>
          </button>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@campus.edu"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="input-field pr-10"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading || pinging} className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
              {loading || pinging ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><LogIn size={16} /> Sign In</>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-600 font-semibold hover:underline">Register</Link>
          </p>
        </div>

        {/* Features strip */}
        <div className="flex items-center justify-center gap-6 mt-6">
          {['🍕 Food Orders', '📚 Library', '🎓 Certificates'].map(f => (
            <span key={f} className="text-xs text-slate-500 font-medium">{f}</span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
