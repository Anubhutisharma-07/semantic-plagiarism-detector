import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  RotateCcw,
  Download,
  Clock,
  User,
  BarChart3,
  AlertTriangle,
  Eye,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Lock,
  Activity,
  FileText,
  Shield,
  TrendingUp,
  Zap,
  Globe,
  X,
} from 'lucide-react';
import {
  AuditLogEntry,
  AuditFilterOptions,
  AuditStats,
  ComplianceReport,
  SecurityAlert,
  AuditActorSummary,
  AuditAction,
  AuditSeverity,
  FilterPeriod,
} from './auditTypes';
import {
  generateMockAuditLogs,
  generateMockComplianceReport,
  generateMockStats,
  generateMockSecurityAlerts,
  generateMockActorSummaries,
} from './auditMockData';
import AuditTimelineEntry from './AuditTimelineEntry';
import ComplianceScoreCard from './ComplianceScoreCard';

type ViewMode = 'timeline' | 'compliance' | 'actors' | 'alerts';

const severityBadge: Record<AuditSeverity, { bg: string; color: string }> = {
  info: { bg: 'bg-blue-100 dark:bg-blue-900/40', color: 'text-blue-700 dark:text-blue-300' },
  warning: { bg: 'bg-amber-100 dark:bg-amber-900/40', color: 'text-amber-700 dark:text-amber-300' },
  critical: { bg: 'bg-red-100 dark:bg-red-900/40', color: 'text-red-700 dark:text-red-300' },
};

