"""
Bulk Document Scanner

Features:
- Batch upload and scan multiple documents simultaneously
- Parallel processing with progress tracking
- Real-time scan status dashboard
- Priority-based scanning queue
- Batch comparison matrix generation
- Aggregate plagiarism reports
- Export results as CSV/JSON/PDF
- Scan history and comparison across batches
- Configurable scan profiles (quick/deep/custom)
- Deduplication detection
"""

import math
import random
import time
import uuid
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd
import plotly.graph_objects as go
import streamlit as st
from plotly.subplots import make_subplots


# =============================================================================
# DATA CLASSES
# =============================================================================


class ScanProfile(Enum):
    """Scan intensity profiles."""
    QUICK = "quick"
    STANDARD = "standard"
    DEEP = "deep"
    CUSTOM = "custom"


class ScanStatus(Enum):
    """Document scan status."""
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


class PlagiarismLevel(Enum):
    """Plagiarism severity levels."""
    CLEAN = "clean"
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class ScanJob:
    """A single document scan job."""
    id: str
    filename: str
    author: str
    word_count: int
    file_size: str
    status: str
    progress: float
    plagiarism_score: float
    plagiarism_level: str
    matches_found: int
    scan_duration: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    error_message: Optional[str] = None
    scan_profile: str = "standard"


@dataclass
class BatchScan:
    """A batch scan session."""
    id: str
    name: str
    total_documents: int
    completed: int
    failed: int
    skipped: int
    started_at: str
    completed_at: Optional[str]
    duration: str
    profile: str
    avg_score: float
    high_risk_count: int
    jobs: List[ScanJob] = field(default_factory=list)


@dataclass
class ComparisonResult:
    """Pairwise comparison result."""
    doc_a: str
    doc_b: str
    similarity: float
    match_type: str
    shared_segments: int


# =============================================================================
# SAMPLE DATA
# =============================================================================


def generate_sample_batch() -> BatchScan:
    """Generate a sample batch scan with jobs."""
    random.seed(46)
    
    filenames = [
        "research_paper_ai_ethics.pdf", "deep_learning_survey.docx", "nlp_review_2026.pdf",
        "transformer_analysis.tex", "computer_vision_notes.docx", "ml_healthcare_study.pdf",
        "reinforcement_learning_intro.pdf", "generative_ai_overview.docx", "data_augmentation.pdf",
        "model_optimization.docx", "federated_learning.pdf", "attention_mechanisms.docx",
        "gan_architectures.pdf", "edge_computing_ml.pdf", "mlops_practices.docx",
        "knowledge_distillation.pdf", "self_supervised_learning.tex", "multimodal_ai.pdf",
        "explainable_ai.docx", "bias_detection_ml.pdf", "robustness_testing.docx",
        "scalable_infrastructure.pdf", "auto_ml_pipelines.docx", "code_clone_detection.pdf",
        "semantic_similarity.pdf",
    ]
    
    authors = ["Alice", "Bob", "Carol", "David", "Eva", "Frank", "Grace", "Henry"]
    statuses = [ScanStatus.COMPLETED] * 20 + [ScanStatus.FAILED] * 2 + [ScanStatus.SKIPPED] * 1
    
    jobs = []
    for i, fn in enumerate(filenames):
        status = statuses[i].value if i < len(statuses) else ScanStatus.COMPLETED.value
        score = random.uniform(2, 92) if status == "completed" else 0
        level = ("critical" if score >= 70 else "high" if score >= 50 else "moderate" if score >= 30 else "low" if score >= 10 else "clean") if status == "completed" else "clean"
        matches = int(score / 5) if status == "completed" else 0
        
        jobs.append(ScanJob(
            id=f"job-{i+1:03d}", filename=fn, author=random.choice(authors),
            word_count=random.randint(1500, 15000), file_size=f"{random.randint(50, 800)}KB",
            status=status, progress=100.0 if status == "completed" else 0.0,
            plagiarism_score=round(score, 1), plagiarism_level=level,
            matches_found=matches, scan_duration=f"{random.randint(2, 45)}s",
            started_at=f"2026-08-31 14:{random.randint(10,59):02d}",
            completed_at=f"2026-08-31 14:{random.randint(10,59):02d}" if status == "completed" else None,
            scan_profile=random.choice(["quick", "standard", "deep"]),
        ))
    
    completed_count = sum(1 for j in jobs if j.status == "completed")
    avg_score = sum(j.plagiarism_score for j in jobs if j.status == "completed") / max(completed_count, 1)
    high_risk = sum(1 for j in jobs if j.plagiarism_score >= 50)
    
    batch = BatchScan(
        id="batch-001", name="August 2026 Research Papers", total_documents=len(filenames),
        completed=completed_count, failed=2, skipped=1,
        started_at="2026-08-31 14:15:00", completed_at="2026-08-31 14:22:30",
        duration="7m 30s", profile="standard",
        avg_score=round(avg_score, 1), high_risk_count=high_risk, jobs=jobs,
    )
    return batch


