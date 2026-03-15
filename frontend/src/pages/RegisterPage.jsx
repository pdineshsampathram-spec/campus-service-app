import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AnimatedBackground from '../components/layout/AnimatedBackground';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', student_id: '', department: '', year: 1
  });
  const [showPass, setShowPass] = useState(false);
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Chemical', 'MBA', 'Physics', 'Mathematics'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await register({ ...form, year: Number(form.year) });
    if (result.success) {
      toast.success('Account created! Welcome to CampusHub 🎉');
      navigate('/dashboard');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative py-8">
      <AnimatedBackground />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mx-4"
      >
        <div className="glass-card p-8">
          <div className="text-center mb-7">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/30">
              <GraduationCap size={28} className="text-white" />
            </div>
            <h1 className="font-grotesk font-bold text-2xl text-slate-800 dark:text-white">Create account</h1>
            <p className="text-slate-500 text-sm mt-1">Join CampusHub today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="John Doe" className="input-field" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
                <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="john@campus.edu" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Student ID</label>
                <input type="text" required value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })}
                  placeholder="CS21B001" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Year</label>
                <select value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} className="input-field">
                  {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Department</label>
                <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="input-field">
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} required minLength={6} value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••" className="input-field pr-10" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-emerald w-full flex items-center justify-center gap-2 py-3">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><UserPlus size={16} /> Create Account</>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
