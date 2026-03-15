import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, BookOpen, GraduationCap, Edit3, Shield, Bell, Globe, X, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    department: user?.department || '',
    year: user?.year || 1,
  });

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authService.updateProfile(formData);
      updateUser(data);
      toast.success('Profile updated successfully! ✨');
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const infoItems = [
    { icon: User, label: 'Full Name', value: user?.name || 'N/A' },
    { icon: Mail, label: 'Email', value: user?.email || 'N/A' },
    { icon: Shield, label: 'Student ID', value: user?.student_id || 'N/A' },
    { icon: GraduationCap, label: 'Department', value: user?.department || 'N/A' },
    { icon: BookOpen, label: 'Year', value: user?.year ? `Year ${user.year}` : 'N/A' },
    { icon: Globe, label: 'Institution', value: 'CampusHub University' },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="section-title">My Profile</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Manage your account information</p>
      </div>

      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-4xl font-grotesk font-bold shadow-xl shadow-indigo-500/30">
              {user?.name?.charAt(0)?.toUpperCase() || 'S'}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="font-grotesk font-bold text-2xl text-slate-800 dark:text-white">{user?.name || 'Student'}</h2>
            <p className="text-slate-500 dark:text-slate-400">{user?.email}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
              <span className="badge bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                {user?.department || 'N/A'}
              </span>
              <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                Year {user?.year || '1'}
              </span>
              <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                {user?.student_id}
              </span>
            </div>
          </div>
          <button 
            onClick={() => setIsEditing(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Edit3 size={14} /> Edit Profile
          </button>
        </div>
      </motion.div>

      {/* Info grid */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Account Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {infoItems.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">{label}</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditing && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 px-4"
              onClick={() => setIsEditing(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-grotesk font-bold text-xl text-slate-800 dark:text-white">Edit Profile</h3>
                  <button onClick={() => setIsEditing(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                    <X size={20} />
                  </button>
                </div>
                
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="input-field pl-10" 
                        required 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Department</label>
                    <div className="relative">
                      <GraduationCap size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        value={formData.department}
                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                        className="input-field pl-10" 
                        required 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Year of Study</label>
                    <div className="relative">
                      <BookOpen size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <select 
                        value={formData.year}
                        onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                        className="input-field pl-10"
                      >
                        {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>Year {y}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary flex-1">Cancel</button>
                    <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle size={16} /> Save Changes</>}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Notifications Prefs (Rest of the code remains same) */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
          <Bell size={16} className="text-indigo-500" /> Notification Preferences
        </h3>
        <div className="space-y-3">
          {[
            { label: 'Exam Reminders', desc: 'Get notified before your exams', on: true },
            { label: 'Order Updates', desc: 'Track your food order status', on: true },
            { label: 'Complaint Updates', desc: 'Status changes on your complaints', on: true },
            { label: 'Certificate Ready', desc: 'When your certificate is ready', on: false },
          ].map(pref => (
            <div key={pref.label} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{pref.label}</p>
                <p className="text-xs text-slate-400">{pref.desc}</p>
              </div>
              <button className={`relative w-10 h-6 rounded-full transition-colors ${pref.on ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${pref.on ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