def generate_comparison_matrix(jobs: List[ScanJob]) -> List[ComparisonResult]:
    """Generate pairwise comparison results."""
    random.seed(47)
    results = []
    completed = [j for j in jobs if j.status == "completed"]
    for i in range(len(completed)):
        for j in range(i + 1, min(i + 4, len(completed))):  # Limit pairs
            sim = random.uniform(5, 85)
            results.append(ComparisonResult(
                doc_a=completed[i].filename[:25], doc_b=completed[j].filename[:25],
                similarity=round(sim, 1),
                match_type=random.choice(["verbatim", "paraphrase", "structural", "citation"]),
                shared_segments=random.randint(1, 15),
            ))
    return results


# =============================================================================
# PROGRESS BAR COMPONENT
# =============================================================================


def render_progress_bar(progress: float, status: str, height: int = 6) -> str:
    """Render a styled progress bar."""
    if status == "completed":
        color = "#22c55e"
    elif status == "failed":
        color = "#ef4444"
    elif status == "processing":
        color = "#3b82f6"
    elif status == "skipped":
        color = "#64748b"
    else:
        color = "#94a3b8"
    
    return f"""
    <div style="height:{height}px; background:rgba(30,41,59,0.8); border-radius:{height//2}px; overflow:hidden;">
        <div style="height:100%; width:{progress}%; background:{color}; border-radius:{height//2}px; transition:width 0.3s;"></div>
    </div>
    """


# =============================================================================
# MAIN COMPONENT
# =============================================================================


def render_bulk_document_scanner():
    """Render the Bulk Document Scanner component."""
    st.markdown("""
    <style>
    .bs-card { background: rgba(30,41,59,0.8); border: 1px solid rgba(71,85,105,0.3);
        border-radius: 12px; padding: 16px; text-align: center; }
    .bs-val { font-size: 1.6rem; font-weight: 700; }
    .bs-lbl { font-size: 0.7rem; color: #94a3b8; margin-top: 4px; }
    .bs-status { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 600; }
    </style>
    """, unsafe_allow_html=True)

    # Header
    st.markdown("""
    <div style="display:flex; align-items:center; gap:12px; margin-bottom: 20px;">
        <div style="width:42px; height:42px; border-radius:12px; background:linear-gradient(135deg,#10b981,#06b6d4);
            display:flex; align-items:center; justify-content:center; font-size:20px;">🔍</div>
        <div>
            <h2 style="margin:0; background:linear-gradient(90deg,#34d399,#22d3ee); -webkit-background-clip:text;
                -webkit-text-fill-color:transparent; font-size:1.4rem;">Bulk Document Scanner</h2>
            <p style="margin:0; color:#94a3b8; font-size:0.8rem;">Batch processing, parallel scanning, and aggregate reporting</p>
        </div>
    </div>
    """, unsafe_allow_html=True)

    batch = generate_sample_batch()
    comparisons = generate_comparison_matrix(batch.jobs)

    tab = st.radio("Navigation", ["📊 Dashboard", "📋 Scan Jobs", "🔀 Comparison Matrix", "📥 Export"],
                    horizontal=True, key="bs_tab")

    if tab == "📊 Dashboard":
        _render_dashboard(batch)
    elif tab == "📋 Scan Jobs":
        _render_jobs(batch)
    elif tab == "🔀 Comparison Matrix":
        _render_matrix(batch, comparisons)
    else:
        _render_export(batch, comparisons)


