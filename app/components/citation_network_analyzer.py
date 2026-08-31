"""
Citation Network Analyzer

Features:
- Citation graph visualization between documents
- Citation integrity verification
- Citation chain tracing
- Self-citation detection
- Citation clustering analysis
- Impact factor scoring
- Citation pattern anomalies
- Reference verification against databases
- Citation style compliance checking
- Network centrality metrics
"""

import math
import random
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
class Citation:
    """A single citation record."""
    id: str
    citing_doc: str
    cited_doc: str
    citing_author: str
    cited_author: str
    citation_type: str
    in_text_mentions: int
    reference_list: bool
    verified: bool
    style_correct: bool
    year_cited: int
    context_score: float


@dataclass
class DocumentCitationProfile:
    """Citation profile for a document."""
    doc_id: str
    title: str
    author: str
    total_citations_out: int
    total_citations_in: int
    self_citations: int
    unique_sources: int
    avg_context_relevance: float
    citation_diversity: float
    impact_score: float
    integrity_score: float


@dataclass
class NetworkNode:
    """A node in the citation network."""
    id: str
    label: str
    author: str
    citations_out: int
    citations_in: int
    impact: float
    community: str
    size: float
    color: str


@dataclass
class CitationAnomaly:
    """An anomalous citation pattern."""
    id: str
    type: str
    severity: str
    description: str
    documents: List[str]
    recommendation: str


# =============================================================================
# SAMPLE DATA
# =============================================================================


def generate_citation_data() -> Tuple[List[Citation], List[DocumentCitationProfile], List[CitationAnomaly]]:
    """Generate sample citation data."""
    random.seed(55)
    
    docs = [
        ("doc-1", "ML Healthcare Survey", "Alice Chen"),
        ("doc-2", "Deep Learning Fundamentals", "Bob Kumar"),
        ("doc-3", "NLP Techniques Review", "Carol Smith"),
        ("doc-4", "Transformer Analysis", "David Park"),
        ("doc-5", "Computer Vision Survey", "Eva Müller"),
        ("doc-6", "GAN Architectures", "Frank Liu"),
        ("doc-7", "Edge Computing ML", "Grace Kim"),
        ("doc-8", "Federated Learning", "Henry Wang"),
        ("doc-9", "AutoML Pipelines", "Iris Patel"),
        ("doc-10", "Reinforcement Learning", "Jack Wilson"),
        ("doc-11", "Knowledge Distillation", "Kate Brown"),
        ("doc-12", "Attention Mechanisms", "Leo Zhang"),
        ("doc-13", "Self-Supervised Learning", "Mia Johnson"),
        ("doc-14", "MLOps Best Practices", "Noah Davis"),
        ("doc-15", "AI Ethics Framework", "Olivia Lee"),
    ]
    
    citation_types = ["direct", "paraphrase", "indirect", "self", "digital"]
    
    # Generate citations
    citations = []
    for i in range(60):
        citing_idx = random.randint(0, 14)
        cited_idx = random.randint(0, 14)
        while cited_idx == citing_idx:
            cited_idx = random.randint(0, 14)
        
        ctype = random.choice(citation_types)
        if ctype == "self" and citing_idx != cited_idx:
            citing_idx = cited_idx  # Self-citation
        
        verified = random.random() > 0.15
        style_correct = random.random() > 0.12
        
        citations.append(Citation(
            id=f"cit-{i+1:03d}",
            citing_doc=docs[citing_idx][0], cited_doc=docs[cited_idx][0],
            citing_author=docs[citing_idx][2], cited_author=docs[cited_idx][2],
            citation_type=ctype,
            in_text_mentions=random.randint(1, 8),
            reference_list=random.random() > 0.08,
            verified=verified, style_correct=style_correct,
            year_cited=random.randint(2020, 2026),
            context_score=round(random.uniform(0.3, 0.95), 2),
        ))
    
    # Generate profiles
    profiles = []
    for doc_id, title, author in docs:
        outgoing = sum(1 for c in citations if c.citing_doc == doc_id)
        incoming = sum(1 for c in citations if c.cited_doc == doc_id)
        self_cit = sum(1 for c in citations if c.citing_doc == doc_id and c.citation_type == "self")
        
        profiles.append(DocumentCitationProfile(
            doc_id=doc_id, title=title, author=author,
            total_citations_out=outgoing, total_citations_in=incoming,
            self_citations=self_cit, unique_sources=max(1, outgoing - self_cit),
            avg_context_relevance=round(random.uniform(0.5, 0.9), 2),
            citation_diversity=round(random.uniform(0.3, 0.85), 2),
            impact_score=round(incoming * 3.5 + random.uniform(5, 20), 1),
            integrity_score=round(random.uniform(70, 98), 1),
        ))
    
    # Generate anomalies
    anomalies = [
        CitationAnomaly("anom-001", "Self-Citation Ring", "high",
                        "Document cluster shows unusually high mutual self-citation rate (45%)",
                        ["doc-2", "doc-4", "doc-6"], "Review for potential citation manipulation"),
        CitationAnomaly("anom-002", "Missing Citations", "critical",
                        "3 passages with high textual similarity lack proper citations",
                        ["doc-1", "doc-7"], "Add proper attribution for all borrowed content"),
        CitationAnomaly("anom-003", "Circular Reference", "medium",
                        "Circular citation chain detected: doc-3 → doc-5 → doc-9 → doc-3",
                        ["doc-3", "doc-5", "doc-9"], "Verify legitimacy of bidirectional citations"),
        CitationAnomaly("anom-004", "Outdated References", "low",
                        "12 citations reference publications older than 10 years without justification",
                        ["doc-8", "doc-10", "doc-12"], "Consider updating to recent publications"),
        CitationAnomaly("anom-005", "Citation Style Inconsistency", "medium",
                        "Mixed citation styles detected (APA vs IEEE) within single document",
                        ["doc-11"], "Standardize citation format throughout the document"),
    ]
    
    return citations, profiles, anomalies


