import React, { useState } from 'react';
import {
  Clock,
  GitBranch,
  GitCompareArrows,
  Trash2,
  RotateCcw,
  Merge,
  Upload,
  User,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  Filter,
  X,
} from 'lucide-react';
import { VersionTimelineEntry } from './versionTypes';

interface VersionHistoryTimelineProps {
  entries: VersionTimelineEntry[];
  documentFilter?: string;
}

const eventTypeConfig: Record<string, { icon: React.ReactNode; color: string; bgColor: string; borderColor: string; label: string }> = {
  created: {
    icon: <Upload className="w-3.5 h-3.5" />,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/40',
    borderColor: 'border-emerald-300 dark:border-emerald-700',
    label: 'Created',
  },
  updated: {
    icon: <GitBranch className="w-3.5 h-3.5" />,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/40',
    borderColor: 'border-blue-300 dark:border-blue-700',
    label: 'Updated',
  },
  compared: {
    icon: <GitCompareArrows className="w-3.5 h-3.5" />,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/40',
    borderColor: 'border-amber-300 dark:border-amber-700',
    label: 'Compared',
  },
  deleted: {
    icon: <Trash2 className="w-3.5 h-3.5" />,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/40',
    borderColor: 'border-red-300 dark:border-red-700',
    label: 'Deleted',
  },
  restored: {
    icon: <RotateCcw className="w-3.5 h-3.5" />,
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-100 dark:bg-violet-900/40',
    borderColor: 'border-violet-300 dark:border-violet-700',
    label: 'Restored',
  },
  merged: {
    icon: <Merge className="w-3.5 h-3.5" />,
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-100 dark:bg-pink-900/40',
    borderColor: 'border-pink-300 dark:border-pink-700',
    label: 'Merged',
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
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function TimelineEntry({ entry, isLast }: { entry: VersionTimelineEntry; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const config = eventTypeConfig[entry.event_type] || eventTypeConfig.created;

  return (
    <div className="relative flex gap-4">
      {/* Vertical Line + Dot */}
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.bgColor} ${config.color} border-2 ${config.borderColor} z-10 flex-shrink-0`}>
          {config.icon}
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 bg-gradient-to-b from-neutral-200 dark:from-neutral-700 to-transparent min-h-[20px]" />
        )}
      </div>

      {/* Content Card */}
      <div className="flex-1 pb-6">
        <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-md">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-start justify-between gap-3 px-4 py-3 text-left hover:bg-white/30 dark:hover:bg-neutral-800/30 transition"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full ${config.bgColor} ${config.color}`}>
                  {config.label}
                </span>
                <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 font-mono">
                  v{entry.version_number}
                </span>
              </div>
              <p className="text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed line-clamp-2">{entry.details}</p>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-neutral-400 dark:text-neutral-500">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {entry.actor}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatRelativeTime(entry.timestamp)}
                </span>
              </div>
            </div>
            <div className="flex-shrink-0 mt-1">
              {expanded ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
            </div>
          </button>

          {expanded && (
            <div className="px-4 pb-4 border-t border-neutral-100 dark:border-neutral-800">
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-xl">
                  <span className="text-[9px] text-neutral-400 uppercase font-semibold">Event ID</span>
                  <p className="text-[10px] text-neutral-700 dark:text-neutral-300 font-mono mt-0.5">{entry.id}</p>
                </div>
                <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-xl">
                  <span className="text-[9px] text-neutral-400 uppercase font-semibold">Version ID</span>
                  <p className="text-[10px] text-neutral-700 dark:text-neutral-300 font-mono mt-0.5">{entry.version_id}</p>
                </div>
                <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-xl">
                  <span className="text-[9px] text-neutral-400 uppercase font-semibold">Timestamp</span>
                  <p className="text-[10px] text-neutral-700 dark:text-neutral-300 font-mono mt-0.5">
                    {new Date(entry.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-xl">
                  <span className="text-[9px] text-neutral-400 uppercase font-semibold">Document</span>
                  <p className="text-[10px] text-neutral-700 dark:text-neutral-300 font-mono mt-0.5">{entry.document_id}</p>
                </div>
              </div>
              {entry.metadata && Object.keys(entry.metadata).length > 0 && (
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

export default function VersionHistoryTimeline({ entries, documentFilter }: VersionHistoryTimelineProps) {
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = entries.filter((e) => {
    if (typeFilter && e.event_type !== typeFilter) return false;
    if (documentFilter && e.document_id !== documentFilter) return false;
    return true;
  });

  const uniqueTypes = Array.from(new Set(entries.map((e) => e.event_type)));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
            Activity Timeline
          </h3>
          <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-[10px] font-semibold text-neutral-500 rounded-full">
            {filtered.length} events
          </span>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold rounded-xl transition ${
            typeFilter ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          }`}
        >
          <Filter className="w-3 h-3" />
          Filter
          {typeFilter && (
            <span onClick={(e) => { e.stopPropagation(); setTypeFilter(''); }} className="ml-1 cursor-pointer">
              <X className="w-3 h-3" />
            </span>
          )}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 p-3 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl">
          {uniqueTypes.map((type) => {
            const config = eventTypeConfig[type] || eventTypeConfig.created;
            const isActive = typeFilter === type;
            return (
              <button
                key={type}
                onClick={() => setTypeFilter(isActive ? '' : type)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold rounded-xl border transition ${
                  isActive
                    ? `${config.bgColor} ${config.color} ${config.borderColor}`
                    : 'bg-neutral-50 dark:bg-neutral-950 text-neutral-500 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                {config.icon}
                {config.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-400 dark:text-neutral-600">
            <Clock className="w-8 h-8 mb-2" />
            <p className="text-xs font-medium">No timeline events match the current filter.</p>
          </div>
        ) : (
          filtered.map((entry, idx) => (
            <TimelineEntry key={entry.id} entry={entry} isLast={idx === filtered.length - 1} />
          ))
        )}
      </div>
    </div>
  );
}
