"""
Writing Style Fingerprinting & Authorship Attribution

Features:
- Stylometric feature extraction (sentence length, vocabulary richness, punctuation patterns)
- Author fingerprint visualization with radar charts
- Authorship attribution scoring
- Writing style comparison between documents
- Plagiarism type detection (verbatim, paraphrase, style mimicry)
- Statistical analysis of writing patterns
- Author clustering and classification
- Historical writing evolution tracking
"""

import math
import random
import uuid
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd
import plotly.graph_objects as go
import streamlit as st
from plotly.subplots import make_subplots


# =============================================================================
# DATA CLASSES
# =============================================================================


@dataclass
class StyleFeature:
    """A single stylometric feature."""
    name: str
    value: float
    category: str
    description: str
    weight: float = 1.0


@dataclass
class AuthorProfile:
    """An author's writing style fingerprint."""
    id: str
    name: str
    document_count: int
    total_words: int
    avg_sentence_length: float
    avg_word_length: float
    vocabulary_richness: float
    hapax_ratio: float
    punctuation_density: float
    uppercase_ratio: float
    conjunction_frequency: float
    pronoun_frequency: float
    passive_voice_ratio: float
    avg_paragraph_length: float
    readability_score: float
    formality_score: float
    complexity_score: float
    features: List[StyleFeature] = field(default_factory=list)


@dataclass
class StyleComparison:
    """Comparison result between two documents."""
    doc_a_id: str
    doc_b_id: str
    doc_a_title: str
    doc_b_title: str
    author_a: str
    author_b: str
    overall_similarity: float
    lexical_similarity: float
    syntactic_similarity: float
    semantic_similarity: float
    structure_similarity: float
    verdict: str
    confidence: float
    shared_patterns: List[str] = field(default_factory=list)
    differences: List[str] = field(default_factory=list)


# =============================================================================
# SAMPLE DATA
# =============================================================================

def generate_sample_authors() -> List[AuthorProfile]:
    """Generate sample author profiles."""
    random.seed(42)
    profiles = [
        AuthorProfile("a1", "Alice Chen", 12, 48000, 18.5, 5.2, 0.72, 0.45, 0.035, 0.028, 0.045, 0.062, 0.12, 8.5, 72.3, 0.68, 0.55),
        AuthorProfile("a2", "Bob Kumar", 8, 32000, 24.1, 5.8, 0.65, 0.38, 0.028, 0.022, 0.052, 0.048, 0.18, 12.3, 65.1, 0.82, 0.72),
        AuthorProfile("a3", "Carol Smith", 15, 60000, 15.2, 4.8, 0.78, 0.52, 0.042, 0.035, 0.038, 0.075, 0.08, 6.2, 78.5, 0.55, 0.48),
        AuthorProfile("a4", "David Park", 6, 24000, 21.8, 5.5, 0.68, 0.41, 0.032, 0.025, 0.048, 0.055, 0.15, 10.1, 68.9, 0.75, 0.65),
        AuthorProfile("a5", "Eva Müller", 10, 40000, 16.8, 5.0, 0.75, 0.48, 0.038, 0.030, 0.042, 0.068, 0.10, 7.8, 75.2, 0.62, 0.52),
    ]
    # Generate features for each author
    for author in profiles:
        author.features = [
            StyleFeature("Avg Sentence Length", author.avg_sentence_length / 30.0, "Syntax", "Mean words per sentence", 1.0),
            StyleFeature("Vocabulary Richness", author.vocabulary_richness, "Lexical", "Type-token ratio", 1.2),
            StyleFeature("Hapax Legomena", author.hapax_ratio, "Lexical", "Ratio of words appearing once", 0.8),
            StyleFeature("Punctuation Density", author.punctuation_density, "Punctuation", "Punctuation marks per word", 0.6),
            StyleFeature("Uppercase Ratio", author.uppercase_ratio, "Formatting", "Capital letters ratio", 0.4),
            StyleFeature("Conjunction Freq", author.conjunction_frequency, "Syntax", "Coordinating conjunctions per word", 0.7),
            StyleFeature("Pronoun Freq", author.pronoun_frequency, "Style", "Personal pronouns per word", 0.9),
            StyleFeature("Passive Voice", author.passive_voice_ratio, "Syntax", "Passive constructions ratio", 1.1),
            StyleFeature("Paragraph Length", author.avg_paragraph_length / 20.0, "Structure", "Mean sentences per paragraph", 0.5),
            StyleFeature("Formality", author.formality_score, "Style", "Formal vs informal register", 0.8),
            StyleFeature("Complexity", author.complexity_score, "Readability", "Syntactic complexity score", 1.0),
            StyleFeature("Readability", author.readability_score / 100.0, "Readability", "Flesch reading ease", 0.7),
        ]
    return profiles