function StatCard({ icon, label, value, color = 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400' }: { icon: React.ReactNode; label: string; value: string | number; color?: string }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-neutral-900 dark:text-white leading-tight">{value}</p>
        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}

function AlertCard({ alert }: { alert: SecurityAlert }) {
  const [expanded, setExpanded] = useState(false);
  const sevBadge = severityBadge[alert.severity];

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
      alert.severity === 'critical' ? 'border-red-200 dark:border-red-800' :
      alert.severity === 'warning' ? 'border-amber-200 dark:border-amber-800' :
      'border-neutral-200 dark:border-neutral-800'
    } ${alert.resolved ? 'opacity-60' : ''}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start justify-between gap-3 px-4 py-3 text-left hover:bg-white/30 dark:hover:bg-neutral-800/30 transition bg-white/40 dark:bg-neutral-900/40"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full ${sevBadge.bg} ${sevBadge.color}`}>
              {alert.severity}
            </span>
            <span className="text-[10px] text-neutral-500 font-mono">{alert.alert_type.replace('_', ' ')}</span>
            {alert.resolved && (
              <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                Resolved
              </span>
            )}
          </div>
          <p className="text-xs font-bold text-neutral-900 dark:text-white">{alert.title}</p>
          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">{alert.description}</p>
        </div>
        <div className="flex-shrink-0 mt-1">
          {expanded ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-neutral-100 dark:border-neutral-800">
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-xl">
              <span className="text-[9px] text-neutral-400 uppercase font-semibold">Affected User</span>
              <p className="text-[10px] text-neutral-700 dark:text-neutral-300 mt-0.5">{alert.affected_user}</p>
            </div>
            <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-xl">
              <span className="text-[9px] text-neutral-400 uppercase font-semibold">Resource</span>
              <p className="text-[10px] text-neutral-700 dark:text-neutral-300 mt-0.5">{alert.affected_resource}</p>
            </div>
            <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-xl">
              <span className="text-[9px] text-neutral-400 uppercase font-semibold">Detected At</span>
              <p className="text-[10px] text-neutral-700 dark:text-neutral-300 font-mono mt-0.5">{new Date(alert.detected_at).toLocaleString()}</p>
            </div>
            {alert.resolved_at && (
              <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-xl">
                <span className="text-[9px] text-neutral-400 uppercase font-semibold">Resolved By</span>
                <p className="text-[10px] text-neutral-700 dark:text-neutral-300 mt-0.5">{alert.resolved_by}</p>
              </div>
            )}
          </div>
          <div className="mt-3">
            <span className="text-[9px] text-neutral-400 uppercase font-semibold">Mitigation Steps</span>
            <div className="space-y-1 mt-1">
              {alert.mitigation_steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2 text-[10px] text-neutral-600 dark:text-neutral-400">
                  <span className="w-4 h-4 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-[8px] font-bold flex-shrink-0">
                    {idx + 1}
                  </span>
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActorSummaryCard({ actor }: { actor: AuditActorSummary }) {
  const riskColor = actor.risk_score < 0.2 ? 'text-emerald-600 dark:text-emerald-400' : actor.risk_score < 0.5 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';

  return (
    <div className="p-4 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-700 dark:text-amber-300 font-bold text-xs">
          {actor.display_name.split(' ').map((n) => n[0]).join('')}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">{actor.display_name}</p>
          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">@{actor.username}</p>
        </div>
        <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 ml-auto">
          {actor.role}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-xl text-center">
          <span className="text-base font-bold text-neutral-900 dark:text-white">{actor.total_events}</span>
          <p className="text-[9px] text-neutral-400 uppercase font-semibold">Events</p>
        </div>
        <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-xl text-center">
          <span className={`text-base font-bold ${actor.critical_events > 0 ? 'text-red-600 dark:text-red-400' : 'text-neutral-900 dark:text-white'}`}>{actor.critical_events}</span>
          <p className="text-[9px] text-neutral-400 uppercase font-semibold">Critical</p>
        </div>
        <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-xl text-center">
          <span className="text-base font-bold text-neutral-900 dark:text-white">{actor.sessions_count}</span>
          <p className="text-[9px] text-neutral-400 uppercase font-semibold">Sessions</p>
        </div>
        <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-xl text-center">
          <span className={`text-base font-bold ${riskColor}`}>{(actor.risk_score * 100).toFixed(0)}%</span>
          <p className="text-[9px] text-neutral-400 uppercase font-semibold">Risk</p>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-3 text-[10px] text-neutral-400">
        <span className="flex items-center gap-1">
          <Activity className="w-3 h-3" />
          {actor.most_common_action.replace('.', ' → ')}
        </span>
        <span className="flex items-center gap-1">
          <Globe className="w-3 h-3" />
          {actor.unique_ips} IP{actor.unique_ips > 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}

export default function AuditComplianceDashboard() {
  const allLogs = useMemo(() => generateMockAuditLogs(), []);
  const complianceReport = useMemo(() => generateMockComplianceReport(), []);
  const stats = useMemo(() => generateMockStats(), []);
  const securityAlerts = useMemo(() => generateMockSecurityAlerts(), []);
  const actorSummaries = useMemo(() => generateMockActorSummaries(), []);

  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [filters, setFilters] = useState<AuditFilterOptions>({
    search: '',
    action: '',
    severity: '',
    actor: '',
    period: '30d',
    date_from: '',
    date_to: '',
    compliance_tag: '',
    sort_by: 'timestamp',
    sort_order: 'desc',
  });

  const availableActions = useMemo(() => Array.from(new Set(allLogs.map((l) => l.action))), [allLogs]);
  const availableActors = useMemo(() => Array.from(new Set(allLogs.map((l) => l.actor.username))), [allLogs]);
  const availableTags = useMemo(() => Array.from(new Set(allLogs.flatMap((l) => l.compliance_tags))), [allLogs]);

  const filteredLogs = useMemo(() => {
    return allLogs.filter((l) => {
      if (filters.search && !l.description.toLowerCase().includes(filters.search.toLowerCase()) && !l.actor.display_name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.action && l.action !== filters.action) return false;
      if (filters.severity && l.severity !== filters.severity) return false;
      if (filters.actor && l.actor.username !== filters.actor) return false;
      if (filters.compliance_tag && !l.compliance_tags.includes(filters.compliance_tag)) return false;
      return true;
    }).sort((a, b) => {
      if (filters.sort_by === 'timestamp') {
        const cmp = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        return filters.sort_order === 'desc' ? -cmp : cmp;
      }
      return 0;
    });
  }, [allLogs, filters]);

  const resetFilters = () => {
    setFilters({ search: '', action: '', severity: '', actor: '', period: '30d', date_from: '', date_to: '', compliance_tag: '', sort_by: 'timestamp', sort_order: 'desc' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-amber-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-amber-950/10 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Title Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              Audit Trail & Compliance
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Monitor system activity, enforce compliance rules, and track security events
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(['timeline', 'compliance', 'actors', 'alerts'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-xl transition ${
                  viewMode === mode
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                {mode === 'timeline' && <Clock className="w-3 h-3 inline mr-1" />}
                {mode === 'compliance' && <Shield className="w-3 h-3 inline mr-1" />}
                {mode === 'actors' && <User className="w-3 h-3 inline mr-1" />}
                {mode === 'alerts' && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={<Activity className="w-5 h-5" />} label="Events Today" value={stats.total_events_today} />
          <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="Critical Today" value={stats.critical_events_today} color="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400" />
          <StatCard icon={<User className="w-5 h-5" />} label="Active Users" value={stats.active_users_24h} color="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400" />
          <StatCard icon={<Zap className="w-5 h-5" />} label="API Calls" value={stats.api_calls_24h.toLocaleString()} color="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" />
        </div>

        {/* View: Timeline */}
        {viewMode === 'timeline' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col lg:flex-row gap-3 p-4 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search audit events..."
                  value={filters.search}
                  onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select value={filters.action} onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value as AuditAction | '' }))} className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium">
                  <option value="">All Actions</option>
                  {availableActions.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <select value={filters.severity} onChange={(e) => setFilters((f) => ({ ...f, severity: e.target.value as AuditSeverity | '' }))} className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium">
                  <option value="">All Severities</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
                <select value={filters.actor} onChange={(e) => setFilters((f) => ({ ...f, actor: e.target.value }))} className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium">
                  <option value="">All Users</option>
                  {availableActors.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <select value={filters.compliance_tag} onChange={(e) => setFilters((f) => ({ ...f, compliance_tag: e.target.value }))} className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium">
                  <option value="">All Tags</option>
                  {availableTags.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <button onClick={resetFilters} className="p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition" title="Reset filters">
                  <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
                </button>
              </div>
            </div>

            <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold text-neutral-500">{filteredLogs.length} events</span>
              </div>
              {filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
                  <Clock className="w-8 h-8 mb-2" />
                  <p className="text-xs font-medium">No audit events match the current filters.</p>
                </div>
              ) : (
                filteredLogs.map((entry, idx) => (
                  <AuditTimelineEntry key={entry.id} entry={entry} isLast={idx === filteredLogs.length - 1} />
                ))
              )}
            </div>
          </div>
        )}

        {/* View: Compliance */}
        {viewMode === 'compliance' && (
          <ComplianceScoreCard report={complianceReport} />
        )}

        {/* View: Actors */}
        {viewMode === 'actors' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {actorSummaries.map((actor) => (
              <ActorSummaryCard key={actor.username} actor={actor} />
            ))}
          </div>
        )}

        {/* View: Alerts */}
        {viewMode === 'alerts' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                Security Alerts ({securityAlerts.length})
              </span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
                  {securityAlerts.filter((a) => !a.resolved).length} Active
                </span>
                <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                  {securityAlerts.filter((a) => a.resolved).length} Resolved
                </span>
              </div>
            </div>
            {securityAlerts.sort((a, b) => (a.resolved === b.resolved ? 0 : a.resolved ? 1 : -1)).map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
