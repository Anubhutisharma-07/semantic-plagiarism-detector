export type AuditAction =
  | 'document.upload'
  | 'document.download'
  | 'document.delete'
  | 'document.restore'
  | 'document.share'
  | 'scan.initiated'
  | 'scan.completed'
  | 'scan.failed'
  | 'user.login'
  | 'user.logout'
  | 'user.role_changed'
  | 'settings.updated'
  | 'api_key.created'
  | 'api_key.revoked'
  | 'export.generated'
  | 'corpus.cleared'
  | 'threshold.changed';

export type AuditSeverity = 'info' | 'warning' | 'critical';
export type ComplianceStatus = 'compliant' | 'non_compliant' | 'needs_review' | 'exempt';
export type FilterPeriod = 'today' | '7d' | '30d' | '90d' | 'custom';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  actor: AuditActor;
  target: AuditTarget;
  severity: AuditSeverity;
  description: string;
  ip_address: string;
  user_agent: string;
  metadata: Record<string, string | number | boolean>;
  session_id: string;
  compliance_tags: string[];
}

export interface AuditActor {
  user_id: string;
  username: string;
  display_name: string;
  role: string;
  email: string;
  avatar_url?: string;
}

export interface AuditTarget {
  type: 'document' | 'user' | 'system' | 'api_key' | 'setting';
  id: string;
  name: string;
  owner?: string;
}

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: AuditSeverity;
  check_function: string;
  last_evaluated: string;
  status: ComplianceStatus;
  violation_count: number;
  threshold: number;
  current_value: number;
}

export interface ComplianceReport {
  id: string;
  generated_at: string;
  period_start: string;
  period_end: string;
  overall_score: number;
  total_checks: number;
  passed_checks: number;
  failed_checks: number;
  warning_checks: number;
  rules: ComplianceRule[];
  summary: string;
  recommendations: string[];
}

export interface AuditStats {
  total_events_today: number;
  total_events_7d: number;
  total_events_30d: number;
  critical_events_today: number;
  active_users_24h: number;
  failed_logins_24h: number;
  documents_uploaded_7d: number;
  documents_deleted_7d: number;
  api_calls_24h: number;
  avg_response_time_ms: number;
  top_actions: { action: AuditAction; count: number }[];
  top_actors: { username: string; event_count: number }[];
  hourly_distribution: { hour: number; count: number }[];
}

export interface AuditFilterOptions {
  search: string;
  action: AuditAction | '';
  severity: AuditSeverity | '';
  actor: string;
  period: FilterPeriod;
  date_from: string;
  date_to: string;
  compliance_tag: string;
  sort_by: 'timestamp' | 'severity' | 'action';
  sort_order: 'asc' | 'desc';
}

export interface AuditExportConfig {
  format: 'csv' | 'json' | 'pdf';
  include_metadata: boolean;
  include_compliance_tags: boolean;
  date_range: { from: string; to: string };
  selected_actions: AuditAction[];
}

export interface SecurityAlert {
  id: string;
  alert_type: 'brute_force' | 'unusual_access' | 'privilege_escalation' | 'data_exfiltration' | 'threshold_breach';
  detected_at: string;
  severity: AuditSeverity;
  title: string;
  description: string;
  affected_user: string;
  affected_resource: string;
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  mitigation_steps: string[];
}

export interface AuditActorSummary {
  username: string;
  display_name: string;
  role: string;
  total_events: number;
  critical_events: number;
  last_active: string;
  most_common_action: AuditAction;
  risk_score: number;
  sessions_count: number;
  unique_ips: number;
}