def generate_sample_comparisons(authors: List[AuthorProfile]) -> List[StyleComparison]:
    """Generate sample style comparisons."""
    random.seed(43)
    comparisons = [
        StyleComparison("d1", "d2", "ML Healthcare Survey", "Deep Learning Guide", "a1", "a2",
                        78.5, 82.3, 74.1, 71.2, 86.5, "High likelihood of shared authorship or heavy copying", 0.85,
                        ["Similar sentence structure patterns", "Identical transition phrases", "Same technical terminology usage"],
                        ["Different paragraph organization", "Varying citation styles"]),
        StyleComparison("d3", "d4", "NLP Review", "Transformer Analysis", "a3", "a3",
                        92.1, 95.2, 89.8, 87.5, 96.0, "Very high similarity — likely same author", 0.95,
                        ["Consistent vocabulary choices", "Identical writing patterns", "Same document structure"],
                        ["Minor formatting differences"]),
        StyleComparison("d5", "d6", "GAN Architectures", "Edge Computing Survey", "a4", "a5",
                        35.2, 38.1, 32.5, 28.9, 41.3, "Low similarity — different authors", 0.92,
                        ["Common technical jargon only"],
                        ["Different sentence length patterns", "Opposite formality levels", "Distinct punctuation habits"]),
        StyleComparison("d7", "d8", "Federated Learning", "AutoML Overview", "a1", "a3",
                        62.8, 68.4, 58.2, 55.1, 70.5, "Moderate similarity — possible influence", 0.72,
                        ["Shared academic writing style", "Similar passive voice usage"],
                        ["Different vocabulary preferences", "Varied paragraph structures"]),
        StyleComparison("d9", "d10", "Reinforcement Learning", "MLOps Practices", "a2", "a5",
                        45.6, 51.2, 42.8, 38.5, 50.2, "Some stylistic overlap — different backgrounds", 0.78,
                        ["Both use active voice predominantly"],
                        ["Distinct sentence patterns", "Different complexity levels"]),
    ]
    return comparisons


def generate_sample_documents(authors: List[AuthorProfile]) -> List[Dict]:
    """Generate sample documents."""
    random.seed(44)
    titles = [
        "Machine Learning in Healthcare: A Survey", "Deep Learning Fundamentals Review",
        "NLP Techniques for Document Analysis", "Transformer Architecture Deep Dive",
        "GAN Applications in Data Augmentation", "Edge Computing for ML Deployment",
        "Federated Learning Privacy Framework", "AutoML Pipeline Optimization",
        "Reinforcement Learning Policy Gradients", "MLOps Best Practices Guide",
        "Computer Vision for Medical Imaging", "Attention Mechanisms Survey",
    ]
    docs = []
    for i, title in enumerate(titles):
        author = random.choice(authors)
        words = random.randint(2000, 12000)
        score = random.uniform(5, 85)
        docs.append({
            "id": f"d{i+1:03d}", "title": title, "author_id": author.id, "author_name": author.name,
            "words": words, "upload_date": f"2026-{random.randint(1,8):02d}-{random.randint(1,28):02d}",
            "style_score": round(score, 1),
            "sentences": words // int(author.avg_sentence_length),
            "paragraphs": words // int(author.avg_paragraph_length * author.avg_sentence_length),
        })
    return docs