def _render_dashboard(batch: BatchScan):
    """Render the batch scan dashboard."""
    # KPI cards
    c1, c2, c3, c4, c5, c6 = st.columns(6)
    c1.metric("Total Docs", batch.total_documents)
    c2.metric("Completed", batch.completed)
    c3.metric("Failed", batch.failed)
    c4.metric("Avg Score", f"{batch.avg_score}%")
    c5.metric("High Risk", batch.high_risk_count, delta="⚠️" if batch.high_risk_count > 0 else None)
    c6.metric("Duration", batch.duration)

    st.markdown("---")

    col1, col2 = st.columns(2)
    
    with col1:
        # Score distribution
        st.markdown("#### Plagiarism Score Distribution")
        scores = [j.plagiarism_score for j in batch.jobs if j.status == "completed"]
        bins = list(range(0, 110, 10))
        counts = [0] * (len(bins) - 1)
        for s in scores:
            for b in range(len(bins) - 1):
                if bins[b] <= s < bins[b + 1]:
                    counts[b] += 1
                    break
        
        fig = go.Figure(go.Bar(
            x=[f"{bins[i]}-{bins[i+1]}%" for i in range(len(bins) - 1)],
            y=counts,
            marker_color=["#22c55e" if bins[i] < 30 else "#f59e0b" if bins[i] < 50 else "#ef4444" for i in range(len(bins) - 1)],
        ))
        fig.update_layout(
            plot_bgcolor="rgba(15,23,42,0.95)", paper_bgcolor="rgba(15,23,42,0.95)",
            font=dict(color="#e2e8f0"), height=300, yaxis=dict(title="Count"),
        )
        st.plotly_chart(fig, use_container_width=True)

    with col2:
        # Status pie chart
        st.markdown("#### Scan Status")
        status_counts = Counter(j.status for j in batch.jobs)
        fig2 = go.Figure(go.Pie(
            labels=list(status_counts.keys()), values=list(status_counts.values()),
            marker=dict(colors=["#22c55e", "#ef4444", "#64748b"]),
            hole=0.4, textfont=dict(color="#e2e8f0"),
        ))
        fig2.update_layout(
            plot_bgcolor="rgba(15,23,42,0.95)", paper_bgcolor="rgba(15,23,42,0.95)",
            font=dict(color="#e2e8f0"), height=300, showlegend=True,
            legend=dict(font=dict(size=10)),
        )
        st.plotly_chart(fig2, use_container_width=True)

    # Scan timeline
    st.markdown("#### Scan Timeline")
    completed = [j for j in batch.jobs if j.status == "completed"]
    fig3 = go.Figure(go.Scatter(
        x=list(range(len(completed))),
        y=[j.plagiarism_score for j in completed],
        mode="markers+lines",
        marker=dict(
            size=[8 + j.matches_found for j in completed],
            color=[j.plagiarism_score for j in completed],
            colorscale=[[0, "#22c55e"], [0.5, "#f59e0b"], [1, "#ef4444"]],
            showscale=True, colorbar=dict(title="Score"),
        ),
        text=[f"{j.filename[:20]}<br>{j.plagiarism_score}%" for j in completed],
        hoverinfo="text",
    ))
    fig3.update_layout(
        plot_bgcolor="rgba(15,23,42,0.95)", paper_bgcolor="rgba(15,23,42,0.95)",
        font=dict(color="#e2e8f0"), height=300,
        xaxis=dict(title="Document #"), yaxis=dict(title="Plagiarism Score %"),
    )
    st.plotly_chart(fig3, use_container_width=True)

    # Scan profiles breakdown
    st.markdown("#### Scan Profiles Used")
    profile_counts = Counter(j.scan_profile for j in batch.jobs)
    pcols = st.columns(len(profile_counts))
    profile_colors = {"quick": "#22c55e", "standard": "#3b82f6", "deep": "#8b5cf6"}
    for i, (profile, count) in enumerate(profile_counts.items()):
        with pcols[i]:
            st.markdown(f"""
            <div class="bs-card">
                <div class="bs-val" style="color:{profile_colors.get(profile, '#94a3b8')}">{count}</div>
                <div class="bs-lbl">{profile.title()} Scan</div>
            </div>
            """, unsafe_allow_html=True)


