import {
  AuditLogEntry,
  AuditAction,
  AuditSeverity,
  ComplianceRule,
  ComplianceReport,
  AuditStats,
  SecurityAlert,
  AuditActorSummary,
} from './auditTypes';

function rid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 10)}`;
}

const ACTORS = [
  { user_id: 'u_001', username: 'prof_jackson', display_name: 'Prof. Jackson', role: 'admin', email: 'jackson@uni.edu' },
  { user_id: 'u_002', username: 'dr_dupont', display_name: 'Dr. Dupont', role: 'editor', email: 'dupont@uni.edu' },
  { user_id: 'u_003', username: 'alex_rivera', display_name: 'Alex Rivera', role: 'viewer', email: 'arivera@uni.edu' },
  { user_id: 'u_004', username: 'admin_sys', display_name: 'System Admin', role: 'super_admin', email: 'sysadmin@uni.edu' },
  { user_id: 'u_005', username: 'beatrix_v', display_name: 'Beatrix Vance', role: 'editor', email: 'bvance@uni.edu' },
  { user_id: 'u_006', username: 'chloe_l', display_name: 'Chloe Laurent', role: 'viewer', email: 'claurant@uni.edu' },
];

const ACTIONS: AuditAction[] = [
  'document.upload', 'document.download', 'document.delete', 'document.restore', 'document.share',
  'scan.initiated', 'scan.completed', 'scan.failed', 'user.login', 'user.logout',
  'user.role_changed', 'settings.updated', 'api_key.created', 'api_key.revoked',
  'export.generated', 'corpus.cleared', 'threshold.changed',
];

const IPS = ['192.168.1.42', '10.0.0.15', '172.16.0.8', '192.168.1.100', '10.0.0.77', '203.0.113.5'];
const USER_AGENTS = ['Mozilla/5.0 (Windows NT 10.0)', 'Mozilla/5.0 (Macintosh; Intel Mac OS X)', 'Chrome/128.0', 'Firefox/130.0'];

function randomSeverity(action: AuditAction): AuditSeverity {
  if (['document.delete', 'corpus.cleared', 'user.role_changed', 'scan.failed'].includes(action)) return 'critical';
  if (['threshold.changed', 'api_key.revoked', 'settings.updated'].includes(action)) return 'warning';
  return 'info';
}

function randomComplianceTags(action: AuditAction): string[] {
  const tags: string[] = [];
  if (['document.upload', 'document.delete'].includes(action)) tags.push('data_lifecycle');
  if (['user.login', 'user.logout', 'user.role_changed'].includes(action)) tags.push('access_control');
  if (['scan.initiated', 'scan.completed'].includes(action)) tags.push('plagiarism_scan');
  if (['api_key.created', 'api_key.revoked'].includes(action)) tags.push('api_security');
  if (['settings.updated', 'threshold.changed'].includes(action)) tags.push('config_change');
  if (['export.generated'].includes(action)) tags.push('data_export');
  if (tags.length === 0) tags.push('general');
  return tags;
}

function generateDescription(action: AuditAction, actor: string, target: string): string {
  const descs: Record<AuditAction, string[]> = {
    'document.upload': [`${actor} uploaded "${target}" to the corpus`, `New document "${target}" indexed with chunking`],
    'document.download': [`${actor} downloaded "${target}"`, `Export request for "${target}" completed`],
    'document.delete': [`${actor} permanently deleted "${target}"`, `"${target}" removed from trash storage`],
    'document.restore': [`${actor} restored "${target}" from trash`, `Document "${target}" recovered from archive`],
    'document.share': [`${actor} shared "${target}" with team members`, `Access granted for "${target}" to 3 users`],
    'scan.initiated': [`${actor} initiated plagiarism scan on "${target}"`, `Batch scan started for "${target}"`],
    'scan.completed': [`${actor} scan completed — no flags on "${target}"`, `Scan finished: "${target}" scored 92% original`],
    'scan.failed': [`${actor} scan failed for "${target}" — encoding error`, `Scan timeout on "${target}" after 120s`],
    'user.login': [`${actor} logged in from ${IPS[Math.floor(Math.random() * IPS.length)]}`, `Session started for ${actor}`],
    'user.logout': [`${actor} logged out after 45 minutes`, `Session ended for ${actor}`],
    'user.role_changed': [`${actor} changed role of ${target} to editor`, `Privilege escalation: ${target} promoted to admin`],
    'settings.updated': [`${actor} updated plagiarism threshold to 85%`, `System settings modified by ${actor}`],
    'api_key.created': [`${actor} generated new API key for "${target}"`, `API key created with read/write scope`],
    'api_key.revoked': [`${actor} revoked API key for "${target}"`, `API key invalidated due to suspected compromise`],
    'export.generated': [`${actor} exported report for "${target}"`, `PDF report generated for ${target}`],
    'corpus.cleared': [`${actor} cleared entire document corpus`, `FAISS index reset and cache purged`],
    'threshold.changed': [`${actor} changed similarity threshold from 80% to 85%`, `Threshold adjustment: ${target}`],
  };
  const options = descs[action] || [`${actor} performed ${action} on ${target}`];
  return options[Math.floor(Math.random() * options.length)];
}

export function generateMockAuditLogs(): AuditLogEntry[] {
  const entries: AuditLogEntry[] = [];
  const targets = [
    { type: 'document' as const, id: 'doc_001', name: 'neural_attention_analysis.pdf', owner: 'alex_rivera' },
    { type: 'document' as const, id: 'doc_002', name: 'plagiarism_heuristics_v2.docx', owner: 'beatrix_v' },
    { type: 'document' as const, id: 'doc_003', name: 'deep_learning_architectures.pdf', owner: 'chloe_l' },
    { type: 'document' as const, id: 'doc_004', name: 'cross_lingual_tokenization.txt', owner: 'chloe_l' },
    { type: 'document' as const, id: 'doc_005', name: 'transformer_positional_encoding.pdf', owner: 'alex_rivera' },
    { type: 'user' as const, id: 'u_003', name: 'Alex Rivera', owner: undefined },
    { type: 'system' as const, id: 'sys_001', name: 'Plagiarism Threshold', owner: undefined },
    { type: 'api_key' as const, id: 'key_001', name: 'Production API Key', owner: 'prof_jackson' },
    { type: 'setting' as const, id: 'set_001', name: 'Scan Configuration', owner: undefined },
  ];

  for (let i = 0; i < 50; i++) {
    const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
    const actor = ACTORS[Math.floor(Math.random() * ACTORS.length)];
    const target = targets[Math.floor(Math.random() * targets.length)];
    const hoursAgo = Math.floor(Math.random() * 720);
    const severity = randomSeverity(action);

    entries.push({
      id: rid('audit'),
      timestamp: new Date(Date.now() - hoursAgo * 3600000).toISOString(),
      action,
      actor: { ...actor },
      target: { ...target },
      severity,
      description: generateDescription(action, actor.display_name, target.name),
      ip_address: IPS[Math.floor(Math.random() * IPS.length)],
      user_agent: USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
      metadata: {
        duration_ms: Math.floor(Math.random() * 5000) + 100,
        status_code: severity === 'critical' ? 500 : 200,
      },
      session_id: rid('sess'),
      compliance_tags: randomComplianceTags(action),
    });
  }

  return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function generateMockComplianceRules(): ComplianceRule[] {
  return [
    { id: 'cr_001', name: 'Data Retention Policy', description: 'Documents must not be retained beyond 365 days without review', category: 'Data Lifecycle', severity: 'warning', check_function: 'check_retention_period', last_evaluated: new Date(Date.now() - 3600000).toISOString(), status: 'compliant', violation_count: 0, threshold: 365, current_value: 180 },
    { id: 'cr_002', name: 'Access Control Enforcement', description: 'All document access must be logged with valid session', category: 'Access Control', severity: 'critical', check_function: 'check_access_logging', last_evaluated: new Date(Date.now() - 1800000).toISOString(), status: 'compliant', violation_count: 2, threshold: 0, current_value: 2 },
    { id: 'cr_003', name: 'Plagiarism Scan Coverage', description: 'Every uploaded document must be scanned within 24 hours', category: 'Plagiarism Scan', severity: 'critical', check_function: 'check_scan_coverage', last_evaluated: new Date(Date.now() - 900000).toISOString(), status: 'needs_review', violation_count: 5, threshold: 100, current_value: 94 },
    { id: 'cr_004', name: 'API Key Rotation', description: 'API keys must be rotated every 90 days', category: 'API Security', severity: 'warning', check_function: 'check_api_key_age', last_evaluated: new Date(Date.now() - 7200000).toISOString(), status: 'non_compliant', violation_count: 3, threshold: 90, current_value: 112 },
    { id: 'cr_005', name: 'Threshold Audit Trail', description: 'Any similarity threshold change must have admin approval logged', category: 'Config Change', severity: 'critical', check_function: 'check_threshold_audit', last_evaluated: new Date(Date.now() - 5400000).toISOString(), status: 'compliant', violation_count: 0, threshold: 0, current_value: 0 },
    { id: 'cr_006', name: 'Bulk Export Authorization', description: 'Bulk exports exceeding 50 documents require admin approval', category: 'Data Export', severity: 'warning', check_function: 'check_bulk_export_auth', last_evaluated: new Date(Date.now() - 3600000).toISOString(), status: 'compliant', violation_count: 1, threshold: 50, current_value: 12 },
    { id: 'cr_007', name: 'Failed Login Lockout', description: 'Account must be locked after 5 consecutive failed login attempts', category: 'Access Control', severity: 'critical', check_function: 'check_failed_login_lockout', last_evaluated: new Date(Date.now() - 600000).toISOString(), status: 'needs_review', violation_count: 1, threshold: 5, current_value: 3 },
    { id: 'cr_008', name: 'Corpus Clear Authorization', description: 'Corpus clear operations require dual admin approval', category: 'Data Lifecycle', severity: 'critical', check_function: 'check_corpus_clear_auth', last_evaluated: new Date(Date.now() - 4200000).toISOString(), status: 'compliant', violation_count: 0, threshold: 2, current_value: 2 },
  ];
}

export function generateMockComplianceReport(): ComplianceReport {
  const rules = generateMockComplianceRules();
  const passed = rules.filter((r) => r.status === 'compliant').length;
  const failed = rules.filter((r) => r.status === 'non_compliant').length;
  const warnings = rules.filter((r) => r.status === 'needs_review').length;

  return {
    id: rid('report'),
    generated_at: new Date().toISOString(),
    period_start: new Date(Date.now() - 30 * 86400000).toISOString(),
    period_end: new Date().toISOString(),
    overall_score: Math.round(((passed / rules.length) * 100 + (warnings / rules.length) * 50)),
    total_checks: rules.length,
    passed_checks: passed,
    failed_checks: failed,
    warning_checks: warnings,
    rules,
    summary: `${passed}/${rules.length} compliance checks passed. ${failed} critical failures require immediate attention. ${warnings} items need review.`,
    recommendations: [
      'Rotate expired API keys immediately',
      'Review documents that missed the 24-hour scan window',
      'Investigate 3 failed login attempts from IP 203.0.113.5',
      'Enable dual-approval for future corpus clear operations',
      'Schedule monthly compliance audit reviews',
    ],
  };
}

export function generateMockStats(): AuditStats {
  return {
    total_events_today: 23,
    total_events_7d: 156,
    total_events_30d: 612,
    critical_events_today: 2,
    active_users_24h: 8,
    failed_logins_24h: 3,
    documents_uploaded_7d: 14,
    documents_deleted_7d: 4,
    api_calls_24h: 1842,
    avg_response_time_ms: 342,
    top_actions: [
      { action: 'scan.completed', count: 45 },
      { action: 'document.upload', count: 38 },
      { action: 'user.login', count: 32 },
      { action: 'document.download', count: 28 },
      { action: 'export.generated', count: 15 },
    ],
    top_actors: [
      { username: 'prof_jackson', event_count: 42 },
      { username: 'dr_dupont', event_count: 35 },
      { username: 'admin_sys', event_count: 28 },
      { username: 'alex_rivera', event_count: 22 },
      { username: 'beatrix_v', event_count: 18 },
    ],
    hourly_distribution: Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: Math.floor(Math.random() * 30) + (i >= 8 && i <= 18 ? 15 : 2),
    })),
  };
}

export function generateMockSecurityAlerts(): SecurityAlert[] {
  return [
    { id: rid('alert'), alert_type: 'brute_force', detected_at: new Date(Date.now() - 3600000).toISOString(), severity: 'critical', title: 'Brute Force Login Attempt Detected', description: '5 failed login attempts from IP 203.0.113.5 within 2 minutes targeting account prof_jackson', affected_user: 'prof_jackson', affected_resource: 'login_system', resolved: false, mitigation_steps: ['Block IP address', 'Notify account owner', 'Enable CAPTCHA'] },
    { id: rid('alert'), alert_type: 'unusual_access', detected_at: new Date(Date.now() - 7200000).toISOString(), severity: 'warning', title: 'Unusual Access Pattern', description: 'User chloe_l accessed 12 documents in under 5 minutes, exceeding normal browsing pattern', affected_user: 'chloe_l', affected_resource: 'document_corpus', resolved: true, resolved_at: new Date(Date.now() - 5400000).toISOString(), resolved_by: 'prof_jackson', mitigation_steps: ['Review access logs', 'Confirm with user'] },
    { id: rid('alert'), alert_type: 'threshold_breach', detected_at: new Date(Date.now() - 14400000).toISOString(), severity: 'warning', title: 'Scan Coverage Below Threshold', description: '3 documents uploaded today remain unscanned after 20 hours', affected_user: 'system', affected_resource: 'scan_pipeline', resolved: false, mitigation_steps: ['Trigger manual scan', 'Check worker health', 'Review pipeline config'] },
    { id: rid('alert'), alert_type: 'data_exfiltration', detected_at: new Date(Date.now() - 28800000).toISOString(), severity: 'critical', title: 'Bulk Export Anomaly', description: 'User alex_rivera initiated export of 45 documents in single session — exceeds 50-doc admin threshold', affected_user: 'alex_rivera', affected_resource: 'export_system', resolved: true, resolved_at: new Date(Date.now() - 21600000).toISOString(), resolved_by: 'admin_sys', mitigation_steps: ['Review export content', 'Confirm with user intent', 'Adjust thresholds if needed'] },
  ];
}

export function generateMockActorSummaries(): AuditActorSummary[] {
  return ACTORS.map((a) => ({
    username: a.username,
    display_name: a.display_name,
    role: a.role,
    total_events: Math.floor(Math.random() * 80) + 5,
    critical_events: Math.floor(Math.random() * 5),
    last_active: new Date(Date.now() - Math.floor(Math.random() * 48) * 3600000).toISOString(),
    most_common_action: ACTIONS[Math.floor(Math.random() * ACTIONS.length)],
    risk_score: Math.random() * 0.3,
    sessions_count: Math.floor(Math.random() * 20) + 1,
    unique_ips: Math.floor(Math.random() * 4) + 1,
  }));
}