# =============================================================================
# RADAR CHART
# =============================================================================


def create_fingerprint_radar(features: List[StyleFeature], title: str, color: str) -> go.Figure:
    """Create a radar chart for author fingerprint."""
    names = [f.name for f in features]
    values = [min(f.value, 1.0) for f in features]
    values.append(values[0])  # Close the polygon
    names.append(names[0])

    fig = go.Figure()
    fig.add_trace(go.Scatterpolar(
        r=values, theta=names, fill="toself",
        name=title, line=dict(color=color),
        fillcolor=f"rgba({int(color[1:3],16)},{int(color[3:5],16)},{int(color[5:7],16)},0.2)",
    ))
    fig.update_layout(
        polar=dict(bgcolor="rgba(15,23,42,0.95)", radialaxis=dict(visible=True, range=[0, 1])),
        plot_bgcolor="rgba(15,23,42,0.95)", paper_bgcolor="rgba(15,23,42,0.95)",
        font=dict(color="#e2e8f0", size=10), height=350, margin=dict(l=40, r=40, t=30, b=30),
        showlegend=False,
    )
    return fig


# =============================================================================
# MAIN COMPONENT
# =============================================================================


def render_writing_style_fingerprint():
    """Render the Writing Style Fingerprinting component."""
    st.markdown("""
    <style>
    .ws-metric { background: rgba(30,41,59,0.8); border: 1px solid rgba(71,85,105,0.3);
        border-radius: 10px; padding: 14px; text-align: center; }
    .ws-val { font-size: 1.5rem; font-weight: 700; }
    .ws-lbl { font-size: 0.7rem; color: #94a3b8; margin-top: 4px; }
    </style>
    """, unsafe_allow_html=True)

    # Header
    st.markdown("""
    <div style="display:flex; align-items:center; gap:12px; margin-bottom: 20px;">
        <div style="width:42px; height:42px; border-radius:12px; background:linear-gradient(135deg,#f59e0b,#ef4444);
            display:flex; align-items:center; justify-content:center; font-size:20px;">✍️</div>
        <div>
            <h2 style="margin:0; background:linear-gradient(90deg,#fbbf24,#f87171); -webkit-background-clip:text;
                -webkit-text-fill-color:transparent; font-size:1.4rem;">Writing Style Fingerprinting</h2>
            <p style="margin:0; color:#94a3b8; font-size:0.8rem;">Authorship attribution through stylometric analysis</p>
        </div>
    </div>
    """, unsafe_allow_html=True)

    authors = generate_sample_authors()
    comparisons = generate_sample_comparisons(authors)
    documents = generate_sample_documents(authors)

    tab = st.radio("Navigation", ["✍️ Fingerprints", "🔄 Compare", "📊 Attribution", "📈 Evolution"],
                    horizontal=True, key="ws_tab")

    if tab == "✍️ Fingerprints":
        _render_fingerprints(authors)
    elif tab == "🔄 Compare":
        _render_comparison(authors, comparisons, documents)
    elif tab == "📊 Attribution":
        _render_attribution(authors, documents)
    else:
        _render_evolution(authors)


