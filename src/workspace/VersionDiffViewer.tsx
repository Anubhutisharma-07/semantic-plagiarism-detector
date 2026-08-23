import React, { useState, useMemo } from 'react';
import {
  GitCompareArrows,
  Plus,
  Minus,
  Equal,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Info,
  FileText,
} from 'lucide-react';
import { VersionDiff, DiffChunk, ComparisonMode } from './versionTypes';

interface VersionDiffViewerProps {
  diff: VersionDiff;
  sourceFilename: string;
  targetFilename: string;
}

const operationStyles: Record<string, { bg: string; border: string; icon: React.ReactNode; label: string }> = {
  added: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-l-emerald-500',
    icon: <Plus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
    label: 'Added',
  },
  removed: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-l-red-500',
    icon: <Minus className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />,
    label: 'Removed',
  },
  unchanged: {
    bg: 'bg-neutral-50 dark:bg-neutral-900/30',
    border: 'border-l-neutral-300 dark:border-l-neutral-700',
    icon: <Equal className="w-3.5 h-3.5 text-neutral-400" />,
    label: 'Unchanged',
  },
  modified: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-l-amber-500',
    icon: <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
    label: 'Modified',
  },
};

function ChunkCard({ chunk, isExpanded, onToggle }: { chunk: DiffChunk; isExpanded: boolean; onToggle: () => void }) {
  const style = operationStyles[chunk.operation] || operationStyles.unchanged;

  return (
    <div className={`border-l-4 ${style.border} rounded-xl overflow-hidden transition-all duration-200 ${style.bg}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/30 dark:hover:bg-neutral-800/30 transition"
      >
        <div className="flex items-center gap-3">
          {style.icon}
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
            {style.label}
          </span>
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
            L{chunk.line_start}–{chunk.line_end}
          </span>
          {chunk.highlighted_spans.length > 0 && (
            <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-[10px] font-semibold rounded-full">
              {chunk.highlighted_spans.length} highlight{chunk.highlighted_spans.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-neutral-400 font-mono">
            confidence: {(chunk.confidence * 100).toFixed(0)}%
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4">
          <p className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap font-mono bg-white/40 dark:bg-neutral-900/40 rounded-lg p-3 border border-neutral-100 dark:border-neutral-800">
            {chunk.content}
          </p>
          {chunk.highlighted_spans.length > 0 && (
            <div className="mt-3 space-y-1">
              {chunk.highlighted_spans.map((span, idx) => (
                <div key={idx} className="flex items-center gap-2 text-[10px] text-violet-600 dark:text-violet-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0" />
                  <span className="font-medium">{span.label}</span>
                  <span className="text-neutral-400">(offset {span.start_offset}–{span.end_offset})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatPill({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className={`flex flex-col items-center px-4 py-3 rounded-2xl ${color} min-w-[90px]`}>
      <span className="text-lg font-bold text-neutral-900 dark:text-white">{value}</span>
      <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{label}</span>
    </div>
  );
}

export default function VersionDiffViewer({ diff, sourceFilename, targetFilename }: VersionDiffViewerProps) {
  const [expandedChunks, setExpandedChunks] = useState<Set<string>>(new Set(diff.content_changes.map((c) => c.id)));
  const [showStructural, setShowStructural] = useState(true);
  const [showCitations, setShowCitations] = useState(false);

  const toggleChunk = (id: string) => {
    setExpandedChunks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedChunks(new Set(diff.content_changes.map((c) => c.id)));
  const collapseAll = () => setExpandedChunks(new Set());

  const riskColor = diff.change_summary.risk_score < 0.3
    ? 'text-emerald-600 dark:text-emerald-400'
    : diff.change_summary.risk_score < 0.7
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-red-600 dark:text-red-400';

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl">
        <div className="flex items-center gap-3">
          <GitCompareArrows className="w-5 h-5 text-amber-500" />
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Diff Comparison</h3>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">
              {sourceFilename} → {targetFilename}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={expandAll} className="px-3 py-1.5 text-[10px] font-semibold text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 rounded-xl transition">
            Expand All
          </button>
          <button onClick={collapseAll} className="px-3 py-1.5 text-[10px] font-semibold text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 rounded-xl transition">
            Collapse All
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatPill label="Similarity" value={`${(diff.similarity_score * 100).toFixed(1)}%`} color="bg-white/60 dark:bg-neutral-900/60 backdrop-blur border border-neutral-200 dark:border-neutral-800" />
        <StatPill label="Added" value={`+${diff.total_lines_added}`} color="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800" />
        <StatPill label="Removed" value={`-${diff.total_lines_removed}`} color="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800" />
        <StatPill label="Word Δ" value={`${diff.word_count_delta > 0 ? '+' : ''}${diff.word_count_delta}`} color="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800" />
        <StatPill label="Risk" value={`${(diff.change_summary.risk_score * 100).toFixed(0)}%`} color="bg-white/60 dark:bg-neutral-900/60 backdrop-blur border border-neutral-200 dark:border-neutral-800" />
      </div>

      {/* Content Chunks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
            Content Changes ({diff.content_changes.length} chunks)
          </h4>
        </div>
        <div className="space-y-2">
          {diff.content_changes.map((chunk) => (
            <ChunkCard
              key={chunk.id}
              chunk={chunk}
              isExpanded={expandedChunks.has(chunk.id)}
              onToggle={() => toggleChunk(chunk.id)}
            />
          ))}
        </div>
      </div>

      {/* Structural Changes */}
      <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowStructural(!showStructural)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/30 dark:hover:bg-neutral-800/30 transition"
        >
          <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
            Structural Changes ({diff.structural_changes.length})
          </span>
          {showStructural ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
        </button>
        {showStructural && (
          <div className="px-4 pb-4 space-y-2">
            {diff.structural_changes.map((sc, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-100 dark:border-neutral-800">
                <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                  sc.severity === 'high' ? 'bg-red-500' : sc.severity === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200">{sc.description}</p>
                  <div className="flex items-center gap-4 mt-1">
                    {sc.old_value && <span className="text-[10px] text-red-500 line-through">{sc.old_value}</span>}
                    {sc.new_value && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{sc.new_value}</span>}
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full ${
                  sc.severity === 'high' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                  : sc.severity === 'medium' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                  : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                }`}>
                  {sc.severity}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Citation Changes */}
      <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowCitations(!showCitations)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/30 dark:hover:bg-neutral-800/30 transition"
        >
          <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
            Citation Changes ({diff.citation_changes.length})
          </span>
          {showCitations ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
        </button>
        {showCitations && (
          <div className="px-4 pb-4 space-y-2">
            {diff.citation_changes.map((cc, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-100 dark:border-neutral-800">
                {cc.operation === 'added' ? (
                  <Plus className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                ) : cc.operation === 'removed' ? (
                  <Minus className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                ) : (
                  <Equal className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                )}
                <span className="text-xs text-neutral-700 dark:text-neutral-300 flex-1">{cc.citation_text}</span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  L{cc.source_version_line ?? '—'} → L{cc.target_version_line ?? '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Risk Assessment */}
      <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          {diff.change_summary.risk_score < 0.3 ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          )}
          <h4 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Risk Assessment</h4>
          <span className={`text-sm font-bold ${riskColor}`}>
            {(diff.change_summary.risk_score * 100).toFixed(0)}%
          </span>
        </div>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-3 leading-relaxed">{diff.change_summary.recommendation}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {diff.change_summary.risk_factors.map((rf, idx) => (
            <div key={idx} className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-neutral-700 dark:text-neutral-300">{rf.factor}</span>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">{(rf.score * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${rf.score * 100}%` }}
                />
              </div>
              <p className="text-[9px] text-neutral-400 mt-1 leading-relaxed">{rf.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