def _render_jobs(batch: BatchScan):
    """Render the scan jobs list."""
    st.markdown("#### Scan Queue")
    
    # Filters
    col1, col2, col3 = st.columns(3)
    with col1:
        status_filter = st.selectbox("Status", ["All", "completed", "failed", "processing", "queued"], key="bs_status")
    with col2:
        sort_by = st.selectbox("Sort by", ["Score (High-Low)", "Score (Low-High)", "Name", "Word Count"], key="bs_sort")
    with col3:
        search = st.text_input("🔍 Search", key="bs_search")
    
    # Filter and sort jobs
    jobs = batch.jobs
    if status_filter != "All":
        jobs = [j for j in jobs if j.status == status_filter]
    if search:
        jobs = [j for j in jobs if search.lower() in j.filename.lower() or search.lower() in j.author.lower()]
    
    sort_fn = {
        "Score (High-Low)": lambda j: -j.plagiarism_score,
        "Score (Low-High)": lambda j: j.plagiarism_score,
        "Name": lambda j: j.filename,
        "Word Count": lambda j: -j.word_count,
    }
    jobs.sort(key=sort_fn[sort_by])
    
    # Render jobs
    for job in jobs:
        level_color = {"critical": "#ef4444", "high": "#f97316", "moderate": "#eab308", "low": "#22c55e", "clean": "#06b6d4"}
        status_color = {"completed": "#22c55e", "failed": "#ef4444", "processing": "#3b82f6", "queued": "#94a3b8", "skipped": "#64748b"}
        
        with st.expander(f"📄 {job.filename} — {job.author} — {job.plagiarism_score}% ({job.plagiarism_level})", expanded=False):
            c1, c2, c3, c4, c5 = st.columns(5)
            c1.metric("Score", f"{job.plagiarism_score}%")
            c2.metric("Words", f"{job.word_count:,}")
            c3.metric("Size", job.file_size)
            c4.metric("Matches", job.matches_found)
            c5.metric("Duration", job.scan_duration)
            
            # Progress bar
            st.markdown(render_progress_bar(job.progress, job.status), unsafe_allow_html=True)
            
            # Details
            dc1, dc2, dc3 = st.columns(3)
            dc1.markdown(f"**Status:** <span class='bs-status' style='background:{status_color.get(job.status, '#94a3b8')}20; color:{status_color.get(job.status, '#94a3b8')}'>{job.status}</span>", unsafe_allow_html=True)
            dc2.markdown(f"**Level:** <span class='bs-status' style='background:{level_color.get(job.plagiarism_level, '#94a3b8')}20; color:{level_color.get(job.plagiarism_level, '#94a3b8')}'>{job.plagiarism_level}</span>", unsafe_allow_html=True)
            dc3.markdown(f"**Profile:** {job.scan_profile}")
    
    if not jobs:
        st.info("No jobs match the current filters.")


def _render_matrix(batch: BatchScan, comparisons: List[ComparisonResult]):
    """Render the comparison matrix."""
    st.markdown("#### Pairwise Comparison Matrix")
    
    completed = [j for j in batch.jobs if j.status == "completed"]
    if len(completed) < 2:
        st.warning("Need at least 2 completed documents for comparison matrix.")
        return
    
    # Build matrix
    names = [j.filename[:20] for j in completed[:12]]  # Limit to 12 for readability
    n = len(names)
    matrix = [[0.0] * n for _ in range(n)]
    
    for comp in comparisons:
        try:
            i = names.index(comp.doc_a)
            j = names.index(comp.doc_b)
            matrix[i][j] = comp.similarity
            matrix[j][i] = comp.similarity
        except ValueError:
            continue
    
    # Heatmap
    fig = go.Figure(data=go.Heatmap(
        z=matrix, x=names, y=names,
        colorscale=[[0, "#0f172a"], [0.3, "#22c55e"], [0.6, "#f59e0b"], [1, "#ef4444"]],
        text=[[f"{matrix[i][j]:.0f}%" if matrix[i][j] > 0 else "" for j in range(n)] for i in range(n)],
        texttemplate="%{text}", textfont=dict(size=9, color="white"),
        hovertemplate="%{y} ↔ %{x}<br>Similarity: %{z:.1f}%<extra></extra>",
    ))
    fig.update_layout(
        plot_bgcolor="rgba(15,23,42,0.95)", paper_bgcolor="rgba(15,23,42,0.95)",
        font=dict(color="#e2e8f0", size=9), height=500,
        xaxis=dict(tickangle=45), yaxis=dict(autorange="reversed"),
    )
    st.plotly_chart(fig, use_container_width=True)
    
    # Top matches table
    st.markdown("#### Highest Similarity Pairs")
    sorted_comps = sorted(comparisons, key=lambda c: -c.similarity)[:10]
    rows = [{"Doc A": c.doc_a, "Doc B": c.doc_b, "Similarity": f"{c.similarity}%",
             "Type": c.match_type, "Segments": c.shared_segments} for c in sorted_comps]
    st.dataframe(pd.DataFrame(rows), use_container_width=True)