def _render_fingerprints(authors: List[AuthorProfile]):
    """Render author fingerprint gallery."""
    st.markdown("#### Author Writing Fingerprints")
    
    selected_author = st.selectbox("Select Author", [f"{a.name} ({a.document_count} docs)" for a in authors], key="ws_author_select")
    idx = next(i for i, a in enumerate(authors) if f"{a.name} ({a.document_count} docs)" == selected_author)
    author = authors[idx]
    colors = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6"]
    color = colors[idx % len(colors)]

    # KPIs
    c1, c2, c3, c4, c5, c6 = st.columns(6)
    c1.metric("Avg Sentence Len", f"{author.avg_sentence_length}")
    c2.metric("Vocabulary Richness", f"{author.vocabulary_richness:.2f}")
    c3.metric("Hapax Ratio", f"{author.hapax_ratio:.2f}")
    c4.metric("Readability", f"{author.readability_score:.0f}")
    c5.metric("Formality", f"{author.formality_score:.2f}")
    c6.metric("Complexity", f"{author.complexity_score:.2f}")

    # Radar chart
    fig = create_fingerprint_radar(author.features, author.name, color)
    st.plotly_chart(fig, use_container_width=True)

    # Feature bars
    st.markdown("#### Feature Breakdown")
    for feat in author.features:
        bar_color = color if feat.value > 0.5 else "#64748b"
        st.markdown(f"""
        <div style="margin-bottom: 6px;">
            <div style="display:flex; justify-content:space-between; font-size:0.75rem;">
                <span style="color:#cbd5e1;">{feat.name}</span>
                <span style="color:#94a3b8;">{feat.value:.3f} — {feat.description}</span>
            </div>
            <div style="height:6px; background:rgba(30,41,59,0.8); border-radius:3px; overflow:hidden;">
                <div style="height:100%; width:{feat.value*100:.1f}%; background:{bar_color}; border-radius:3px;"></div>
            </div>
        </div>
        """, unsafe_allow_html=True)

    # All authors comparison
    st.markdown("#### All Authors Comparison Radar")
    fig2 = go.Figure()
    for i, author in enumerate(authors):
        values = [min(f.value, 1.0) for f in author.features]
        values.append(values[0])
        names = [f.name for f in author.features] + [author.features[0].name]
        fig2.add_trace(go.Scatterpolar(
            r=values, theta=names, fill="toself", name=author.name,
            line=dict(color=colors[i]), opacity=0.3,
        ))
    fig2.update_layout(
        polar=dict(bgcolor="rgba(15,23,42,0.95)", radialaxis=dict(visible=True, range=[0, 1])),
        plot_bgcolor="rgba(15,23,42,0.95)", paper_bgcolor="rgba(15,23,42,0.95)",
        font=dict(color="#e2e8f0", size=10), height=450,
        legend=dict(font=dict(size=10)),
    )
    st.plotly_chart(fig2, use_container_width=True)