# =============================================================================
# NETWORK GRAPH
# =============================================================================


def create_citation_network_nodes(profiles: List[DocumentCitationProfile]) -> List[NetworkNode]:
    """Create network nodes from profiles."""
    communities = {"CS": ["doc-1", "doc-2", "doc-3", "doc-4", "doc-5"],
                   "DL": ["doc-6", "doc-7", "doc-8", "doc-9"],
                   "ML": ["doc-10", "doc-11", "doc-12", "doc-13", "doc-14", "doc-15"]}
    
    community_map = {}
    for comm, members in communities.items():
        for m in members:
            community_map[m] = comm
    
    comm_colors = {"CS": "#3b82f6", "DL": "#22c55e", "ML": "#f59e0b"}
    
    nodes = []
    for p in profiles:
        comm = community_map.get(p.doc_id, "Other")
        nodes.append(NetworkNode(
            id=p.doc_id, label=p.title[:20], author=p.author,
            citations_out=p.total_citations_out, citations_in=p.total_citations_in,
            impact=p.impact_score, community=comm,
            size=max(10, p.impact_score / 3),
            color=comm_colors.get(comm, "#94a3b8"),
        ))
    return nodes


def render_citation_network(citations: List[Citation], nodes: List[NetworkNode]) -> go.Figure:
    """Render citation network graph."""
    random.seed(56)
    # Position nodes in a circle
    n = len(nodes)
    positions = {}
    for i, node in enumerate(nodes):
        angle = 2 * math.pi * i / n
        r = 200
        positions[node.id] = (400 + r * math.cos(angle), 300 + r * math.sin(angle))

    fig = go.Figure()

    # Edges
    type_colors = {"direct": "#3b82f6", "paraphrase": "#22c55e", "indirect": "#f59e0b",
                   "self": "#ef4444", "digital": "#8b5cf6"}
    
    for cit in citations:
        if cit.citing_doc in positions and cit.cited_doc in positions:
            x0, y0 = positions[cit.citing_doc]
            x1, y1 = positions[cit.cited_doc]
            fig.add_trace(go.Scatter(
                x=[x0, x1, None], y=[y0, y1, None],
                mode="lines", line=dict(width=1, color=type_colors.get(cit.citation_type, "#94a3b8")),
                opacity=0.3, hoverinfo="text",
                text=f"{cit.citing_author} → {cit.cited_author}<br>Type: {cit.citation_type}",
                showlegend=False,
            ))

    # Nodes
    for node in nodes:
        x, y = positions[node.id]
        fig.add_trace(go.Scatter(
            x=[x], y=[y], mode="markers+text",
            marker=dict(size=node.size, color=node.color, line=dict(width=1, color="white")),
            text=[node.label], textposition="top center", textfont=dict(size=8, color="#94a3b8"),
            hovertext=f"<b>{node.label}</b><br>{node.author}<br>In: {node.citations_in} Out: {node.citations_out}<br>Impact: {node.impact}",
            hoverinfo="text", showlegend=False,
        ))

    # Legend
    for stype, color in type_colors.items():
        fig.add_trace(go.Scatter(x=[None], y=[None], mode="markers",
                                  marker=dict(size=8, color=color), name=f"Citation: {stype}", showlegend=True))

    fig.update_layout(
        title=dict(text="Citation Network Graph", font=dict(size=14, color="#e2e8f0")),
        plot_bgcolor="rgba(15,23,42,0.95)", paper_bgcolor="rgba(15,23,42,0.95)",
        font=dict(color="#e2e8f0"), height=500,
        xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
        yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
        legend=dict(font=dict(size=9)),
    )
    return fig