def _render_export(batch: BatchScan, comparisons: List[ComparisonResult]):
    """Render export options."""
    st.markdown("#### Export Results")
    
    c1, c2, c3 = st.columns(3)
    
    with c1:
        st.markdown("""
        <div class="bs-card" style="cursor:pointer; height:120px; display:flex; flex-direction:column; justify-content:center;">
            <div style="font-size:2rem;">📊</div>
            <div style="font-weight:600; margin-top:8px;">CSV Export</div>
            <div style="font-size:0.7rem; color:#94a3b8;">All scan results as CSV</div>
        </div>
        """, unsafe_allow_html=True)
    
    with c2:
        st.markdown("""
        <div class="bs-card" style="cursor:pointer; height:120px; display:flex; flex-direction:column; justify-content:center;">
            <div style="font-size:2rem;">📋</div>
            <div style="font-weight:600; margin-top:8px;">JSON Export</div>
            <div style="font-size:0.7rem; color:#94a3b8;">Full batch data as JSON</div>
        </div>
        """, unsafe_allow_html=True)
    
    with c3:
        st.markdown("""
        <div class="bs-card" style="cursor:pointer; height:120px; display:flex; flex-direction:column; justify-content:center;">
            <div style="font-size:2rem;">📄</div>
            <div style="font-weight:600; margin-top:8px;">PDF Report</div>
            <div style="font-size:0.7rem; color:#94a3b8;">Formatted analysis report</div>
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown("---")
    
    # Preview data
    st.markdown("#### Export Preview")
    rows = [{"Filename": j.filename, "Author": j.author, "Words": j.word_count,
             "Score": f"{j.plagiarism_score}%", "Level": j.plagiarism_level,
             "Matches": j.matches_found, "Status": j.status,
             "Profile": j.scan_profile, "Duration": j.scan_duration} for j in batch.jobs]
    df = pd.DataFrame(rows)
    st.dataframe(df, use_container_width=True, height=400)
    
    # Summary
    st.markdown("#### Batch Summary")
    summary = {
        "Batch ID": batch.id,
        "Batch Name": batch.name,
        "Total Documents": batch.total_documents,
        "Completed": batch.completed,
        "Failed": batch.failed,
        "Skipped": batch.skipped,
        "Duration": batch.duration,
        "Profile": batch.profile,
        "Average Score": f"{batch.avg_score}%",
        "High Risk Documents": batch.high_risk_count,
        "Comparison Pairs": len(comparisons),
    }
    for key, val in summary.items():
        st.markdown(f"**{key}:** {val}")
    
    # High risk summary
    high_risk = [j for j in batch.jobs if j.plagiarism_score >= 50]
    if high_risk:
        st.markdown("#### ⚠️ High Risk Documents")
        hr_rows = [{"Filename": j.filename, "Score": f"{j.plagiarism_score}%", "Level": j.plagiarism_level,
                     "Matches": j.matches_found} for j in sorted(high_risk, key=lambda j: -j.plagiarism_score)]
        st.dataframe(pd.DataFrame(hr_rows), use_container_width=True)


# =============================================================================
# ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    render_bulk_document_scanner()
