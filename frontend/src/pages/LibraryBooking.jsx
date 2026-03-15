import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Calendar, Clock, MapPin, BookOpen, X } from 'lucide-react';
import { libraryService } from '../services/api';
import toast from 'react-hot-toast';

const TOTAL_SEATS = 60;
const ROWS = 6;
const COLS = 10;

const zones = [
  { name: 'Silence Zone', floor: 1, color: 'text-purple-600', bg: 'bg-purple-50' },
  { name: 'Study Zone', floor: 1, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { name: 'Group Zone', floor: 2, color: 'text-sky-600', bg: 'bg-sky-50' },
];



const Seat = memo(({ seatId, isBooked, isSelected, onSeatSelect }) => {
  return (
    <motion.button
      whileHover={!isBooked ? { scale: 1.2 } : {}}
      whileTap={!isBooked ? { scale: 0.9 } : {}}
      disabled={isBooked}
      onClick={() => onSeatSelect(isSelected ? null : seatId)}
      title={seatId}
      className={`w-7 h-7 rounded-md text-xs font-semibold transition-all ${
        isBooked
          ? 'bg-red-100 dark:bg-red-900/30 text-red-300 cursor-not-allowed'
          : isSelected
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-400/40 scale-110'
          : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-indigo-100 hover:text-indigo-600'
      }`}
    >
      {seatId.split('-')[1].substring(1)}
    </motion.button>
  );
});

function SeatGrid({ bookedSeats, selectedSeat, onSeatSelect }) {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        {rows.map(row => (
          <div key={row} className="flex items-center gap-2 mb-2">
            <span className="w-6 text-xs font-bold text-slate-400">{row}</span>
            {Array.from({ length: 10 }, (_, col) => {
              const seatId = `F1-${row}${col + 1}`;
              const seatData = bookedSeats.find(s => s.seat_id === seatId);
              const isBooked = seatData?.isBooked;
              const isSelected = selectedSeat === seatId;
              return (
                <Seat
                  key={seatId}
                  seatId={seatId}
                  isBooked={isBooked}
                  isSelected={isSelected}
                  onSeatSelect={onSeatSelect}
                />
              );
            })}
          </div>
        ))}
        <div className="mt-3 text-xs text-slate-400 flex gap-2">
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-emerald-100 inline-block" /> Available</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-red-100 inline-block" /> Booked</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-indigo-600 inline-block" /> Selected</span>
        </div>
      </div>
    </div>
  );
}

export default function LibraryBooking() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [selectedZone, setSelectedZone] = useState(zones[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [bookedSeats, setBookedSeats] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBookedSeats();
    fetchMyBookings();
  }, [selectedDate]);

  const fetchBookedSeats = useCallback(async () => {
    try {
      const { data } = await libraryService.getSeatsStatus(selectedDate);
      setBookedSeats(data);
    } catch {
      setBookedSeats([]);
    }
  }, [selectedDate]);

  const fetchMyBookings = useCallback(async () => {
    try {
      const { data } = await libraryService.getMyBookings();
      setMyBookings(data);
    } catch { setMyBookings([]); }
  }, []);

  const handleConfirmBooking = useCallback(async () => {
    if (!selectedSeat) return;
    setLoading(true);
    try {
      await libraryService.bookSeat({
        seat_id: selectedSeat,
        date: selectedDate,
        start_time: startTime,
        end_time: endTime,
        floor: selectedZone.floor,
        zone: selectedZone.name,
      });
      toast.success(`Seat ${selectedSeat} booked successfully! 🎉`);
      setShowModal(false);
      setSelectedSeat(null);
      fetchBookedSeats();
      fetchMyBookings();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to book seat');
    } finally {
      setLoading(false);
    }
  }, [selectedSeat, selectedDate, startTime, endTime, selectedZone, fetchBookedSeats, fetchMyBookings]);

  const handleSeatSelect = useCallback((seatId) => {
    setSelectedSeat(prev => prev === seatId ? null : seatId);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Library Seat Booking</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Reserve your study spot in advance</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Booking panel */}
        <div className="xl:col-span-2 glass-card p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                <Calendar size={14} className="inline mr-1" /> Select Date
              </label>
              <input type="date" value={selectedDate} min={today}
                onChange={e => setSelectedDate(e.target.value)}
                className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Zone</label>
              <select value={selectedZone.name}
                onChange={e => setSelectedZone(zones.find(z => z.name === e.target.value))}
                className="input-field">
                {zones.map(z => <option key={z.name}>{z.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                <Clock size={14} className="inline mr-1" /> Start Time
              </label>
              <select value={startTime} onChange={e => setStartTime(e.target.value)} className="input-field">
                {['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'].map(t =>
                  <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">End Time</label>
              <select value={endTime} onChange={e => setEndTime(e.target.value)} className="input-field">
                {['10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'].map(t =>
                  <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
              <BookOpen size={16} className="text-indigo-500" /> Floor 1 Seat Map
            </h3>
            <SeatGrid bookedSeats={bookedSeats} selectedSeat={selectedSeat} onSeatSelect={handleSeatSelect} />
          </div>

          {selectedSeat && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-xl p-4"
            >
              <div>
                <p className="font-semibold text-indigo-700 dark:text-indigo-300">Seat {selectedSeat} selected</p>
                <p className="text-sm text-indigo-600 dark:text-indigo-400">{selectedZone.name} · {startTime} - {endTime}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowModal(true)}
                className="btn-primary"
              >
                Confirm Booking
              </motion.button>
            </motion.div>
          )}
        </div>

        {/* My bookings */}
        <div className="glass-card p-6">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">My Bookings</h3>
          <div className="space-y-3">
            {myBookings.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No bookings yet</p>
              </div>
            ) : (
              myBookings.map(b => (
                <div key={b.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-800 dark:text-white">Seat {b.seat_id}</span>
                    <span className={`badge ${b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                      {b.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar size={11} /> {b.date}
                    <Clock size={11} /> {b.start_time}-{b.end_time}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-xs text-slate-400">{b.zone}</p>
                    {b.status === 'confirmed' && (
                      <button
                        onClick={async () => {
                          if (window.confirm(`Unbook seat ${b.seat_id}?`)) {
                            try {
                              await libraryService.unbookSeat(b.seat_id);
                              toast.success('Seat unbooked');
                              fetchBookedSeats();
                              fetchMyBookings();
                            } catch (err) {
                              toast.error('Failed to unbook seat');
                            }
                          }
                        }}
                        className="text-[10px] font-bold text-red-500 hover:text-red-400 uppercase tracking-wider"
                      >
                        Unbook
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setShowModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl z-50 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-grotesk font-bold text-slate-800 dark:text-white">Confirm Booking</h3>
                <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X size={16} />
                </button>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-4 space-y-2 mb-5">
                <p className="text-sm flex items-center gap-2"><span className="font-medium text-slate-700 dark:text-slate-300">Seat:</span> <span className="text-indigo-600 font-bold">{selectedSeat}</span></p>
                <p className="text-sm flex items-center gap-2"><Calendar size={13} className="text-slate-500" /> {selectedDate}</p>
                <p className="text-sm flex items-center gap-2"><Clock size={13} className="text-slate-500" /> {startTime} – {endTime}</p>
                <p className="text-sm flex items-center gap-2"><MapPin size={13} className="text-slate-500" /> {selectedZone.name}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleConfirmBooking} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle size={14} /> Confirm</>}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
