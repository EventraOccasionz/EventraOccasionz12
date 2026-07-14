import React from 'react';
import { 
  FileText, 
  Clock, 
  Briefcase, 
  Image, 
  CheckCircle, 
  Users, 
  Hotel, 
  Car, 
  Calendar, 
  Inbox, 
  AlertCircle,
  ExternalLink,
  Layers,
  PieChart,
  TrendingUp
} from 'lucide-react';

interface AnalyticsPanelProps {
  stats: {
    // Global Event Status Counts (Step 3)
    totalEvents: number;
    upcomingEvents: number;
    activeEvents: number;
    completedEvents: number;
    archivedEvents: number;

    // Global CMS / CRM Metrics (Step 4, 5, 6)
    totalInquiries: number;
    pendingInquiries: number;
    totalServices: number; 
    galleryItems: number; 

    // Current Event Context (Step 2, 7)
    selectedEventId: string | null;
    selectedEventName: string | null;
    expectedGuests: number | null | undefined;
    confirmedGuestsCount: number;
    rsvpResponsesCount: number;
    transportCount: number;
    roomsCount: number;

    // Detailed event metrics
    totalInviteLinks?: number;
    inviteCapacity?: number;
    notAttendingCount?: number;
    pendingRsvpsCount?: number;
    pendingGuestsCount?: number;
    checkinsCount?: number;

    // Engagement Sparkline data (Step 8, 9)
    engagementData: { name: string; count: number }[];
  };
  onSelectWorkspace?: () => void;
}

