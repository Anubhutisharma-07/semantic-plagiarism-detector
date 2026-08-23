export type VersionStatus = 'current' | 'archived' | 'deleted' | 'superseded';
export type DiffOperation = 'added' | 'removed' | 'unchanged' | 'modified';
export type ComparisonMode = 'side-by-side' | 'inline' | 'unified';
export type SimilarityMetric = 'cosine' | 'jaccard' | 'levenshtein' | 'jaro-winkler';
export type SortField = 'date' | 'similarity' | 'word_count' | 'version_number';
export type SortOrder = 'asc' | 'desc';
export type ChangeCategory = 'content' | 'structure' | 'citation' | 'metadata' | 'formatting';

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  filename: string;
  file_hash: string;
  upload_date: string;
  uploaded_by: string;
  word_count: number;
  char_count: number;
  chunk_count: number;
  status: VersionStatus;
  parent_version_id: string | null;
  commit_message: string;
  tags: string[];
  metadata: VersionMetadata;
}

export interface VersionMetadata {
  class_section?: string;
  student_name?: string;
  assignment_title?: string;
  detected_language?: string;
  page_count?: number;
  has_images: boolean;
  has_tables: boolean;
  citation_count: number;
  file_size_bytes: number;
}

export interface VersionDiff {
  id: string;
  source_version_id: string;
  target_version_id: string;
  computed_at: string;
  similarity_score: number;
  similarity_metric: SimilarityMetric;
  total_lines_added: number;
  total_lines_removed: number;
  total_lines_unchanged: number;
  word_count_delta: number;
  char_count_delta: number;
  content_changes: DiffChunk[];
  structural_changes: StructuralChange[];
  citation_changes: CitationChange[];
  change_summary: ChangeSummary;
}

export interface DiffChunk {
  id: string;
  line_start: number;
  line_end: number;
  operation: DiffOperation;
  content: string;
  highlighted_spans: HighlightSpan[];
  confidence: number;
}

export interface HighlightSpan {
  start_offset: number;
  end_offset: number;
  label: string;
}

export interface StructuralChange {
  category: ChangeCategory;
  description: string;
  severity: 'low' | 'medium' | 'high';
  old_value: string | null;
  new_value: string | null;
}

export interface CitationChange {
  citation_text: string;
  operation: DiffOperation;
  source_version_line: number | null;
  target_version_line: number | null;
}

export interface ChangeSummary {
  total_changes: number;
  content_percentage_changed: number;
  structure_percentage_changed: number;
  risk_score: number;
  risk_factors: RiskFactor[];
  recommendation: string;
}

export interface RiskFactor {
  factor: string;
  weight: number;
  score: number;
  description: string;
}

export interface VersionComparisonRequest {
  source_version_id: string;
  target_version_id: string;
  comparison_mode: ComparisonMode;
  similarity_metric: SimilarityMetric;
  ignore_whitespace: boolean;
  ignore_casing: boolean;
  context_lines: number;
}

export interface VersionComparisonResult {
  request: VersionComparisonRequest;
  diff: VersionDiff;
  source_version: DocumentVersion;
  target_version: DocumentVersion;
  computed_duration_ms: number;
}

export interface VersionFilterOptions {
  search: string;
  status: VersionStatus | '';
  class_section: string;
  uploaded_by: string;
  date_from: string;
  date_to: string;
  min_word_count: number;
  max_word_count: number;
  sort_by: SortField;
  sort_order: SortOrder;
}

export interface VersionTimelineEntry {
  id: string;
  document_id: string;
  version_id: string;
  version_number: number;
  event_type: 'created' | 'updated' | 'compared' | 'restored' | 'deleted' | 'merged';
  timestamp: string;
  actor: string;
  details: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface VersionStats {
  total_documents: number;
  total_versions: number;
  avg_versions_per_document: number;
  avg_similarity_between_versions: number;
  most_edited_document: { document_id: string; filename: string; version_count: number };
  recent_changes_today: number;
  storage_used_bytes: number;
  top_contributors: { username: string; upload_count: number }[];
}