# =============================================================================
# MAIN COMPONENT
# =============================================================================


def render_citation_network_analyzer():
    """Render the Citation Network Analyzer component."""
    st.markdown("""
    <style>
    .cna-card { background: rgba(30,41,59,0.8); border: 1px solid rgba(71,85,105,0.3);
        border-radius: 12px; padding: 14px; text-align: center; }
    .cna-val { font-size: 1.5rem; font-weight: 700; }
    .cna-lbl { font-size: 0.7rem; color: #94a3b8; margin-top: 4px; }
    </style>
    """, unsafe_allow_html=True)

    st.markdown("""
    <div style="display:flex; align-items:center; gap:12px; margin-bottom: 20px;">
        <div style="width:42px; height:42px; border-radius:12px; background:linear-gradient(135deg,#6366f1,#a855f7);
            display:flex; align-items:center; justify-content:center; font-size:20px;">📚</div>
        <div>
            <h2 style="margin:0; background:linear-gradient(90deg,#818cf8,#c084fc); -webkit-background-clip:text;
                -webkit-text-fill-color:transparent; font-size:1.4rem;">Citation Network Analyzer</h2>
            <p style="margin:0; color:#94a3b8; font-size:0.8rem;">Citation graph, integrity verification & provenance tracking</p>
        </div>
    </div>
    """, unsafe_allow_html=True)

    citations, profiles, anomalies = generate_citation_data()
    nodes = create_citation_network_nodes(profiles)

    tab = st.radio("Navigation", ["🕸️ Network", "📊 Profiles", "🔍 Integrity", "⚠️ Anomalies"],
                    horizontal=True, key="cna_tab")

    if tab == "🕸️ Network":
        _render_network(citations, nodes)
    elif tab == "📊 Profiles":
        _render_profiles(profiles, citations)
    elif tab == "🔍 Integrity":
        _render_integrity(citations, profiles)
    else:
        _render_anomalies(anomalies)


