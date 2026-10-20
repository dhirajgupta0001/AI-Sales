import React from 'react';
import { SalesStatus } from '../../types';
import { 
  CheckCircle2, 
  Sparkles, 
  CalendarClock, 
  Clock, 
  XCircle, 
  PhoneOff 
} from 'lucide-react';

interface StatusBadgeProps {
  status: SalesStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  size = 'md', 
  showIcon = true 
}) => {
  const getStyle = () => {
    switch (status) {
      case 'Converted':
        return {
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]',
          dot: 'bg-emerald-400',
          icon: <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
        };
      case 'Interested':
        return {
          bg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)]',
          dot: 'bg-indigo-400',
          icon: <Sparkles className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
        };
      case 'Demo Requested':
        return {
          bg: 'bg-violet-500/10 text-violet-300 border-violet-500/30 shadow-[0_0_12px_rgba(139,92,246,0.15)]',
          dot: 'bg-violet-400',
          icon: <CalendarClock className="w-3.5 h-3.5 shrink-0 text-violet-400" />
        };
      case 'Follow-up Required':
        return {
          bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]',
          dot: 'bg-amber-400',
          icon: <Clock className="w-3.5 h-3.5 shrink-0 text-amber-400" />
        };
      case 'Not Interested':
        return {
          bg: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
          dot: 'bg-rose-400',
          icon: <XCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
        };
      case 'No Response':
        return {
          bg: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
          dot: 'bg-slate-400',
          icon: <PhoneOff className="w-3.5 h-3.5 shrink-0 text-slate-400" />
        };
      default:
        return {
          bg: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
          dot: 'bg-slate-400',
          icon: null
        };
    }
  };

  const style = getStyle();

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-medium'
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border transition-all ${style.bg} ${sizeClasses[size]}`}
    >
      {showIcon ? style.icon : <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />}
      <span>{status}</span>
    </span>
  );
};
