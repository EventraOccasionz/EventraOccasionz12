import React, { useState, useEffect } from 'react';
import { Send, Loader2, Sparkles, MessageSquare, AlertCircle, Clock, Trash2, ShieldAlert, Bell, X, Smartphone, Mail, Eye } from 'lucide-react';
import { db } from '../../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { dataService } from '../../services/dataService';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  priority: 'normal' | 'important' | 'urgent';
  timestamp: string;
  sender: string;
  status: 'Sent' | 'Delivered';
  recipientCount: number;
}

interface NotificationsTabProps {
  selectedEventId: string;
  confirmedGuestsCount: number;
  hotelGuestsCount: number;
  transportGuestsCount: number;
  showToast: (type: 'success' | 'error', message: string) => void;
  families?: any[];
}

export default function NotificationsTab({
  selectedEventId,
  confirmedGuestsCount,
  hotelGuestsCount,
  transportGuestsCount,
  showToast,
  families = []
}: NotificationsTabProps) {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'normal' | 'important' | 'urgent'>('normal');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Future Ready Integration Toggles (Architecture Demonstration Only)
  const [enableSms, setEnableSms] = useState(false);
  const [enableWhatsApp, setEnableWhatsApp] = useState(false);
  const [enableEmail, setEnableEmail] = useState(false);

  // Compute total guests of this event by summing family guest count limits
  const totalEventGuestsCount = families.reduce((sum, f) => sum + (f.max_guests || 1), 0);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        if (dataService.isConfigured()) {
          const docSnap = await getDoc(doc(db, 'venue_settings', `notifications_${selectedEventId}`));
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data && Array.isArray(data.list)) {
              // Gracefully handle legacy notifications
              const mapped = data.list.map((n: any) => ({
                id: n.id,
                title: n.title || 'Wedding Announcement',
                message: n.message,
                priority: n.priority || 'normal',
                timestamp: n.timestamp,
                sender: n.sender || 'System',
                status: n.status || 'Delivered',
                recipientCount: n.recipientCount || totalEventGuestsCount || confirmedGuestsCount || 10
              }));
              setNotifications(mapped);
            } else {
              setNotifications([]);
            }
          } else {
            setNotifications([]);
          }
        } else {
          const cached = localStorage.getItem(`local_notifications_${selectedEventId}`);
          if (cached) {
            setNotifications(JSON.parse(cached));
          } else {
            setNotifications([]);
          }
        }
      } catch (err) {
        console.warn('Failed loading notifications:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [selectedEventId, totalEventGuestsCount]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setSending(true);
    try {
      const sender = localStorage.getItem('user_email') || 'system-admin';
      
      if (dataService.isConfigured()) {
        const response = await fetch('/api/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            message: message.trim(),
            priority,
            event_id: selectedEventId,
            sender
          })
        });
        
        const resData = await response.json();
        if (!response.ok) {
          throw new Error(resData.details || resData.error || 'Failed to send push notification via backend');
        }
        
        if (resData.notification) {
          const updatedList = [resData.notification, ...notifications];
          setNotifications(updatedList);
          showToast('success', `Broadcast push notification "${resData.notification.title}" dispatched successfully.`);
        }
      } else {
        const newNotif: NotificationItem = {
          id: 'notif_' + Math.random().toString(36).substring(2, 9),
          title: title.trim(),
          message: message.trim(),
          priority,
          timestamp: new Date().toISOString(),
          sender,
          status: 'Delivered',
          recipientCount: totalEventGuestsCount || 1
        };
        const updatedList = [newNotif, ...notifications];
        localStorage.setItem(`local_notifications_${selectedEventId}`, JSON.stringify(updatedList));
        setNotifications(updatedList);
        showToast('success', `Local broadcast announcement "${newNotif.title}" dispatched successfully.`);
      }

      setTitle('');
      setMessage('');
      setPriority('normal');
      setIsPreviewOpen(false);
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.response?.data?.details || err.message || 'Unknown error occurred';
      showToast('error', `Failed sending broadcast notification: ${errorMessage}`);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification record?')) return;
    try {
      const updatedList = notifications.filter(n => n.id !== id);
      if (dataService.isConfigured()) {
        await setDoc(doc(db, 'venue_settings', `notifications_${selectedEventId}`), { list: updatedList });
      } else {
        localStorage.setItem(`local_notifications_${selectedEventId}`, JSON.stringify(updatedList));
      }
      setNotifications(updatedList);
      showToast('success', 'Notification deleted.');
    } catch (err) {
      showToast('error', 'Failed deleting notification.');
    }
  };

  return (
    <div id="notifications-tab-panel" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Sender Column / Notification Manager */}
      <div className="lg:col-span-5 bg-[#121212]/50 border border-white/5 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-full border border-gold/20 bg-gold/5 flex items-center justify-center text-gold">
            <Bell size={20} className="animate-pulse" />
          </span>
          <div>
            <h3 className="font-serif text-lg text-cream">Notification Manager</h3>
            <p className="text-xs text-text-secondary">Dispatch wedding announcements to guests of this event.</p>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-widest text-gold font-mono font-bold">Notification Title</label>
            <input
              required
              type="text"
              placeholder="e.g. Haldi Ceremony Update"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-[#181818] border border-white/10 rounded-xl px-4 py-3 text-xs text-cream outline-none focus:border-gold transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-widest text-gold font-mono font-bold">Announcement Message</label>
            <textarea
              required
              rows={4}
              placeholder="e.g. Haldi Ceremony starts in 30 minutes at the Golden Terraces. Please proceed to the venue dressed in beautiful yellow shades."
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-cream outline-none focus:border-gold transition-colors resize-none leading-relaxed placeholder-white/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-widest text-gold font-mono font-bold">Priority Level</label>
            <div className="grid grid-cols-3 gap-2">
              {(['normal', 'important', 'urgent'] as const).map((p) => {
                const colors = {
                  normal: 'border-white/10 hover:border-blue-500/50 text-cream bg-[#181818]',
                  important: 'border-white/10 hover:border-amber-500/50 text-cream bg-[#181818]',
                  urgent: 'border-white/10 hover:border-red-500/50 text-cream bg-[#181818]'
                };
                const activeColors = {
                  normal: 'border-blue-500 bg-blue-500/10 text-blue-400 font-bold',
                  important: 'border-amber-500 bg-amber-500/10 text-amber-400 font-bold',
                  urgent: 'border-red-500 bg-red-500/10 text-red-400 font-bold'
                };
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 px-3 border rounded-xl text-center text-xs uppercase tracking-wider transition-all font-mono ${
                      priority === p ? activeColors[p] : colors[p]
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Future Ready Architecture Section (Demonstration Only) */}
          <div className="pt-2 border-t border-white/5 space-y-2">
            <span className="text-[9px] uppercase tracking-wider text-white/40 font-mono block">Future Channels (Ready to integrate)</span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-not-allowed opacity-40 text-[10px] font-mono text-text-secondary select-none">
                <input
                  type="checkbox"
                  disabled
                  checked={enableSms}
                  onChange={e => setEnableSms(e.target.checked)}
                  className="rounded border-white/10 text-gold bg-black/40"
                />
                SMS
              </label>
              <label className="flex items-center gap-2 cursor-not-allowed opacity-40 text-[10px] font-mono text-text-secondary select-none">
                <input
                  type="checkbox"
                  disabled
                  checked={enableWhatsApp}
                  onChange={e => setEnableWhatsApp(e.target.checked)}
                  className="rounded border-white/10 text-gold bg-black/40"
                />
                WhatsApp
              </label>
              <label className="flex items-center gap-2 cursor-not-allowed opacity-40 text-[10px] font-mono text-text-secondary select-none">
                <input
                  type="checkbox"
                  disabled
                  checked={enableEmail}
                  onChange={e => setEnableEmail(e.target.checked)}
                  className="rounded border-white/10 text-gold bg-black/40"
                />
                Email
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              disabled={!title.trim() || !message.trim()}
              onClick={() => setIsPreviewOpen(true)}
              className="py-3 px-4 border border-gold/30 text-gold hover:bg-gold/5 rounded-xl font-mono text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              <Eye size={14} /> Preview
            </button>

            <button
              type="submit"
              disabled={sending || !title.trim() || !message.trim()}
              className="bg-gold hover:brightness-110 text-dark py-3 px-4 rounded-xl font-mono text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-gold/10 disabled:opacity-50"
            >
              {sending ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={14} /> Send
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* History Column */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-[#121212]/30 border border-white/5 rounded-xl p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
            <h4 className="font-serif text-sm text-gold flex items-center gap-2">
              <Clock size={16} /> Announcement History
            </h4>
            <span className="text-[10px] font-mono text-text-secondary">
              Total Target Guests: <span className="text-cream font-bold">{totalEventGuestsCount}</span>
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-gold" size={24} />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/5 rounded-xl">
              <ShieldAlert className="mx-auto text-white/20 mb-2" size={24} />
              <p className="text-xs text-text-secondary font-mono">No announcements sent yet for this wedding.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {notifications.map(n => (
                <div key={n.id} className={`p-4 bg-white/5 border rounded-xl space-y-3 relative group transition-all ${
                  n.priority === 'urgent' ? 'border-red-500/20 bg-red-500/[0.01]' : 'border-white/5 bg-[#121212]/30'
                }`}>
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="absolute top-4 right-4 p-1 text-text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Record"
                  >
                    <Trash2 size={14} />
                  </button>

                  <div className="flex justify-between items-center text-[9px] font-mono">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded border uppercase text-[8px] font-bold ${
                        n.priority === 'urgent' ? 'border-red-500/30 bg-red-500/10 text-red-400' :
                        n.priority === 'important' ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' :
                        'border-blue-500/30 bg-blue-500/10 text-blue-400'
                      }`}>
                        {n.priority}
                      </span>
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                        {n.status || 'Delivered'}
                      </span>
                    </div>
                    <span className="text-text-secondary">{new Date(n.timestamp).toLocaleString()}</span>
                  </div>
                  
                  <div className="space-y-1">
                    <h5 className="text-xs font-serif text-gold font-bold">{n.title}</h5>
                    <p className="text-xs text-cream/90 leading-relaxed font-sans">{n.message}</p>
                  </div>
                  
                  <div className="flex justify-between items-center text-[9px] font-mono text-white/30 border-t border-white/5 pt-2">
                    <span>Sender: {n.sender}</span>
                    <span>Reached: {n.recipientCount} Guests</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-gradient-to-b from-[#1c0205] to-[#0a0001] border border-gold/30 rounded-2xl p-6 shadow-2xl overflow-hidden space-y-6">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
            
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="absolute top-4 right-4 text-[#FDFBF7]/60 hover:text-white p-1 hover:bg-white/5 rounded-full"
            >
              <X size={18} />
            </button>

            <div className="text-center">
              <span className="text-[10px] uppercase tracking-widest text-gold/80 font-mono block">Guest-View Announcement Preview</span>
              <div className="w-12 h-[1px] bg-gold/30 mx-auto mt-2" />
            </div>

            {/* Simulated Notification Card as it appears to guest */}
            <div className={`p-5 rounded-2xl border text-left space-y-3 shadow-lg relative overflow-hidden ${
              priority === 'urgent' 
                ? 'bg-red-500/5 border-red-500/40 shadow-red-950/20' 
                : priority === 'important'
                ? 'bg-amber-500/5 border-amber-500/40 shadow-amber-950/20'
                : 'bg-gold/5 border-gold/30 shadow-gold/5'
            }`}>
              <div className="flex items-start gap-3.5">
                <div className={`p-2.5 rounded-xl shrink-0 border ${
                  priority === 'urgent'
                    ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-bounce'
                    : priority === 'important'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-gold/10 text-gold border-gold/20'
                }`}>
                  <Sparkles size={18} />
                </div>
                <div className="space-y-1 w-full">
                  <div className="flex justify-between items-center">
                    <p className="text-[9px] uppercase tracking-widest text-gold font-mono font-bold">
                      {priority === 'urgent' ? '🚨 Urgent Announcement' : priority === 'important' ? '⚠️ Important Announcement' : 'Host Announcement'}
                    </p>
                    <span className="text-[8px] font-mono text-white/35">Just now</span>
                  </div>
                  <h4 className="text-xs font-serif font-bold text-cream mt-0.5">{title || 'Wedding Announcement'}</h4>
                  <p className="text-xs text-cream/90 font-sans leading-relaxed pt-1">
                    {message || 'No message content entered.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="w-full py-3 border border-white/10 text-cream/80 hover:bg-white/5 rounded-xl font-mono text-xs uppercase tracking-widest font-bold transition-all"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => handleSend()}
                className="w-full bg-gold hover:brightness-110 text-dark py-3 rounded-xl font-mono text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-gold/10"
              >
                <Send size={14} /> Send Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