def _render_network(citations: List[Citation], nodes: List[NetworkNode]):
    """Render the citation network graph."""
    # Summary KPIs
    c1, c2, c3, c4, c5 = st.columns(5)
    c1.metric("Documents", len(nodes))
    c2.metric("Citations", len(citations))
    c3.metric("Avg In-Degree", f"{sum(n.citations_in for n in nodes) / len(nodes):.1f}")
    c4.metric("Avg Impact", f"{sum(n.impact for n in nodes) / len(nodes):.1f}")
    c5.metric("Communities", len(set(n.community for n in nodes)))

    st.markdown("---")

    fig = render_citation_network(citations, nodes)
    st.plotly_chart(fig, use_container_width=True)

    # Citation type breakdown
    st.markdown("#### Citation Types")
    type_counts = Counter(c.citation_type for c in citations)
    type_colors = {"direct": "#3b82f6", "paraphrase": "#22c55e", "indirect": "#f59e0b", "self": "#ef4444", "digital": "#8b5cf6"}
    
    cols = st.columns(len(type_counts))
    for i, (ctype, count) in enumerate(type_counts.most_common()):
        with cols[i]:
            st.markdown(f"""
            <div class="cna-card">
                <div class="cna-val" style="color:{type_colors.get(ctype, '#94a3b8')}">{count}</div>
                <div class="cna-lbl">{ctype.title()}</div>
            </div>
            """, unsafe_allow_html=True)

    # Top cited documents
    st.markdown("#### Most Cited Documents")
    sorted_nodes = sorted(nodes, key=lambda n: -n.citations_in)
    rows = [{"Document": n.label, "Author": n.author, "Cited By": n.citations_in,
             "Cites": n.citations_out, "Impact": n.impact, "Community": n.community} for n in sorted_nodes[:10]]
    st.dataframe(pd.DataFrame(rows), use_container_width=True)


def _render_profiles(profiles: List[DocumentCitationProfile], citations: List[Citation]):
    """Render citation profiles."""
    st.markdown("#### Document Citation Profiles")
    
    selected = st.selectbox("Select Document", [f"{p.title} — {p.author}" for p in profiles], key="cna_prof_select")
    idx = next(i for i, p in enumerate(profiles) if f"{p.title} — {p.author}" == selected)
    profile = profiles[idx]

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Citations Out", profile.total_citations_out)
    c2.metric("Citations In", profile.total_citations_in)
    c3.metric("Self-Citations", profile.self_citations)
    c4.metric("Impact Score", profile.impact_score)

    c5, c6, c7, c8 = st.columns(4)
    c5.metric("Integrity", f"{profile.integrity_score}%")
    c6.metric("Context Relevance", f"{profile.avg_context_relevance:.0%}")
    c7.metric("Diversity", f"{profile.citation_diversity:.0%}")
    c8.metric("Unique Sources", profile.unique_sources)

    # Radar chart
    fig = go.Figure()
    features = ["Impact", "Integrity", "Context", "Diversity", "Sources"]
    values = [min(profile.impact_score / 50, 1), profile.integrity_score / 100,
              profile.avg_context_relevance, profile.citation_diversity,
              min(profile.unique_sources / 10, 1)]
    values.append(values[0])
    features.append(features[0])
    fig.add_trace(go.Scatterpolar(r=values, theta=features, fill="toself", name=profile.title,
                                   line=dict(color="#6366f1")))
    fig.update_layout(
        polar=dict(bgcolor="rgba(15,23,42,0.95)", radialaxis=dict(visible=True, range=[0, 1])),
        plot_bgcolor="rgba(15,23,42,0.95)", paper_bgcolor="rgba(15,23,42,0.95)",
        font=dict(color="#e2e8f0"), height=350,
    )
    st.plotly_chart(fig, use_container_width=True)

    # All profiles comparison
    st.markdown("#### All Documents Comparison")
    rows = [{"Title": p.title[:25], "Author": p.author, "In": p.total_citations_in,
             "Out": p.total_citations_out, "Self": p.self_citations, "Impact": p.impact_score,
             "Integrity": f"{p.integrity_score}%"} for p in sorted(profiles, key=lambda p: -p.impact_score)]
    st.dataframe(pd.DataFrame(rows), use_container_width=True, height=350)

    # Impact vs Integrity scatter
    fig2 = go.Figure(go.Scatter(
        x=[p.integrity_score for p in profiles],
        y=[p.impact_score for p in profiles],
        mode="markers+text",
        marker=dict(size=[p.total_citations_in * 5 + 10 for p in profiles],
                    color=[p.citation_diversity for p in profiles],
                    colorscale="Viridis", showscale=True, colorbar=dict(title="Diversity")),
        text=[p.title[:15] for p in profiles],
        textposition="top center", textfont=dict(size=9, color="#94a3b8"),
    ))
    fig2.update_layout(
        plot_bgcolor="rgba(15,23,42,0.95)", paper_bgcolor="rgba(15,23,42,0.95)",
        font=dict(color="#e2e8f0"), height=350,
        xaxis=dict(title="Integrity Score %"), yaxis=dict(title="Impact Score"),
    )
    st.plotly_chart(fig2, use_container_width=True)