export default function AnalyticsPanel({ stats, onSelectWorkspace }: AnalyticsPanelProps) {
  // Calculated percentages safely
  const inquiryPipelineRatio = stats.totalInquiries > 0 
    ? Math.round(((stats.totalInquiries - stats.pendingInquiries) / stats.totalInquiries) * 100) 
    : 0;

  // Render SVG Sparkline Dynamically based on real history
  const renderSparkline = () => {
    const data = stats.engagementData;
    if (!data || data.length === 0) return null;

    const maxCount = Math.max(...data.map(d => d.count), 1);
    const xCoords = [0, 33, 66, 100];
    
    // Scale y value from 5 (max) to 30 (min/baseline)
    const points = data.map((d, i) => {
      const y = 30 - ((d.count / maxCount) * 25);
      return { x: xCoords[i], y, count: d.count, name: d.name };
    });

    const linePath = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    const fillPath = `M 0 35 L ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') + ` L 100 35 Z`;

    return (
      <div className="space-y-4">
        <div className="h-24 flex items-center justify-center p-2 relative">
          <svg viewBox="0 0 100 35" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            
            {/* Fill path */}
            <path d={fillPath} fill="url(#chartGradient)" />
            
            {/* Stroke line path */}
            <path 
              d={linePath} 
              fill="none" 
              stroke="#D4AF37" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
            
            {/* Interactive reference points */}
            {points.map((p, idx) => (
              <g key={idx} className="group/node cursor-pointer">
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r="2" 
                  fill={p.count > 0 ? '#FFFFFF' : '#1a1a1a'} 
                  stroke="#D4AF37" 
                  strokeWidth="1" 
                />
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r="4" 
                  fill="transparent" 
                  className="hover:fill-gold/20 transition-all"
                />
              </g>
            ))}
          </svg>
        </div>
        
        <div className="flex justify-between text-[10px] text-text-secondary font-mono">
          {points.map((p, idx) => (
            <div key={idx} className="text-center">
              <span className="block font-bold text-cream">{p.count}</span>
              <span className="text-white/40">{p.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Check if expectedGuests target is set and compute percentage
  const hasExpectedGuests = typeof stats.expectedGuests === 'number' && stats.expectedGuests > 0;
  const capacityFilled = hasExpectedGuests 
    ? Math.min(100, Math.round((stats.confirmedGuestsCount / (stats.expectedGuests as number)) * 100))
    : 0;

  return (
    <div id="admin-analytics-panel" className="space-y-10 mb-12 animate-fade-in">
      
      {/* SECTION I: SELECTED EVENT EXPERIENCE METRICS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <h4 className="font-serif text-lg text-gold flex items-center gap-2">
            <Layers size={18} /> Selected Event Workspace Metrics
          </h4>
          <span className="text-[10px] uppercase font-mono tracking-wider text-text-secondary">
            {stats.selectedEventId ? 'Active Context' : 'Global Scope'}
          </span>
        </div>

        {stats.selectedEventId ? (
          <div className="space-y-6">
            {/* Bento Grid for current event */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card Column 1: Invitation & Access */}
              <div className="bg-[#121212]/30 border border-white/5 rounded-2xl p-5 space-y-4">
                <span className="text-[10px] uppercase font-mono tracking-wider text-gold/80 block border-b border-white/5 pb-2">
                  Invitation & Access
                </span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                    <p className="text-[9px] uppercase tracking-widest text-white/40 mb-1">Invite Links</p>
                    <p className="font-serif text-xl text-cream">{stats.totalInviteLinks || 0}</p>
                    <p className="text-[9px] text-text-secondary mt-0.5">Total families</p>
                  </div>
                  <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                    <p className="text-[9px] uppercase tracking-widest text-white/40 mb-1">Invite Capacity</p>
                    <p className="font-serif text-xl text-cream">{stats.inviteCapacity || 0}</p>
                    <p className="text-[9px] text-text-secondary mt-0.5">Total invited</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                    <p className="text-[9px] uppercase tracking-widest text-white/40 mb-1">Submitted RSVPs</p>
                    <p className="font-serif text-xl text-cream">{stats.rsvpResponsesCount}</p>
                    <p className="text-[9px] text-gold/60 mt-0.5 font-mono">Response cards</p>
                  </div>
                  <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                    <p className="text-[9px] uppercase tracking-widest text-white/40 mb-1">Pending RSVPs</p>
                    <p className="font-serif text-xl text-amber-500">{stats.pendingRsvpsCount || 0}</p>
                    <p className="text-[9px] text-amber-500/60 mt-0.5 font-mono">Unsubmitted</p>
                  </div>
                </div>
              </div>

              {/* Card Column 2: Attendance Summary */}
              <div className="bg-[#121212]/30 border border-white/5 rounded-2xl p-5 space-y-4">
                <span className="text-[10px] uppercase font-mono tracking-wider text-gold/80 block border-b border-white/5 pb-2">
                  Attendance & Check-in
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-black/20 p-3 rounded-xl border border-white/5 col-span-1">
                    <p className="text-[8px] uppercase tracking-widest text-white/40 mb-1 truncate">Confirmed</p>
                    <p className="font-serif text-xl text-emerald-400">{stats.confirmedGuestsCount}</p>
                    <p className="text-[8px] text-emerald-400/60 mt-0.5 truncate">Attending</p>
                  </div>
                  <div className="bg-black/20 p-3 rounded-xl border border-white/5 col-span-1">
                    <p className="text-[8px] uppercase tracking-widest text-white/40 mb-1 truncate">Declined</p>
                    <p className="font-serif text-xl text-red-400">{stats.notAttendingCount || 0}</p>
                    <p className="text-[8px] text-red-400/60 mt-0.5 truncate">Not attending</p>
                  </div>
                  <div className="bg-black/20 p-3 rounded-xl border border-white/5 col-span-1">
                    <p className="text-[8px] uppercase tracking-widest text-white/40 mb-1 truncate">Checked-In</p>
                    <p className="font-serif text-xl text-blue-400">{stats.checkinsCount || 0}</p>
                    <p className="text-[8px] text-blue-400/60 mt-0.5 truncate">At venue</p>
                  </div>
                </div>
                
                {/* Micro Attendance check-in status progress bar */}
                <div className="space-y-1 bg-black/10 p-2.5 rounded-xl border border-white/5">
                  <div className="flex justify-between text-[9px] font-mono">
                    <span className="text-text-secondary">Check-in Progress:</span>
                    <span className="text-cream">{stats.confirmedGuestsCount > 0 ? Math.round(((stats.checkinsCount || 0) / stats.confirmedGuestsCount) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${stats.confirmedGuestsCount > 0 ? Math.min(100, ((stats.checkinsCount || 0) / stats.confirmedGuestsCount) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Column 3: Logistics & Hospitality */}
              <div className="bg-[#121212]/30 border border-white/5 rounded-2xl p-5 space-y-4">
                <span className="text-[10px] uppercase font-mono tracking-wider text-gold/80 block border-b border-white/5 pb-2">
                  Logistics & Hospitality
                </span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] uppercase tracking-widest text-white/40 mb-1">Room Bookings</p>
                      <Hotel size={12} className="text-blue-400" />
                    </div>
                    <p className="font-serif text-xl text-cream">{stats.roomsCount}</p>
                    <p className="text-[9px] text-text-secondary mt-0.5">Assigned rooms</p>
                  </div>
                  <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] uppercase tracking-widest text-white/40 mb-1">Transport Cabs</p>
                      <Car size={12} className="text-purple-400" />
                    </div>
                    <p className="font-serif text-xl text-cream">{stats.transportCount}</p>
                    <p className="text-[9px] text-text-secondary mt-0.5">Transit needs</p>
                  </div>
                </div>
                <p className="text-[9px] font-mono text-text-secondary/60 leading-relaxed italic bg-black/10 p-2 rounded-lg text-center border border-white/5">
                  Accommodation and shuttles are scoped to the selected event.
                </p>
              </div>

            </div>

            {/* Attendance Target Meter Panel */}
            <div className="bg-[#121212]/40 border border-white/5 p-6 rounded-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <h5 className="font-serif text-base text-cream flex items-center gap-2">
                    <Users className="text-gold" size={16} /> Guest Attendance Target
                  </h5>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    Workspace: <strong className="text-cream">{stats.selectedEventName}</strong>
                  </p>
                </div>
                <div className="text-right">
                  {hasExpectedGuests ? (
                    <span className="px-3 py-1 rounded bg-gold/10 text-gold border border-gold/20 text-xs font-mono font-bold">
                      {capacityFilled}% Capacity Filled
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded bg-white/5 text-text-secondary border border-white/5 text-xs font-mono">
                      Target Capacity Not Set
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-3xl font-serif text-cream">{stats.confirmedGuestsCount}</p>
                    <p className="text-[10px] text-text-secondary uppercase">Confirmed VIP Attendants</p>
                  </div>
                  <div className="text-right font-mono text-xs">
                    {hasExpectedGuests ? (
                      <span className="text-text-secondary">
                        Target Goal: <strong className="text-cream">{stats.expectedGuests} guests</strong>
                      </span>
                    ) : (
                      <span className="text-amber-500 flex items-center gap-1">
                        <AlertCircle size={12} /> Expected guests count missing
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${hasExpectedGuests ? 'bg-gold' : 'bg-white/10 border-r border-dashed border-white/30'}`}
                    style={{ width: `${hasExpectedGuests ? capacityFilled : 0}%` }}
                  />
                </div>

                <div className="text-xs text-text-secondary/80 leading-relaxed">
                  {hasExpectedGuests ? (
                    <p>This event workspace is currently at <strong className="text-cream">{capacityFilled}%</strong> of its configured <strong className="text-cream">{stats.expectedGuests}</strong> expected guests target. You can adjust this threshold inside the Event Setup workspace panel.</p>
                  ) : (
                    <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl text-amber-500/90">
                      <AlertCircle size={14} className="mt-0.5 shrink-0" />
                      <p className="text-[11px]">
                        No <strong>Expected Guests</strong> target is currently set for this event workspace. Please access the <strong>Events</strong> manager or settings to enter your attendee capacity, which will unlock automatic capacity and budget fill charts.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-10 text-center bg-white/5 border border-white/5 rounded-2xl max-w-2xl mx-auto space-y-5">
            <Layers className="mx-auto text-gold/40" size={36} />
            <div>
              <h5 className="font-serif text-lg text-cream">No Event Workspace Selected</h5>
              <p className="text-xs text-text-secondary mt-1.5 max-w-md mx-auto leading-relaxed">
                Experience, accommodation, and RSVP trackers are scoped exclusively by event. Select an active workspace from the <strong>Events</strong> list to review check-ins, guest diets, cab requests, and hotel allocations.
              </p>
            </div>
            {onSelectWorkspace && (
              <button
                onClick={onSelectWorkspace}
                className="mt-2 py-2.5 px-5 bg-gold text-dark hover:brightness-110 rounded-xl font-mono text-[10px] uppercase tracking-widest font-bold transition-all inline-flex items-center gap-2 shadow-lg"
              >
                Select Event Workspace
              </button>
            )}
          </div>
        )}
      </div>

      {/* SECTION II: GLOBAL BUSINESS OVERVIEW */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <h4 className="font-serif text-lg text-gold flex items-center gap-2">
            <PieChart size={18} /> Global Enterprise Performance
          </h4>
          <span className="text-[10px] uppercase font-mono tracking-wider text-text-secondary">
            Cross-workspace analytics
          </span>
        </div>

        {/* 4 Cards for Global CRM/CMS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-black/20 p-5 rounded-2xl border border-white/5 hover:border-gold/15 transition-all">
            <div className="text-gold mb-3 p-2.5 bg-white/5 rounded-xl w-fit">
              <Calendar size={18} />
            </div>
            <p className="text-[9px] uppercase tracking-widest text-white/40 mb-1">Total System Events</p>
            <p className="font-serif text-2xl text-cream">{stats.totalEvents}</p>
            <p className="text-[10px] mt-1 text-gold/60 font-mono">{stats.activeEvents} Active / {stats.upcomingEvents} Planning</p>
          </div>

          <div className="bg-black/20 p-5 rounded-2xl border border-white/5 hover:border-gold/15 transition-all">
            <div className="text-gold mb-3 p-2.5 bg-white/5 rounded-xl w-fit">
              <FileText size={18} />
            </div>
            <p className="text-[9px] uppercase tracking-widest text-white/40 mb-1">Leads & Inquiries</p>
            <p className="font-serif text-2xl text-cream">{stats.totalInquiries}</p>
            <p className="text-[10px] mt-1 text-gold/60 font-mono">{stats.pendingInquiries} awaiting triage</p>
          </div>

          <div className="bg-black/20 p-5 rounded-2xl border border-white/5 hover:border-gold/15 transition-all">
            <div className="text-green-400 mb-3 p-2.5 bg-white/5 rounded-xl w-fit">
              <Briefcase size={18} />
            </div>
            <p className="text-[9px] uppercase tracking-widest text-white/40 mb-1">Published Services (CMS)</p>
            <p className="font-serif text-2xl text-cream">{stats.totalServices}</p>
            <p className="text-[10px] mt-1 text-green-400/60 font-mono">Active portfolio catalogues</p>
          </div>

          <div className="bg-black/20 p-5 rounded-2xl border border-white/5 hover:border-gold/15 transition-all">
            <div className="text-blue-400 mb-3 p-2.5 bg-white/5 rounded-xl w-fit">
              <Image size={18} />
            </div>
            <p className="text-[9px] uppercase tracking-widest text-white/40 mb-1">Showcase Assets (CMS)</p>
            <p className="font-serif text-2xl text-cream">{stats.galleryItems}</p>
            <p className="text-[10px] mt-1 text-blue-400/60 font-mono">Published gallery media</p>
          </div>
        </div>

        {/* Secondary Charts / Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Inquiry Funnel Conversion */}
          <div className="bg-[#121212]/40 border border-white/5 p-6 rounded-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h5 className="font-serif text-base text-cream flex items-center gap-2">
                <CheckCircle className="text-gold" size={16} /> Inquiry Funnel Conversion
              </h5>
              <span className="text-[10px] text-emerald-400 tracking-wider uppercase font-semibold">Triage Rate</span>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-3xl font-serif text-cream">{stats.totalInquiries - stats.pendingInquiries}</p>
                  <p className="text-[10px] text-text-secondary uppercase">Resolved Inquiries</p>
                </div>
                <p className="text-green-400 font-mono text-sm font-semibold">{inquiryPipelineRatio}% resolved</p>
              </div>

              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-green-400 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${inquiryPipelineRatio}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-text-secondary/60">
                <span>{stats.pendingInquiries} awaiting feedback</span>
                <span>{stats.totalInquiries} total leads received</span>
              </div>
            </div>
          </div>

          {/* Event Status Summary */}
          <div className="bg-[#121212]/40 border border-white/5 p-6 rounded-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h5 className="font-serif text-base text-cream flex items-center gap-2">
                <Calendar className="text-gold" size={16} /> Workspace Event Roster
              </h5>
              <span className="text-[10px] text-[#D4AF37] tracking-wider uppercase font-semibold">Total: {stats.totalEvents}</span>
            </div>

            <div className="space-y-3.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active / Ongoing
                </span>
                <span className="font-bold text-cream">{stats.activeEvents}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-amber-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Upcoming Planning
                </span>
                <span className="font-bold text-cream">{stats.upcomingEvents}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-blue-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" /> Completed Weddings
                </span>
                <span className="font-bold text-cream">{stats.completedEvents}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-white/40 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-white/20" /> Archived Workspaces
                </span>
                <span className="font-bold text-cream">{stats.archivedEvents}</span>
              </div>
            </div>
          </div>

          {/* Engagement spark chart with dynamic scaling */}
          <div className="bg-[#121212]/40 border border-white/5 p-6 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <h5 className="font-serif text-base text-cream flex items-center gap-2">
                <TrendingUp className="text-gold" size={16} /> Quarterly Trend Index
              </h5>
              <span className="text-[9px] font-mono text-white/30 lowercase">Real database activity</span>
            </div>

            <div className="flex-grow flex flex-col justify-center">
              {stats.engagementData && stats.engagementData.some(d => d.count > 0) ? (
                renderSparkline()
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-text-secondary font-mono italic">No engagement data available yet.</p>
                  <p className="text-[10px] text-white/30 mt-1">Submit RSVPs or inquiries to generate history.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
