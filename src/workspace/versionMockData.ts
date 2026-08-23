import {
  DocumentVersion,
  VersionDiff,
  DiffChunk,
  StructuralChange,
  CitationChange,
  ChangeSummary,
  RiskFactor,
  VersionTimelineEntry,
  VersionStats,
  VersionMetadata,
} from './versionTypes';

function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 10)}`;
}

function randomHash(): string {
  return Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

function generateMetadata(overrides: Partial<VersionMetadata> = {}): VersionMetadata {
  return {
    class_section: 'CS-401',
    student_name: 'Alex Rivera',
    assignment_title: 'Transformer Analysis',
    detected_language: 'English',
    page_count: Math.floor(Math.random() * 20) + 3,
    has_images: Math.random() > 0.6,
    has_tables: Math.random() > 0.7,
    citation_count: Math.floor(Math.random() * 25) + 2,
    file_size_bytes: Math.floor(Math.random() * 5_000_000) + 50_000,
    ...overrides,
  };
}

export function generateMockVersions(): DocumentVersion[] {
  const documents = [
    {
      document_id: 'doc_001',
      filename: 'neural_attention_analysis.pdf',
      versions: [
        { version_number: 1, status: 'superseded', parent_version_id: null, commit_message: 'Initial draft submission', word_count: 1800 },
        { version_number: 2, status: 'superseded', parent_version_id: null, commit_message: 'Added methodology section and expanded literature review', word_count: 2450 },
        { version_number: 3, status: 'superseded', parent_version_id: null, commit_message: 'Incorporated professor feedback on citations', word_count: 2380 },
        { version_number: 4, status: 'current', parent_version_id: null, commit_message: 'Final revision with corrected references', word_count: 2610 },
      ],
    },
    {
      document_id: 'doc_002',
      filename: 'plagiarism_heuristics_v2.docx',
      versions: [
        { version_number: 1, status: 'superseded', parent_version_id: null, commit_message: 'First draft with basic algorithm descriptions', word_count: 1200 },
        { version_number: 2, status: 'current', parent_version_id: null, commit_message: 'Complete rewrite with performance benchmarks', word_count: 3100 },
      ],
    },
    {
      document_id: 'doc_003',
      filename: 'deep_learning_architectures.pdf',
      versions: [
        { version_number: 1, status: 'deleted', parent_version_id: null, commit_message: 'Accidentally uploaded wrong file', word_count: 400 },
        { version_number: 2, status: 'superseded', parent_version_id: null, commit_message: 'Correct file - CNN overview', word_count: 1500 },
        { version_number: 3, status: 'current', parent_version_id: null, commit_message: 'Extended with ResNet and EfficientNet sections', word_count: 2100 },
      ],
    },
    {
      document_id: 'doc_004',
      filename: 'cross_lingual_tokenization.txt',
      versions: [
        { version_number: 1, status: 'archived', parent_version_id: null, commit_message: 'Notes on multilingual BPE tokenization', word_count: 890 },
      ],
    },
    {
      document_id: 'doc_005',
      filename: 'transformer_positional_encoding.pdf',
      versions: [
        { version_number: 1, status: 'superseded', parent_version_id: null, commit_message: 'Initial sinusoidal encoding analysis', word_count: 1600 },
        { version_number: 2, status: 'superseded', parent_version_id: null, commit_message: 'Added rotary position embeddings section', word_count: 2200 },
        { version_number: 3, status: 'superseded', parent_version_id: null, commit_message: 'Comparative benchmarks with ALiBi', word_count: 2800 },
        { version_number: 4, status: 'superseded', parent_version_id: null, commit_message: 'Peer review feedback incorporated', word_count: 2950 },
        { version_number: 5, status: 'current', parent_version_id: null, commit_message: 'Final polished version with appendix', word_count: 3200 },
      ],
    },
    {
      document_id: 'doc_006',
      filename: 'faiss_index_optimization.pdf',
      versions: [
        { version_number: 1, status: 'superseded', parent_version_id: null, commit_message: 'Basic IVF index tuning notes', word_count: 900 },
        { version_number: 2, status: 'current', parent_version_id: null, commit_message: 'Full HNSW vs IVF-PQ comparison study', word_count: 2050 },
      ],
    },
  ];

  const allVersions: DocumentVersion[] = [];
  const students = ['Alex Rivera', 'Beatrix Vance', 'Chloe Laurent', 'Daniel Kim', 'Elena Rostova', 'Fujita Sato'];
  const classes = ['CS-401', 'CS-502', 'CS-310', 'CS-445'];
  const assignments = ['Transformer Analysis', 'Algorithm Design', 'Deep Learning Survey', 'NLP Benchmark', 'Vector Search Study', 'ML Ops Report'];

  documents.forEach((doc, docIdx) => {
    const student = students[docIdx % students.length];
    const cls = classes[docIdx % classes.length];
    const assignment = assignments[docIdx % assignments.length];

    doc.versions.forEach((v, vIdx) => {
      const daysAgo = (doc.versions.length - vIdx) * 2;
      allVersions.push({
        id: randomId('ver'),
        document_id: doc.document_id,
        version_number: v.version_number,
        filename: doc.filename,
        file_hash: randomHash(),
        upload_date: new Date(Date.now() - daysAgo * 86400000).toISOString(),
        uploaded_by: student,
        word_count: v.word_count,
        char_count: Math.floor(v.word_count * 6.2),
        chunk_count: Math.floor(v.word_count / 150),
        status: v.status as any,
        parent_version_id: v.parent_version_id,
        commit_message: v.commit_message,
        tags: ['academic', 'ml', 'nlp'].slice(0, Math.floor(Math.random() * 3) + 1),
        metadata: generateMetadata({
          student_name: student,
          class_section: cls,
          assignment_title: assignment,
          citation_count: Math.floor(Math.random() * 20) + 3,
        }),
      });
    });
  });

  return allVersions;
}

export function generateMockDiff(sourceId: string, targetId: string): VersionDiff {
  const chunks: DiffChunk[] = [
    {
      id: randomId('chunk'),
      line_start: 1,
      line_end: 8,
      operation: 'unchanged',
      content: 'Abstract: This paper investigates the application of attention mechanisms in modern transformer architectures. We analyze multi-head self-attention and its computational properties across varying sequence lengths.',
      highlighted_spans: [],
      confidence: 1.0,
    },
    {
      id: randomId('chunk'),
      line_start: 9,
      line_end: 14,
      operation: 'removed',
      content: 'Section 1: Introduction. Transformers have revolutionized natural language processing. The self-attention mechanism allows the model to weigh the importance of different parts of the input sequence.',
      highlighted_spans: [{ start_offset: 45, end_offset: 80, label: 'core claim' }],
      confidence: 0.92,
    },
    {
      id: randomId('chunk'),
      line_start: 9,
      line_end: 18,
      operation: 'added',
      content: 'Section 1: Introduction. Transformers have fundamentally reshaped the landscape of natural language processing since Vaswani et al. (2017). The self-attention mechanism enables dynamic weighting of input sequence elements, allowing the model to capture long-range dependencies without recurrence. Recent work by Dao et al. (2022) has demonstrated that FlashAttention can reduce memory bottlenecks significantly.',
      highlighted_spans: [
        { start_offset: 50, end_offset: 100, label: 'expanded intro' },
        { start_offset: 100, end_offset: 180, label: 'new citation' },
      ],
      confidence: 0.88,
    },
    {
      id: randomId('chunk'),
      line_start: 15,
      line_end: 22,
      operation: 'unchanged',
      content: 'The key innovation of transformers lies in replacing recurrent layers with multi-head attention layers. Given queries Q, keys K, and values V, the scaled dot-product attention is computed as Attention(Q,K,V) = softmax(QK^T / sqrt(d_k))V.',
      highlighted_spans: [],
      confidence: 1.0,
    },
    {
      id: randomId('chunk'),
      line_start: 23,
      line_end: 30,
      operation: 'modified',
      content: 'Experimental results on the GLUE benchmark demonstrate that our approach achieves competitive performance with BERT-large while reducing inference latency by 35%. The proposed method particularly excels on tasks requiring long-context understanding, such as document-level question answering and multi-document summarization.',
      highlighted_spans: [
        { start_offset: 120, end_offset: 180, label: 'updated metric' },
        { start_offset: 180, end_offset: 300, label: 'new experimental claims' },
      ],
      confidence: 0.85,
    },
    {
      id: randomId('chunk'),
      line_start: 31,
      line_end: 40,
      operation: 'added',
      content: 'Section 5: Ablation Study. To understand the contribution of each architectural component, we conducted a systematic ablation study. Removing the relative positional encoding degraded performance by 4.2 BLEU points on WMT14 En-De. Replacing multi-head attention with single-head attention resulted in a 7.8% drop in F1 score on SQuAD 2.0.',
      highlighted_spans: [{ start_offset: 0, end_offset: 300, label: 'entirely new section' }],
      confidence: 0.90,
    },
  ];

  const structuralChanges: StructuralChange[] = [
    {
      category: 'structure',
      description: 'Added new "Ablation Study" section (Section 5)',
      severity: 'high',
      old_value: null,
      new_value: 'Section 5: Ablation Study',
    },
    {
      category: 'citation',
      description: 'Added 3 new references (Dao et al. 2022, Li et al. 2023, Wang et al. 2024)',
      severity: 'medium',
      old_value: '12 citations',
      new_value: '15 citations',
    },
    {
      category: 'metadata',
      description: 'Page count increased from 8 to 11 pages',
      severity: 'low',
      old_value: '8 pages',
      new_value: '11 pages',
    },
    {
      category: 'formatting',
      description: 'Figures resized from 0.7 to 0.85 column width',
      severity: 'low',
      old_value: '0.7 width',
      new_value: '0.85 width',
    },
  ];

  const citationChanges: CitationChange[] = [
    { citation_text: 'Vaswani et al. (2017) - Attention Is All You Need', operation: 'unchanged', source_version_line: 15, target_version_line: 15 },
    { citation_text: 'Dao et al. (2022) - FlashAttention', operation: 'added', source_version_line: null, target_version_line: 12 },
    { citation_text: 'Li et al. (2023) - Efficient Transformers Survey', operation: 'added', source_version_line: null, target_version_line: 35 },
    { citation_text: 'Wang et al. (2024) - Positional Encoding Benchmarks', operation: 'added', source_version_line: null, target_version_line: 38 },
    { citation_text: 'Devlin et al. (2019) - BERT', operation: 'unchanged', source_version_line: 20, target_version_line: 25 },
  ];

  const riskFactors: RiskFactor[] = [
    { factor: 'Content Overlap', weight: 0.35, score: 0.62, description: 'Moderate content overlap between versions suggests iterative refinement rather than wholesale replacement' },
    { factor: 'Structural Novelty', weight: 0.25, score: 0.78, description: 'Significant structural additions including a new ablation study section' },
    { factor: 'Citation Integrity', weight: 0.20, score: 0.85, description: 'New citations properly attributed and contextualized within the text' },
    { factor: 'Stylometric Consistency', weight: 0.15, score: 0.91, description: 'Writing style remains consistent with previous versions' },
    { factor: 'Metadata Coherence', weight: 0.05, score: 0.95, description: 'Document metadata is coherent and internally consistent' },
  ];

  const changeSummary: ChangeSummary = {
    total_changes: 24,
    content_percentage_changed: 38.5,
    structure_percentage_changed: 12.0,
    risk_score: 0.15,
    risk_factors: riskFactors,
    recommendation: 'Low risk — changes are consistent with normal academic revision patterns. Added sections contain original analysis and properly cited new references.',
  };

  return {
    id: randomId('diff'),
    source_version_id: sourceId,
    target_version_id: targetId,
    computed_at: new Date().toISOString(),
    similarity_score: 0.615,
    similarity_metric: 'cosine',
    total_lines_added: 28,
    total_lines_removed: 6,
    total_lines_unchanged: 14,
    word_count_delta: 810,
    char_count_delta: 5020,
    content_changes: chunks,
    structural_changes: structuralChanges,
    citation_changes: citationChanges,
    change_summary: changeSummary,
  };
}

export function generateMockTimeline(): VersionTimelineEntry[] {
  return [
    { id: randomId('evt'), document_id: 'doc_001', version_id: 'v_004', version_number: 4, event_type: 'created', timestamp: '2026-08-23T10:15:00Z', actor: 'Alex Rivera', details: 'Uploaded version 4: "Final polished version with appendix"' },
    { id: randomId('evt'), document_id: 'doc_005', version_id: 'v_005', version_number: 5, event_type: 'created', timestamp: '2026-08-23T09:30:00Z', actor: 'Elena Rostova', details: 'Uploaded version 5: "Final polished version with appendix"' },
    { id: randomId('evt'), document_id: 'doc_001', version_id: 'v_003', version_number: 3, event_type: 'compared', timestamp: '2026-08-22T16:45:00Z', actor: 'prof_jackson', details: 'Compared v3 vs v1 — similarity score: 0.48' },
    { id: randomId('evt'), document_id: 'doc_003', version_id: 'v_001', version_number: 1, event_type: 'deleted', timestamp: '2026-08-22T14:20:00Z', actor: 'Chloe Laurent', details: 'Deleted version 1: "Accidentally uploaded wrong file"' },
    { id: randomId('evt'), document_id: 'doc_002', version_id: 'v_002', version_number: 2, event_type: 'created', timestamp: '2026-08-21T11:00:00Z', actor: 'Beatrix Vance', details: 'Uploaded version 2: "Complete rewrite with performance benchmarks"' },
    { id: randomId('evt'), document_id: 'doc_006', version_id: 'v_001', version_number: 1, event_type: 'restored', timestamp: '2026-08-20T08:15:00Z', actor: 'admin_sys', details: 'Restored version 1 from archive storage' },
    { id: randomId('evt'), document_id: 'doc_001', version_id: 'v_002', version_number: 2, event_type: 'created', timestamp: '2026-08-19T15:30:00Z', actor: 'Alex Rivera', details: 'Uploaded version 2: "Added methodology section"' },
    { id: randomId('evt'), document_id: 'doc_005', version_id: 'v_003', version_number: 3, event_type: 'compared', timestamp: '2026-08-18T10:00:00Z', actor: 'dr_dupont', details: 'Compared v3 vs v2 — similarity score: 0.72' },
  ];
}

export function generateMockStats(): VersionStats {
  return {
    total_documents: 6,
    total_versions: 17,
    avg_versions_per_document: 2.83,
    avg_similarity_between_versions: 0.68,
    most_edited_document: { document_id: 'doc_005', filename: 'transformer_positional_encoding.pdf', version_count: 5 },
    recent_changes_today: 2,
    storage_used_bytes: 42_500_000,
    top_contributors: [
      { username: 'Elena Rostova', upload_count: 5 },
      { username: 'Alex Rivera', upload_count: 4 },
      { username: 'Beatrix Vance', upload_count: 2 },
    ],
  };
}