def _render_integrity(citations: List[Citation], profiles: List[DocumentCitationProfile]):
    """Render citation integrity analysis."""
    st.markdown("#### Citation Integrity Report")

    verified = sum(1 for c in citations if c.verified)
    style_ok = sum(1 for c in citations if c.style_correct)
    in_ref = sum(1 for c in citations if c.reference_list)
    self_cit = sum(1 for c in citations if c.citation_type == "self")
    total = len(citations)

    c1, c2, c3, c4, c5 = st.columns(5)
    c1.metric("Verified", f"{verified}/{total}", delta=f"{verified/total*100:.0f}%")
    c2.metric("Style Correct", f"{style_ok}/{total}", delta=f"{style_ok/total*100:.0f}%")
    c3.metric("In Reference List", f"{in_ref}/{total}", delta=f"{in_ref/total*100:.0f}%")
    c4.metric("Self-Citations", self_cit, delta=f"{self_cit/total*100:.0f}%")
    c5.metric("Avg Context", f"{sum(c.context_score for c in citations)/total:.0%}")

    st.markdown("---")

    # Integrity breakdown
    st.markdown("#### Verification Status")
    fig = make_subplots(rows=1, cols=3, specs=[[{"type": "pie"}, {"type": "pie"}, {"type": "pie"}]],
                         subplot_titles=("Verified", "Style Compliance", "In Reference List"))
    
    fig.add_trace(go.Pie(labels=["Verified", "Unverified"], values=[verified, total - verified],
                          marker=dict(colors=["#22c55e", "#ef4444"]), hole=0.4, textfont=dict(color="#e2e8f0", size=10)),
                  row=1, col=1)
    fig.add_trace(go.Pie(labels=["Correct", "Incorrect"], values=[style_ok, total - style_ok],
                          marker=dict(colors=["#3b82f6", "#f59e0b"]), hole=0.4, textfont=dict(color="#e2e8f0", size=10)),
                  row=1, col=2)
    fig.add_trace(go.Pie(labels=["Included", "Missing"], values=[in_ref, total - in_ref],
                          marker=dict(colors=["#8b5cf6", "#64748b"]), hole=0.4, textfont=dict(color="#e2e8f0", size=10)),
                  row=1, col=3)
    
    fig.update_layout(
        plot_bgcolor="rgba(15,23,42,0.95)", paper_bgcolor="rgba(15,23,42,0.95)",
        font=dict(color="#e2e8f0"), height=300, showlegend=False,
    )
    st.plotly_chart(fig, use_container_width=True)

    # Problem citations
    problems = [c for c in citations if not c.verified or not c.style_correct or not c.reference_list]
    if problems:
        st.markdown(f"#### Citations with Issues ({len(problems)})")
        rows = [{"ID": c.id, "From": c.citing_doc, "To": c.cited_doc, "Type": c.citation_type,
                 "Verified": "✅" if c.verified else "❌", "Style": "✅" if c.style_correct else "❌",
                 "In List": "✅" if c.reference_list else "❌", "Context": f"{c.context_score:.0%}"}
                for c in problems]
        st.dataframe(pd.DataFrame(rows), use_container_width=True)

    # Context relevance distribution
    st.markdown("#### Context Relevance Distribution")
    context_bins = [0, 0.2, 0.4, 0.6, 0.8, 1.0]
    context_counts = [0] * (len(context_bins) - 1)
    for c in citations:
        for b in range(len(context_bins) - 1):
            if context_bins[b] <= c.context_score < context_bins[b + 1]:
                context_counts[b] += 1
                break
    
    fig2 = go.Figure(go.Bar(
        x=[f"{context_bins[i]:.0%}-{context_bins[i+1]:.0%}" for i in range(len(context_bins) - 1)],
        y=context_counts,
        marker_color=["#ef4444", "#f59e0b", "#eab308", "#22c55e", "#06b6d4"],
    ))
    fig2.update_layout(
        plot_bgcolor="rgba(15,23,42,0.95)", paper_bgcolor="rgba(15,23,42,0.95)",
        font=dict(color="#e2e8f0"), height=250, yaxis=dict(title="Count"),
    )
    st.plotly_chart(fig2, use_container_width=True)


