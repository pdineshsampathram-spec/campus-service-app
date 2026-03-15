import { Award, CheckCircle, Clock, AlertCircle, Upload, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { certificateService } from '../services/api'; // Re-added as it's essential for functionality
import { useAuth } from '../context/AuthContext'; // Corrected from malformed line
import toast from 'react-hot-toast';
import useDebounce from '../hooks/useDebounce';
import SkeletonLoader from '../components/common/SkeletonLoader';

const certTypes = ['Bonafide', 'Transfer Certificate', 'Degree Certificate', 'Conduct Certificate', 'Migration Certificate'];

const statusConfig = {
  pending: { color: 'bg-amber-100 text-amber-700', icon: Clock },
  processing: { color: 'bg-sky-100 text-sky-700', icon: Clock },
  approved: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  rejected: { color: 'bg-red-100 text-red-600', icon: AlertCircle },
  ready: { color: 'bg-purple-100 text-purple-700', icon: CheckCircle },
};

export default function Certificates() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    certificate_type: 'Bonafide',
    student_name: user?.name || '',
    student_id: user?.student_id || '',
    reason: '',
    additional_info: '',
  });
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data } = await certificateService.getMyRequests();
      setRequests(data);
    } catch {
      setRequests([
        { id: '1', request_id: 'CERT-AB12CD34', certificate_type: 'Bonafide', student_name: user?.name, student_id: user?.student_id, reason: 'Visa application', status: 'processing', created_at: new Date(), estimated_days: 7 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await certificateService.requestCertificate(form);
      toast.success('Certificate request submitted! Your request ID has been generated. 📜', { duration: 5000 });
      setForm({ ...form, reason: '', additional_info: '' });
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Certificate Requests</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Request official certificates from the university</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Request form */}
        <div className="glass-card p-6">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-5 flex items-center gap-2">
            <Award size={18} className="text-indigo-500" /> New Request
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Certificate Type</label>
              <select value={form.certificate_type}
                onChange={e => setForm({ ...form, certificate_type: e.target.value })}
                className="input-field">
                {certTypes.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Student Name</label>
                <input type="text" required value={form.student_name}
                  onChange={e => setForm({ ...form, student_name: e.target.value })}
                  className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Student ID</label>
                <input type="text" required value={form.student_id}
                  onChange={e => setForm({ ...form, student_id: e.target.value })}
                  className="input-field" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Reason for Request</label>
              <textarea required value={form.reason}
                onChange={e => setForm({ ...form, reason: e.target.value })}
                placeholder="Explain why you need this certificate..."
                rows={3}
                className="input-field resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Additional Information</label>
              <textarea value={form.additional_info}
                onChange={e => setForm({ ...form, additional_info: e.target.value })}
                placeholder="Any additional details..."
                rows={2}
                className="input-field resize-none" />
            </div>
            <div className="flex items-center gap-3 p-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-indigo-300 transition-colors">
              <Upload size={18} className="text-slate-400" />
              <span className="text-sm text-slate-500">Upload supporting document (optional)</span>
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Submit Request'}
            </button>
          </form>
        </div>

        {/* My requests */}
        <div className="glass-card p-6 flex flex-col h-[600px]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-slate-700 dark:text-slate-200">My Requests</h2>
            <div className="relative w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field pl-9 py-1.5 text-xs"
              />
            </div>
          </div>
          <div className="space-y-3 overflow-y-auto pr-1 flex-1">
            {loading ? (
              <SkeletonLoader variant="list" count={4} />
            ) : requests.filter(r => 
              r.certificate_type.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
              r.request_id.toLowerCase().includes(debouncedSearch.toLowerCase())
            ).length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <Award size={36} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No requests found</p>
              </div>
            ) : (
              requests.filter(r => 
                r.certificate_type.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
                r.request_id.toLowerCase().includes(debouncedSearch.toLowerCase())
              ).map((req, i) => {
                const { color, icon: StatusIcon } = statusConfig[req.status] || statusConfig.pending;
                return (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm text-slate-800 dark:text-white">{req.certificate_type}</p>
                        <p className="text-xs text-slate-400 mt-0.5 font-mono">{req.request_id}</p>
                      </div>
                      <span className={`badge ${color} flex items-center gap-1`}>
                        <StatusIcon size={10} /> {req.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{req.reason}</p>
                    <p className="text-xs text-slate-400">Est. {req.estimated_days} days</p>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