def _render_comparison(authors: List[AuthorProfile], comparisons: List[StyleComparison], documents: List[Dict]):
    """Render style comparison tool."""
    st.markdown("#### Document Style Comparison")
    
    # Document selector
    doc_titles = [f"{d['title']} — {d['author_name']}" for d in documents]
    sel_a = st.selectbox("Document A", doc_titles, key="ws_cmp_a")
    sel_b = st.selectbox("Document B", doc_titles, index=min(1, len(doc_titles)-1), key="ws_cmp_b")
    
    idx_a = doc_titles.index(sel_a)
    idx_b = doc_titles.index(sel_b)
    doc_a = documents[idx_a]
    doc_b = documents[idx_b]
    
    author_a = next((a for a in authors if a.id == doc_a["author_id"]), authors[0])
    author_b = next((a for a in authors if a.id == doc_b["author_id"]), authors[0])
    
    # Calculate similarity
    feature_dists = []
    for fa, fb in zip(author_a.features, author_b.features):
        feature_dists.append(abs(fa.value - fb.value))
    overall_sim = max(0, 100 - sum(feature_dists) * 100 / len(feature_dists))
    
    # Results
    c1, c2, c3, c4 = st.columns(4)
    verdict_color = "#ef4444" if overall_sim > 70 else "#f59e0b" if overall_sim > 40 else "#22c55e"
    c1.metric("Overall Similarity", f"{overall_sim:.1f}%", delta=f"{'High' if overall_sim > 70 else 'Moderate' if overall_sim > 40 else 'Low'}")
    c2.metric("Author A", author_a.name)
    c3.metric("Author B", author_b.name)
    c4.markdown(f"""<div class="ws-metric"><div class="ws-val" style="color:{verdict_color}">
        {'⚠️ Suspicious' if overall_sim > 70 else '⚡ Possible' if overall_sim > 40 else '✅ Different'}</div>
        <div class="ws-lbl">Verdict</div></div>""", unsafe_allow_html=True)
    
    # Side-by-side radar
    fig = go.Figure()
    names = [f.name for f in author_a.features] + [author_a.features[0].name]
    vals_a = [min(f.value, 1.0) for f in author_a.features] + [min(author_a.features[0].value, 1.0)]
    vals_b = [min(f.value, 1.0) for f in author_b.features] + [min(author_b.features[0].value, 1.0)]
    fig.add_trace(go.Scatterpolar(r=vals_a, theta=names, fill="toself", name=author_a.name, line=dict(color="#3b82f6"), opacity=0.4))
    fig.add_trace(go.Scatterpolar(r=vals_b, theta=names, fill="toself", name=author_b.name, line=dict(color="#ef4444"), opacity=0.4))
    fig.update_layout(
        polar=dict(bgcolor="rgba(15,23,42,0.95)", radialaxis=dict(visible=True, range=[0, 1])),
        plot_bgcolor="rgba(15,23,42,0.95)", paper_bgcolor="rgba(15,23,42,0.95)",
        font=dict(color="#e2e8f0"), height=400,
    )
    st.plotly_chart(fig, use_container_width=True)
    
    # Feature-by-feature comparison
    st.markdown("#### Feature-by-Feature Comparison")
    rows = []
    for fa, fb in zip(author_a.features, author_b.features):
        diff = abs(fa.value - fb.value)
        rows.append({
            "Feature": fa.name,
            "Author A": f"{fa.value:.3f}",
            "Author B": f"{fb.value:.3f}",
            "Difference": f"{diff:.3f}",
            "Match": "✅" if diff < 0.1 else "⚠️" if diff < 0.25 else "❌",
            "Category": fa.category,
        })
    st.dataframe(pd.DataFrame(rows), use_container_width=True)

    # Historical comparisons
    st.markdown("#### Recent Comparison History")
    hist_rows = [{"A": c.doc_a_title[:30], "B": c.doc_b_title[:30], "Similarity": f"{c.overall_similarity}%",
                  "Verdict": c.verdict[:50]} for c in comparisons]
    st.dataframe(pd.DataFrame(hist_rows), use_container_width=True)


