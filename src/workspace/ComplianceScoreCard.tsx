import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  BarChart3,
  TrendingUp,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { ComplianceRule, ComplianceReport } from './auditTypes';

interface ComplianceScoreCardProps {
  report: ComplianceReport;
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string; label: string }> = {
  compliant: {
    icon: <ShieldCheck className="w-4 h-4" />,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-900/40',
    border: 'border-emerald-300 dark:border-emerald-700',
    label: 'Compliant',
  },
  non_compliant: {
    icon: <ShieldX className="w-4 h-4" />,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/40',
    border: 'border-red-300 dark:border-red-700',
    label: 'Non-Compliant',
  },
  needs_review: {
    icon: <ShieldAlert className="w-4 h-4" />,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    border: 'border-amber-300 dark:border-amber-700',
    label: 'Needs Review',
  },
  exempt: {
    icon: <HelpCircle className="w-4 h-4" />,
    color: 'text-neutral-600 dark:text-neutral-400',
    bg: 'bg-neutral-100 dark:bg-neutral-800',
    border: 'border-neutral-300 dark:border-neutral-700',
    label: 'Exempt',
  },
};

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth="6"
          className="text-neutral-200 dark:text-neutral-800" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-neutral-900 dark:text-white">{score}</span>
        <span className="text-[8px] text-neutral-400 uppercase font-semibold">Score</span>
      </div>
    </div>
  );
}

function RuleCard({ rule }: { rule: ComplianceRule }) {
  const [expanded, setExpanded] = useState(false);
  const config = statusConfig[rule.status] || statusConfig.compliant;
  const progressPercent = rule.threshold > 0 ? Math.min((rule.current_value / rule.threshold) * 100, 100) : 0;

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
      rule.status === 'non_compliant' ? 'border-red-200 dark:border-red-800' :
      rule.status === 'needs_review' ? 'border-amber-200 dark:border-amber-800' :
      'border-neutral-200 dark:border-neutral-800'
    }`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/30 dark:hover:bg-neutral-800/30 transition bg-white/40 dark:bg-neutral-900/40"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${config.bg} ${config.color} flex-shrink-0`}>
            {config.icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">{rule.name}</p>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">{rule.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full ${config.bg} ${config.color}`}>
            {config.label}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-neutral-100 dark:border-neutral-800 mt-1">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
            <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-xl">
              <span className="text-[9px] text-neutral-400 uppercase font-semibold">Category</span>
              <p className="text-[10px] text-neutral-700 dark:text-neutral-300 mt-0.5">{rule.category}</p>
            </div>
            <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-xl">
              <span className="text-[9px] text-neutral-400 uppercase font-semibold">Severity</span>
              <p className={`text-[10px] mt-0.5 font-semibold ${
                rule.severity === 'critical' ? 'text-red-600 dark:text-red-400' :
                rule.severity === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                'text-blue-600 dark:text-blue-400'
              }`}>{rule.severity}</p>
            </div>
            <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-xl">
              <span className="text-[9px] text-neutral-400 uppercase font-semibold">Violations</span>
              <p className="text-[10px] text-neutral-700 dark:text-neutral-300 font-bold mt-0.5">{rule.violation_count}</p>
            </div>
            <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-xl">
              <span className="text-[9px] text-neutral-400 uppercase font-semibold">Last Evaluated</span>
              <p className="text-[10px] text-neutral-700 dark:text-neutral-300 font-mono mt-0.5">
                {new Date(rule.last_evaluated).toLocaleTimeString()}
              </p>
            </div>
          </div>

          {rule.threshold > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-[10px] text-neutral-500 mb-1">
                <span>Current: {rule.current_value}</span>
                <span>Threshold: {rule.threshold}</span>
              </div>
              <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    progressPercent >= 100 ? 'bg-emerald-500' : progressPercent >= 70 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-3 leading-relaxed">
            <span className="font-semibold">Check Function:</span>{' '}
            <code className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-[9px] font-mono">{rule.check_function}()</code>
          </p>
        </div>
      )}
    </div>
  );
}

export default function ComplianceScoreCard({ report }: ComplianceScoreCardProps) {
  const [showRecommendations, setShowRecommendations] = useState(false);

  return (
    <div className="space-y-4">
      {/* Overall Score Header */}
      <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl">
        <ScoreRing score={report.overall_score} size={90} />
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Compliance Score</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">{report.summary}</p>
          <div className="flex items-center gap-4 mt-2 flex-wrap justify-center sm:justify-start">
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3 h-3" /> {report.passed_checks} Passed
            </span>
            <span className="flex items-center gap-1 text-[10px] text-red-600 dark:text-red-400 font-semibold">
              <XCircle className="w-3 h-3" /> {report.failed_checks} Failed
            </span>
            <span className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
              <AlertTriangle className="w-3 h-3" /> {report.warning_checks} Warnings
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 text-[10px] text-neutral-400">
          <Clock className="w-3.5 h-3.5" />
          <span className="font-mono">{new Date(report.generated_at).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 mb-1" />
          <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{report.passed_checks}</span>
          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 uppercase font-semibold">Passed</span>
        </div>
        <div className="flex flex-col items-center p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl">
          <XCircle className="w-5 h-5 text-red-500 mb-1" />
          <span className="text-lg font-bold text-red-700 dark:text-red-300">{report.failed_checks}</span>
          <span className="text-[9px] text-red-600 dark:text-red-400 uppercase font-semibold">Failed</span>
        </div>
        <div className="flex flex-col items-center p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl">
          <AlertTriangle className="w-5 h-5 text-amber-500 mb-1" />
          <span className="text-lg font-bold text-amber-700 dark:text-amber-300">{report.warning_checks}</span>
          <span className="text-[9px] text-amber-600 dark:text-amber-400 uppercase font-semibold">Warnings</span>
        </div>
      </div>

      {/* Rule Cards */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
          Compliance Rules ({report.rules.length})
        </h4>
        {report.rules.map((rule) => (
          <RuleCard key={rule.id} rule={rule} />
        ))}
      </div>

      {/* Recommendations */}
      <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowRecommendations(!showRecommendations)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/30 dark:hover:bg-neutral-800/30 transition"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
              Recommendations ({report.recommendations.length})
            </span>
          </div>
          {showRecommendations ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
        </button>
        {showRecommendations && (
          <div className="px-4 pb-4 space-y-2">
            {report.recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2.5 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-100 dark:border-neutral-800">
                <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-[9px] font-bold text-amber-700 dark:text-amber-300 flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
