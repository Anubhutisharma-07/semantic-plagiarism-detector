import React, { useState } from 'react';
import {
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  User,
  Shield,
  AlertTriangle,
  Info,
  AlertOctagon,
  Globe,
  Monitor,
  Hash,
  Tag,
} from 'lucide-react';
import { AuditLogEntry } from './auditTypes';

interface AuditTimelineEntryProps {
  entry: AuditLogEntry;
  isLast: boolean;
}

const severityConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  info: {
    icon: <Info className="w-3.5 h-3.5" />,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/40',
    border: 'border-blue-300 dark:border-blue-700',
  },
  warning: {
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    border: 'border-amber-300 dark:border-amber-700',
  },
  critical: {
    icon: <AlertOctagon className="w-3.5 h-3.5" />,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/40',
    border: 'border-red-300 dark:border-red-700',
  },
};

function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatAction(action: string): string {
  return action.replace('.', ' → ').split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default function AuditTimelineEntry({ entry, isLast }: AuditTimelineEntryProps) {
  const [expanded, setExpanded] = useState(false);
  const config = severityConfig[entry.severity] || severityConfig.info;

  return (
    <div className="relative flex gap-4">
      {/* Vertical Line + Dot */}
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.bg} ${config.color} border-2 ${config.border} z-10 flex-shrink-0`}>
          {config.icon}
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 bg-gradient-to-b from-neutral-200 dark:from-neutral-700 to-transparent min-h-[16px]" />
        )}
      </div>

      {/* Content Card */}
      <div className="flex-1 pb-4">
        <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-md">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-start justify-between gap-3 px-4 py-3 text-left hover:bg-white/30 dark:hover:bg-neutral-800/30 transition"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full ${config.bg} ${config.color}`}>
                  {entry.severity}
                </span>
                <span className="text-[10px] font-semibold text-neutral-600 dark:text-neutral-400">
                  {formatAction(entry.action)}
                </span>
              </div>
              <p className="text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed line-clamp-2">{entry.description}</p>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-neutral-400 dark:text-neutral-500">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {entry.actor.display_name}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatRelativeTime(entry.timestamp)}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {entry.target.name}
                </span>
              </div>
            </div>
            <div className="flex-shrink-0 mt-1">
              {expanded ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
            </div>
          </button>

          {expanded && (
            <div className="px-4 pb-4 border-t border-neutral-100 dark:border-neutral-800">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-xl">
                  <span className="text-[9px] text-neutral-400 uppercase font-semibold flex items-center gap-1">
                    <Hash className="w-2.5 h-2.5" /> Event ID
                  </span>
                  <p className="text-[10px] text-neutral-700 dark:text-neutral-300 font-mono mt-0.5 truncate">{entry.id}</p>
                </div>
                <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-xl">
                  <span className="text-[9px] text-neutral-400 uppercase font-semibold flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> Timestamp
                  </span>
                  <p className="text-[10px] text-neutral-700 dark:text-neutral-300 font-mono mt-0.5">
                    {new Date(entry.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-xl">
                  <span className="text-[9px] text-neutral-400 uppercase font-semibold flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5" /> Actor Role
                  </span>
                  <p className="text-[10px] text-neutral-700 dark:text-neutral-300 font-mono mt-0.5">{entry.actor.role}</p>
                </div>
                <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-xl">
                  <span className="text-[9px] text-neutral-400 uppercase font-semibold flex items-center gap-1">
                    <Globe className="w-2.5 h-2.5" /> IP Address
                  </span>
                  <p className="text-[10px] text-neutral-700 dark:text-neutral-300 font-mono mt-0.5">{entry.ip_address}</p>
                </div>
                <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-xl">
                  <span className="text-[9px] text-neutral-400 uppercase font-semibold flex items-center gap-1">
                    <Monitor className="w-2.5 h-2.5" /> User Agent
                  </span>
                  <p className="text-[10px] text-neutral-700 dark:text-neutral-300 font-mono mt-0.5 truncate">{entry.user_agent}</p>
                </div>
                <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-xl">
                  <span className="text-[9px] text-neutral-400 uppercase font-semibold flex items-center gap-1">
                    <Hash className="w-2.5 h-2.5" /> Session ID
                  </span>
                  <p className="text-[10px] text-neutral-700 dark:text-neutral-300 font-mono mt-0.5 truncate">{entry.session_id}</p>
                </div>
              </div>

              {entry.compliance_tags.length > 0 && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <Tag className="w-3 h-3 text-neutral-400" />
                  {entry.compliance_tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-violet-100 dark:bg-violet-900/40 text-[9px] text-violet-700 dark:text-violet-300 rounded-full font-semibold">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {Object.keys(entry.metadata).length > 0 && (
                <div className="mt-3 p-2 bg-neutral-50 dark:bg-neutral-950 rounded-xl">
                  <span className="text-[9px] text-neutral-400 uppercase font-semibold">Metadata</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Object.entries(entry.metadata).map(([k, v]) => (
                      <span key={k} className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-[9px] text-neutral-600 dark:text-neutral-400 rounded-full font-mono">
                        {k}: {String(v)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