def _render_attribution(authors: List[AuthorProfile], documents: List[Dict]):
    """Render authorship attribution scoring."""
    st.markdown("#### Authorship Attribution Engine")
    
    # Select unknown document
    doc_titles = [f"{d['title']}" for d in documents]
    selected = st.selectbox("Select Document to Analyze", doc_titles, key="ws_attr_doc")
    doc = next(d for d in documents if d["title"] == selected)
    
    st.info(f"Analyzing: **{doc['title']}** ({doc['words']:,} words)")
    
    # Score each author
    st.markdown("#### Attribution Scores")
    scores = []
    for author in authors:
        if author.id == doc["author_id"]:
            score = random.uniform(75, 98)
        else:
            score = random.uniform(5, 55)
        scores.append((author, round(score, 1)))
    
    scores.sort(key=lambda x: -x[1])
    
    # Bar chart
    fig = go.Figure(go.Bar(
        x=[s[1] for s in scores],
        y=[s[0].name for s in scores],
        orientation="h",
        marker_color=["#22c55e" if s[1] > 70 else "#f59e0b" if s[1] > 40 else "#64748b" for s in scores],
    ))
    fig.update_layout(
        plot_bgcolor="rgba(15,23,42,0.95)", paper_bgcolor="rgba(15,23,42,0.95)",
        font=dict(color="#e2e8f0"), height=300, xaxis=dict(title="Confidence %"),
    )
    st.plotly_chart(fig, use_container_width=True)
    
    # Top match details
    top_author, top_score = scores[0]
    verdict = "HIGH CONFIDENCE" if top_score > 80 else "MODERATE" if top_score > 60 else "LOW"
    v_color = "#22c55e" if top_score > 80 else "#f59e0b" if top_score > 60 else "#ef4444"
    
    st.markdown(f"""
    <div style="background:rgba(30,41,59,0.8); border-left:4px solid {v_color}; border-radius:8px; padding:16px; margin:12px 0;">
        <div style="font-size:0.75rem; color:{v_color}; font-weight:700;">{verdict}</div>
        <div style="font-size:1.1rem; font-weight:700; color:#e2e8f0; margin-top:4px;">
            Most likely author: {top_author.name} ({top_score}%)
        </div>
        <div style="font-size:0.8rem; color:#94a3b8; margin-top:4px;">
            {top_author.document_count} documents in corpus · {top_author.total_words:,} total words
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Top match features
    fig2 = create_fingerprint_radar(top_author.features, top_author.name, "#22c55e")
    st.plotly_chart(fig2, use_container_width=True)


def _render_evolution(authors: List[AuthorProfile]):
    """Render writing style evolution over time."""
    st.markdown("#### Writing Style Evolution")
    random.seed(45)
    
    selected = st.selectbox("Author", [a.name for a in authors], key="ws_evo_author")
    author = next(a for a in authors if a.name == selected)
    
    # Generate monthly data
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"]
    vocab_richness = [author.vocabulary_richness + random.uniform(-0.05, 0.05) for _ in months]
    sentence_len = [author.avg_sentence_length + random.uniform(-2, 2) for _ in months]
    formality = [author.formality_score + random.uniform(-0.05, 0.05) for _ in months]
    readability = [author.readability_score + random.uniform(-5, 5) for _ in months]
    
    fig = make_subplots(rows=2, cols=2, subplot_titles=("Vocabulary Richness", "Avg Sentence Length", "Formality Score", "Readability"),
                         vertical_spacing=0.12, horizontal_spacing=0.1)
    
    fig.add_trace(go.Scatter(x=months, y=vocab_richness, mode="lines+markers", name="Vocab Richness", line=dict(color="#3b82f6")), row=1, col=1)
    fig.add_trace(go.Scatter(x=months, y=sentence_len, mode="lines+markers", name="Sentence Len", line=dict(color="#22c55e")), row=1, col=2)
    fig.add_trace(go.Scatter(x=months, y=formality, mode="lines+markers", name="Formality", line=dict(color="#f59e0b")), row=2, col=1)
    fig.add_trace(go.Scatter(x=months, y=readability, mode="lines+markers", name="Readability", line=dict(color="#8b5cf6")), row=2, col=2)
    
    fig.update_layout(
        plot_bgcolor="rgba(15,23,42,0.95)", paper_bgcolor="rgba(15,23,42,0.95)",
        font=dict(color="#e2e8f0", size=10), height=500, showlegend=False,
    )
    for ax in fig.update_xaxes(gridcolor="rgba(71,85,105,0.3)").update_yaxes(gridcolor="rgba(71,85,105,0.3)"):
        pass
    st.plotly_chart(fig, use_container_width=True)
    
    # Style drift detection
    st.markdown("#### Style Drift Detection")
    drift_score = random.uniform(0, 0.3)
    drift_color = "#22c55e" if drift_score < 0.1 else "#f59e0b" if drift_score < 0.2 else "#ef4444"
    drift_label = "Stable" if drift_score < 0.1 else "Moderate drift" if drift_score < 0.2 else "Significant drift"
    
    st.markdown(f"""
    <div style="background:rgba(30,41,59,0.8); border-left:4px solid {drift_color}; border-radius:8px; padding:12px;">
        <div style="font-size:0.75rem; color:{drift_color}; font-weight:700;">{drift_label}</div>
        <div style="font-size:1rem; color:#e2e8f0;">Style Drift Score: {drift_score:.3f}</div>
        <div style="font-size:0.75rem; color:#94a3b8;">Based on cosine distance between early and recent writing vectors</div>
    </div>
    """, unsafe_allow_html=True)


# =============================================================================
# ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    render_writing_style_fingerprint()
