import React, { useState, useMemo } from 'react';
import {
  GitBranch,
  GitCompareArrows,
  Search,
  Filter,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  User,
  Hash,
  BarChart3,
  Layers,
  TrendingUp,
  HardDrive,
  ArrowUpDown,
  Eye,
  X,
} from 'lucide-react';
import {
  DocumentVersion,
  VersionDiff,
  VersionFilterOptions,
  VersionStats,
  VersionTimelineEntry,
  VersionStatus,
} from './versionTypes';
import {
  generateMockVersions,
  generateMockDiff,
  generateMockTimeline,
  generateMockStats,
} from './versionMockData';
import VersionDiffViewer from './VersionDiffViewer';
import VersionHistoryTimeline from './VersionHistoryTimeline';

const statusConfig: Record<VersionStatus, { label: string; color: string; bg: string }> = {
  current: { label: 'Current', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-100 dark:bg-emerald-900/40' },
  archived: { label: 'Archived', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-100 dark:bg-blue-900/40' },
  deleted: { label: 'Deleted', color: 'text-red-700 dark:text-red-300', bg: 'bg-red-100 dark:bg-red-900/40' },
  superseded: { label: 'Superseded', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-100 dark:bg-amber-900/40' },
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StatCard({ icon, label, value, subtext }: { icon: React.ReactNode; label: string; value: string | number; subtext?: string }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl hover:shadow-md transition-shadow">
      <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-neutral-900 dark:text-white leading-tight">{value}</p>
        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium uppercase tracking-wider">{label}</p>
        {subtext && <p className="text-[9px] text-neutral-400 dark:text-neutral-500 mt-0.5 truncate">{subtext}</p>}
      </div>
    </div>
  );
}

function VersionCard({
  version,
  isSelected,
  onSelect,
  isCompareTarget,
}: {
  version: DocumentVersion;
  isSelected: boolean;
  onSelect: (id: string) => void;
  isCompareTarget: boolean;
}) {
  const status = statusConfig[version.status];
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`border-2 rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'border-amber-400 dark:border-amber-600 shadow-lg shadow-amber-500/10'
          : isCompareTarget
          ? 'border-violet-400 dark:border-violet-600 shadow-lg shadow-violet-500/10'
          : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
      }`}
      onClick={() => onSelect(version.id)}
    >
      <div className="p-4 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-bold text-neutral-900 dark:text-white font-mono">
                v{version.version_number}
              </span>
              <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full ${status.bg} ${status.color}`}>
                {status.label}
              </span>
            </div>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-2">
              {version.commit_message}
            </p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5 text-neutral-400" /> : <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />}
          </button>
        </div>

        <div className="flex items-center gap-3 mt-2 text-[10px] text-neutral-400 dark:text-neutral-500">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {version.uploaded_by}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(version.upload_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
          <span className="flex items-center gap-1">
            <Hash className="w-3 h-3" />
            {version.word_count.toLocaleString()} words
          </span>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 grid grid-cols-2 gap-2">
            <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-xl">
              <span className="text-[9px] text-neutral-400 uppercase font-semibold">Characters</span>
              <p className="text-[10px] text-neutral-700 dark:text-neutral-300 font-mono">{version.char_count.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-xl">
              <span className="text-[9px] text-neutral-400 uppercase font-semibold">Chunks</span>
              <p className="text-[10px] text-neutral-700 dark:text-neutral-300 font-mono">{version.chunk_count}</p>
            </div>
            <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-xl">
              <span className="text-[9px] text-neutral-400 uppercase font-semibold">File Hash</span>
              <p className="text-[10px] text-neutral-700 dark:text-neutral-300 font-mono truncate">{version.file_hash}</p>
            </div>
            <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-xl">
              <span className="text-[9px] text-neutral-400 uppercase font-semibold">Language</span>
              <p className="text-[10px] text-neutral-700 dark:text-neutral-300 font-mono">{version.metadata.detected_language ?? '—'}</p>
            </div>
            <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-xl">
              <span className="text-[9px] text-neutral-400 uppercase font-semibold">Pages</span>
              <p className="text-[10px] text-neutral-700 dark:text-neutral-300 font-mono">{version.metadata.page_count ?? '—'}</p>
            </div>
            <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-xl">
              <span className="text-[9px] text-neutral-400 uppercase font-semibold">Citations</span>
              <p className="text-[10px] text-neutral-700 dark:text-neutral-300 font-mono">{version.metadata.citation_count}</p>
            </div>
          </div>
        )}

        {version.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {version.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-[9px] text-neutral-500 rounded-full font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type ViewMode = 'versions' | 'compare' | 'timeline';

export default function VersionComparisonDashboard() {
  const allVersions = useMemo(() => generateMockVersions(), []);
  const stats = useMemo(() => generateMockStats(), []);
  const timeline = useMemo(() => generateMockTimeline(), []);

  const [viewMode, setViewMode] = useState<ViewMode>('versions');
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [compareTargetId, setCompareTargetId] = useState<string | null>(null);
  const [filters, setFilters] = useState<VersionFilterOptions>({
    search: '',
    status: '',
    class_section: '',
    uploaded_by: '',
    date_from: '',
    date_to: '',
    min_word_count: 0,
    max_word_count: 99999,
    sort_by: 'date',
    sort_order: 'desc',
  });

  const availableClasses = useMemo(() => Array.from(new Set(allVersions.map((v) => v.metadata.class_section).filter(Boolean))), [allVersions]);
  const availableAuthors = useMemo(() => Array.from(new Set(allVersions.map((v) => v.uploaded_by))), [allVersions]);

  const filteredVersions = useMemo(() => {
    return allVersions
      .filter((v) => {
        if (filters.search && !v.filename.toLowerCase().includes(filters.search.toLowerCase()) && !v.commit_message.toLowerCase().includes(filters.search.toLowerCase()) && !v.uploaded_by.toLowerCase().includes(filters.search.toLowerCase())) return false;
        if (filters.status && v.status !== filters.status) return false;
        if (filters.class_section && v.metadata.class_section !== filters.class_section) return false;
        if (filters.uploaded_by && v.uploaded_by !== filters.uploaded_by) return false;
        if (v.word_count < filters.min_word_count || v.word_count > filters.max_word_count) return false;
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (filters.sort_by === 'date') cmp = new Date(a.upload_date).getTime() - new Date(b.upload_date).getTime();
        else if (filters.sort_by === 'word_count') cmp = a.word_count - b.word_count;
        else if (filters.sort_by === 'version_number') cmp = a.version_number - b.version_number;
        return filters.sort_order === 'desc' ? -cmp : cmp;
      });
  }, [allVersions, filters]);

  const computedDiff = useMemo(() => {
    if (!selectedVersionId || !compareTargetId) return null;
    return generateMockDiff(selectedVersionId, compareTargetId);
  }, [selectedVersionId, compareTargetId]);

  const selectedVersion = allVersions.find((v) => v.id === selectedVersionId);
  const compareTarget = allVersions.find((v) => v.id === compareTargetId);

  const handleSelectVersion = (id: string) => {
    if (viewMode === 'compare') {
      if (!selectedVersionId) {
        setSelectedVersionId(id);
      } else if (!compareTargetId) {
        setCompareTargetId(id);
      } else {
        setSelectedVersionId(id);
        setCompareTargetId(null);
      }
    } else {
      setSelectedVersionId(id === selectedVersionId ? null : id);
    }
  };

  const resetFilters = () => {
    setFilters({ search: '', status: '', class_section: '', uploaded_by: '', date_from: '', date_to: '', min_word_count: 0, max_word_count: 99999, sort_by: 'date', sort_order: 'desc' });
  };

  const resetCompare = () => {
    setSelectedVersionId(null);
    setCompareTargetId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-amber-50/30 dark:from-neutral-950 dark:via-neutral-900 dark:to-amber-950/10 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Title Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-amber-500" />
              Document Version Explorer
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Track, compare, and analyze document revision history
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(['versions', 'compare', 'timeline'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => { setViewMode(mode); if (mode !== 'compare') resetCompare(); }}
                className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-xl transition ${
                  viewMode === mode
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                {mode === 'versions' && <Layers className="w-3 h-3 inline mr-1" />}
                {mode === 'compare' && <GitCompareArrows className="w-3 h-3 inline mr-1" />}
                {mode === 'timeline' && <Clock className="w-3 h-3 inline mr-1" />}
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={<Layers className="w-5 h-5" />} label="Total Versions" value={stats.total_versions} subtext={`Across ${stats.total_documents} documents`} />
          <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Avg Similarity" value={`${(stats.avg_similarity_between_versions * 100).toFixed(0)}%`} subtext="Between consecutive versions" />
          <StatCard icon={<BarChart3 className="w-5 h-5" />} label="Changes Today" value={stats.recent_changes_today} subtext="Uploads and updates" />
          <StatCard icon={<HardDrive className="w-5 h-5" />} label="Storage Used" value={formatBytes(stats.storage_used_bytes)} subtext={stats.most_edited_document.filename} />
        </div>

        {/* View: Versions */}
        {viewMode === 'versions' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col lg:flex-row gap-3 p-4 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search by filename, message, or author..."
                  value={filters.search}
                  onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as VersionStatus | '' }))}
                  className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium"
                >
                  <option value="">All Statuses</option>
                  <option value="current">Current</option>
                  <option value="superseded">Superseded</option>
                  <option value="archived">Archived</option>
                  <option value="deleted">Deleted</option>
                </select>
                <select
                  value={filters.class_section}
                  onChange={(e) => setFilters((f) => ({ ...f, class_section: e.target.value }))}
                  className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium"
                >
                  <option value="">All Classes</option>
                  {availableClasses.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                  value={filters.uploaded_by}
                  onChange={(e) => setFilters((f) => ({ ...f, uploaded_by: e.target.value }))}
                  className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium"
                >
                  <option value="">All Authors</option>
                  {availableAuthors.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <select
                  value={filters.sort_by}
                  onChange={(e) => setFilters((f) => ({ ...f, sort_by: e.target.value as any }))}
                  className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium"
                >
                  <option value="date">Sort: Date</option>
                  <option value="word_count">Sort: Word Count</option>
                  <option value="version_number">Sort: Version #</option>
                </select>
                <button
                  onClick={() => setFilters((f) => ({ ...f, sort_order: f.sort_order === 'asc' ? 'desc' : 'asc' }))}
                  className="p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                  title="Toggle sort order"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500" />
                </button>
                <button onClick={resetFilters} className="p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition" title="Reset filters">
                  <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
                </button>
              </div>
            </div>

            {/* Version Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredVersions.map((v) => (
                <VersionCard
                  key={v.id}
                  version={v}
                  isSelected={selectedVersionId === v.id}
                  isCompareTarget={compareTargetId === v.id}
                  onSelect={handleSelectVersion}
                />
              ))}
              {filteredVersions.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-neutral-400">
                  <FileText className="w-8 h-8 mb-2" />
                  <p className="text-xs font-medium">No versions match the current filters.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* View: Compare */}
        {viewMode === 'compare' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl">
              <div className="flex items-center gap-2 flex-1">
                <div className={`px-3 py-2 rounded-xl text-xs font-medium border ${selectedVersionId ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300' : 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-400'}`}>
                  {selectedVersion ? `v${selectedVersion.version_number} — ${selectedVersion.filename}` : 'Select source version'}
                </div>
                <GitCompareArrows className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                <div className={`px-3 py-2 rounded-xl text-xs font-medium border ${compareTargetId ? 'bg-violet-50 dark:bg-violet-950/30 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300' : 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-400'}`}>
                  {compareTarget ? `v${compareTarget.version_number} — ${compareTarget.filename}` : 'Select target version'}
                </div>
              </div>
              {(selectedVersionId || compareTargetId) && (
                <button onClick={resetCompare} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition">
                  <X className="w-4 h-4 text-neutral-400" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {allVersions.map((v) => (
                <VersionCard
                  key={v.id}
                  version={v}
                  isSelected={selectedVersionId === v.id}
                  isCompareTarget={compareTargetId === v.id}
                  onSelect={handleSelectVersion}
                />
              ))}
            </div>

            {computedDiff && selectedVersion && compareTarget && (
              <VersionDiffViewer
                diff={computedDiff}
                sourceFilename={`${selectedVersion.filename} (v${selectedVersion.version_number})`}
                targetFilename={`${compareTarget.filename} (v${compareTarget.version_number})`}
              />
            )}
          </div>
        )}

        {/* View: Timeline */}
        {viewMode === 'timeline' && (
          <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4">
            <VersionHistoryTimeline entries={timeline} />
          </div>
        )}
      </div>
    </div>
  );
}