def _render_anomalies(anomalies: List[CitationAnomaly]):
    """Render citation anomalies."""
    st.markdown("#### Citation Pattern Anomalies")

    severity_color = {"critical": "#ef4444", "high": "#f97316", "medium": "#eab308", "low": "#22c55e"}
    severity_icon = {"critical": "🔴", "high": "🟠", "medium": "🟡", "low": "🟢"}

    for anomaly in anomalies:
        s_color = severity_color[anomaly.severity]
        st.markdown(f"""
        <div style="background:rgba(30,41,59,0.8); border-left:4px solid {s_color}; border-radius:0 12px 12px 0;
            padding:16px; margin-bottom:12px;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                <span style="font-size:1.1rem;">{severity_icon[anomaly.severity]}</span>
                <span style="font-weight:700; color:#e2e8f0;">{anomaly.type}</span>
                <span style="padding:2px 8px; border-radius:6px; background:{s_color}20; color:{s_color};
                    font-size:0.7rem; font-weight:600;">{anomaly.severity.upper()}</span>
            </div>
            <p style="color:#cbd5e1; font-size:0.85rem; margin:0;">{anomaly.description}</p>
            <div style="margin-top:8px; font-size:0.75rem;">
                <span style="color:#94a3b8;">Documents: </span>
                <span style="color:#e2e8f0;">{', '.join(anomaly.documents)}</span>
            </div>
            <div style="margin-top:4px; font-size:0.75rem;">
                <span style="color:#94a3b8;">Recommendation: </span>
                <span style="color:#fbbf24;">{anomaly.recommendation}</span>
            </div>
        </div>
        """, unsafe_allow_html=True)

    # Anomaly summary
    st.markdown("---")
    st.markdown("#### Anomaly Summary")
    sev_counts = Counter(a.severity for a in anomalies)
    cols = st.columns(4)
    for i, sev in enumerate(["critical", "high", "medium", "low"]):
        count = sev_counts.get(sev, 0)
        with cols[i]:
            st.markdown(f"""
            <div class="cna-card">
                <div class="cna-val" style="color:{severity_color[sev]}">{count}</div>
                <div class="cna-lbl">{sev.title()}</div>
            </div>
            """, unsafe_allow_html=True)

    # Type breakdown
    type_counts = Counter(a.type for a in anomalies)
    fig = go.Figure(go.Bar(
        x=list(type_counts.keys()), y=list(type_counts.values()),
        marker_color=[severity_color[a.severity] for a in anomalies],
    ))
    fig.update_layout(
        plot_bgcolor="rgba(15,23,42,0.95)", paper_bgcolor="rgba(15,23,42,0.95)",
        font=dict(color="#e2e8f0"), height=250,
    )
    st.plotly_chart(fig, use_container_width=True)


# =============================================================================
# ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    render_citation_network_analyzer()
