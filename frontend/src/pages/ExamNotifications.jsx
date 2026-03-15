import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Calendar, Clock, MapPin, Timer, BookOpen, Search } from 'lucide-react';
import { examService } from '../services/api';
import useDebounce from '../hooks/useDebounce';
import SkeletonLoader from '../components/common/SkeletonLoader';

function CountdownTimer({ examDate, examTime }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const target = new Date(`${examDate}T${examTime.replace(' AM', '').replace(' PM', '')}:00`);
    const now = new Date();
    if (isNaN(target)) { setTimeLeft('TBD'); return; }

    const update = () => {
      const diff = target - new Date();
      if (diff <= 0) { setTimeLeft('Started!'); return; }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      if (days > 0) setTimeLeft(`${days}d ${hours}h`);
      else if (hours > 0) setTimeLeft(`${hours}h ${mins}m`);
      else setTimeLeft(`${mins}m`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [examDate, examTime]);

  const isUrgent = timeLeft.includes('h') && !timeLeft.includes('d');
  const isSoon = timeLeft.includes('d') && parseInt(timeLeft) <= 3;

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
      isUrgent ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
      isSoon ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' :
      'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
    }`}>
      <Timer size={11} />
      {timeLeft}
    </div>
  );
}

const semesterColors = [
  'from-indigo-500 to-purple-500',
  'from-sky-500 to-blue-600',
  'from-emerald-500 to-teal-500',
  'from-orange-400 to-red-400',
];

export default function ExamNotifications() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const { data } = await examService.getExams();
      setExams(data);
    } catch {
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  const semesters = ['all', ...new Set(exams.map(e => `Sem ${e.semester}`))];
  const filtered = (filter === 'all' ? exams : exams.filter(e => `Sem ${e.semester}` === filter))
    .filter(e => 
      e.subject.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
      e.exam_name.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Exam Notifications</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Stay updated on all upcoming examinations</p>
        </div>
        <div className="relative w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search subjects..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Summary banner */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Exams', value: exams.length, color: 'from-indigo-500 to-blue-600' },
          { label: 'This Month', value: exams.filter(e => e.date.startsWith('2026-03')).length, color: 'from-amber-400 to-orange-500' },
          { label: 'Next Month', value: exams.filter(e => e.date.startsWith('2026-04')).length, color: 'from-emerald-400 to-teal-500' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-md`}>
              <Bell size={18} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-grotesk font-bold text-slate-800 dark:text-white">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {semesters.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all capitalize ${
              filter === s ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' :
              'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
            }`}>
            {s === 'all' ? 'All Semesters' : s}
          </button>
        ))}
      </div>

      {/* Exam cards */}
      {loading ? (
        <SkeletonLoader variant="grid" count={4} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 glass-card">
          <Bell size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500 font-medium">No examinations found matching your criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((exam, i) => (
            <motion.div
              key={exam.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass-card p-5 hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium mb-2 bg-gradient-to-r ${semesterColors[exam.semester % 4]} text-white`}>
                    <BookOpen size={11} /> Sem {exam.semester}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">{exam.exam_name}</p>
                  <h3 className="font-grotesk font-semibold text-slate-800 dark:text-white mt-0.5">{exam.subject}</h3>
                </div>
                <CountdownTimer examDate={exam.date} examTime={exam.time} />
              </div>
              <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Calendar size={12} className="text-indigo-500" />
                  {new Date(exam.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock size={12} className="text-indigo-500" /> {exam.time} · {exam.duration} min
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <MapPin size={12} className="text-indigo-500" /> {exam.location}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
