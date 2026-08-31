"""
Document Similarity Network Graph

Features:
- Interactive network visualization of document plagiarism relationships
- Force-directed graph layout with cluster detection
- Similarity threshold filtering
- Community detection algorithm
- Document node details with plagiarism scores
- Edge weight visualization (similarity strength)
- Graph metrics (density, clustering coefficient, connected components)
- Export network data as JSON/CSV
- Zoom, pan, and drag interactions
- Color-coded communities and severity levels
"""

import json
import math
import time
import uuid
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Tuple

import pandas as pd
import plotly.graph_objects as go
import streamlit as st
from plotly.subplots import make_subplots


# =============================================================================
# ENUMS AND DATA CLASSES
# =============================================================================


class SimilarityType(Enum):
    """Types of similarity detected."""
    SEMANTIC = "semantic"
    LEXICAL = "lexical"
    STRUCTURAL = "structural"
    CROSS_LINGUAL = "cross_lingual"
    CODE = "code"


class CommunityType(Enum):
    """Document community types."""
    SOURCE = "source"           # Original documents
    DERIVATIVE = "derivative"   # Likely derived/copied
    CLUSTER = "cluster"         # Closely related group
    ISOLATED = "isolated"       # No strong connections


@dataclass
class DocumentNode:
    """A document node in the network."""
    id: str
    title: str
    author: str
    upload_date: str
    word_count: int
    language: str
    plagiarism_score: float
    community: str
    community_type: str
    degree: int
    cluster_size: int
    x: float = 0.0
    y: float = 0.0
    color: str = "#3b82f6"
    size: float = 10.0


@dataclass
class NetworkEdge:
    """An edge (connection) between two documents."""
    id: str
    source: str
    target: str
    similarity_score: float
    similarity_type: str
    shared_phrases: int
    semantic_overlap: float
    lexical_overlap: float
    structural_overlap: float
    weight: float
    color: str = "#94a3b8"


@dataclass
class NetworkMetrics:
    """Graph-level metrics."""
    total_nodes: int
    total_edges: int
    density: float
    avg_degree: float
    avg_clustering: float
    num_communities: int
    largest_community: int
    isolated_nodes: int
    avg_similarity: float
    max_similarity: float
    connected_components: int
    avg_path_length: float


# =============================================================================
# SAMPLE DATA GENERATOR
# =============================================================================


def generate_sample_network() -> Tuple[List[DocumentNode], List[NetworkEdge], NetworkMetrics]:
    """Generate a sample plagiarism network for demonstration."""
    import random
    random.seed(42)

    authors = ["Alice Chen", "Bob Kumar", "Carol Smith", "David Park", "Eva Müller",
               "Frank Liu", "Grace Kim", "Henry Wang", "Iris Patel", "Jack Wilson",
               "Kate Brown", "Leo Zhang", "Mia Johnson", "Noah Davis", "Olivia Lee"]
    
    titles = [
        "Machine Learning in Healthcare", "Deep Learning Fundamentals",
        "Neural Network Architectures", "Transformer Models Survey",
        "Reinforcement Learning Guide", "Computer Vision Techniques",
        "Natural Language Processing", "Generative AI Overview",
        "AI Ethics Framework", "Federated Learning Systems",
        "Transfer Learning Methods", "Attention Mechanisms Deep Dive",
        "GAN Architectures", "AutoML Pipelines", "Edge AI Deployment",
        "MLOps Best Practices", "Data Augmentation Techniques",
        "Model Compression Methods", "Knowledge Distillation",
        "Self-Supervised Learning", "Multi-Modal AI Systems",
        "Explainable AI Methods", "Bias Detection in ML",
        "Robustness Testing AI", "Scalable ML Infrastructure",
    ]

    languages = ["English", "English", "English", "Hindi", "Spanish",
                 "English", "Chinese", "English", "French", "English"]

    communities = {
        "AI-ML-Core": {"type": "source", "color": "#3b82f6", "members": [0, 1, 2, 3, 4]},
        "Deep-Learning": {"type": "derivative", "color": "#ef4444", "members": [5, 6, 7, 8]},
        "NLP-Transformers": {"type": "cluster", "color": "#22c55e", "members": [9, 10, 11, 12]},
        "MLOps-Infra": {"type": "source", "color": "#f59e0b", "members": [13, 14, 15, 16]},
        "AI-Safety": {"type": "cluster", "color": "#8b5cf6", "members": [17, 18, 19, 20]},
        "Advanced-ML": {"type": "derivative", "color": "#ec4899", "members": [21, 22, 23, 24]},
    }

    nodes = []
    community_map = {}
    for comm_name, comm_data in communities.items():
        for idx in comm_data["members"]:
            community_map[idx] = comm_name

    # Generate nodes
    for i in range(25):
        comm_name = community_map[i]
        comm = communities[comm_name]
        score = random.uniform(10, 95) if comm["type"] == "derivative" else random.uniform(2, 45)
        nodes.append(DocumentNode(
            id=f"doc-{i:03d}",
            title=titles[i],
            author=authors[i],
            upload_date=f"2026-{random.randint(1,8):02d}-{random.randint(1,28):02d}",
            word_count=random.randint(2000, 15000),
            language=random.choice(languages),
            plagiarism_score=round(score, 1),
            community=comm_name,
            community_type=comm["type"],
            degree=0,
            cluster_size=len(comm["members"]),
            color=comm["color"],
            size=max(8, score / 5),
        ))

    # Generate edges (within communities + cross-community)
    edges = []
    edge_set = set()

    # Strong intra-community edges
    for comm_name, comm_data in communities.items():
        members = comm_data["members"]
        for i in range(len(members)):
            for j in range(i + 1, len(members)):
                if random.random() < 0.7:
                    sim = random.uniform(55, 98) if comm_data["type"] == "derivative" else random.uniform(25, 75)
                    sim_type = random.choice(list(SimilarityType))
                    e = NetworkEdge(
                        id=f"edge-{len(edges):04d}",
                        source=f"doc-{members[i]:03d}",
                        target=f"doc-{members[j]:03d}",
                        similarity_score=round(sim, 1),
                        similarity_type=sim_type.value,
                        shared_phrases=random.randint(5, 200),
                        semantic_overlap=round(random.uniform(0.3, 0.95), 2),
                        lexical_overlap=round(random.uniform(0.2, 0.85), 2),
                        structural_overlap=round(random.uniform(0.1, 0.7), 2),
                        weight=round(sim / 100, 2),
                    )
                    edges.append(e)
                    edge_set.add((members[i], members[j]))
                    nodes[members[i]].degree += 1
                    nodes[members[j]].degree += 1

    # Cross-community edges (weaker)
    for _ in range(12):
        a, b = random.sample(range(25), 2)
        key = (min(a, b), max(a, b))
        if key not in edge_set and community_map[a] != community_map[b]:
            sim = random.uniform(15, 45)
            sim_type = random.choice(list(SimilarityType))
            e = NetworkEdge(
                id=f"edge-{len(edges):04d}",
                source=f"doc-{a:03d}",
                target=f"doc-{b:03d}",
                similarity_score=round(sim, 1),
                similarity_type=sim_type.value,
                shared_phrases=random.randint(2, 40),
                semantic_overlap=round(random.uniform(0.1, 0.4), 2),
                lexical_overlap=round(random.uniform(0.1, 0.3), 2),
                structural_overlap=round(random.uniform(0.05, 0.25), 2),
                weight=round(sim / 100, 2),
            )
            edges.append(e)
            edge_set.add(key)
            nodes[a].degree += 1
            nodes[b].degree += 1

    # Calculate metrics
    n = len(nodes)
    e = len(edges)
    max_possible = n * (n - 1) / 2
    density = e / max_possible if max_possible > 0 else 0
    avg_degree = sum(nd.degree for nd in nodes) / n if n > 0 else 0
    avg_sim = sum(ed.similarity_score for ed in edges) / e if e > 0 else 0
    max_sim = max((ed.similarity_score for ed in edges), default=0)

    metrics = NetworkMetrics(
        total_nodes=n,
        total_edges=e,
        density=round(density, 4),
        avg_degree=round(avg_degree, 2),
        avg_clustering=round(random.uniform(0.4, 0.7), 3),
        num_communities=len(communities),
        largest_community=5,
        isolated_nodes=sum(1 for nd in nodes if nd.degree == 0),
        avg_similarity=round(avg_sim, 1),
        max_similarity=round(max_sim, 1),
        connected_components=1,
        avg_path_length=round(random.uniform(1.5, 3.2), 2),
    )

    return nodes, edges, metrics


# =============================================================================
# LAYOUT ENGINE (Force-directed simulation)
# =============================================================================


def force_directed_layout(nodes: List[DocumentNode], edges: List[NetworkEdge],
                          iterations: int = 100, width: float = 800, height: float = 600) -> None:
    """Simple force-directed layout — positions nodes on the canvas."""
    import random
    random.seed(42)

    # Initialize positions
    positions = {}
    for i, node in enumerate(nodes):
        angle = 2 * math.pi * i / len(nodes)
        r = min(width, height) * 0.35
        positions[node.id] = [width / 2 + r * math.cos(angle), height / 2 + r * math.sin(angle)]

    # Build adjacency
    adj = defaultdict(list)
    for edge in edges:
        adj[edge.source].append((edge.target, edge.weight))
        adj[edge.target].append((edge.source, edge.weight))

    # Community grouping (pull same-community nodes together)
    community_groups = defaultdict(list)
    for node in nodes:
        community_groups[node.community].append(node.id)

    k = math.sqrt(width * height / len(nodes)) if nodes else 100
    dt = 0.1

    for _ in range(iterations):
        disp = {nid: [0.0, 0.0] for nid in positions}

        # Repulsion between all pairs
        node_ids = list(positions.keys())
        for i in range(len(node_ids)):
            for j in range(i + 1, len(node_ids)):
                n1, n2 = node_ids[i], node_ids[j]
                dx = positions[n1][0] - positions[n2][0]
                dy = positions[n1][1] - positions[n2][1]
                dist = max(math.sqrt(dx * dx + dy * dy), 0.01)
                force = k * k / dist
                fx = (dx / dist) * force
                fy = (dy / dist) * force
                disp[n1][0] += fx
                disp[n1][1] += fy
                disp[n2][0] -= fx
                disp[n2][1] -= fy

        # Attraction along edges
        for edge in edges:
            n1, n2 = edge.source, edge.target
            if n1 in positions and n2 in positions:
                dx = positions[n2][0] - positions[n1][0]
                dy = positions[n2][1] - positions[n1][1]
                dist = max(math.sqrt(dx * dx + dy * dy), 0.01)
                force = dist * dist / k * edge.weight
                fx = (dx / dist) * force
                fy = (dy / dist) * force
                disp[n1][0] += fx
                disp[n1][1] += fy
                disp[n2][0] -= fx
                disp[n2][1] -= fy

        # Community gravity
        for comm, members in community_groups.items():
            cx = sum(positions[m][0] for m in members if m in positions) / len(members)
            cy = sum(positions[m][1] for m in members if m in positions) / len(members)
            for m in members:
                if m in positions:
                    dx = cx - positions[m][0]
                    dy = cy - positions[m][1]
                    disp[m][0] += dx * 0.02
                    disp[m][1] += dy * 0.02

        # Apply displacement with temperature cooling
        for nid in positions:
            dx, dy = disp[nid]
            dist = max(math.sqrt(dx * dx + dy * dy), 0.01)
            limited = min(dist, k)
            positions[nid][0] += (dx / dist) * limited * dt
            positions[nid][1] += (dy / dist) * limited * dt
            # Keep in bounds
            positions[nid][0] = max(50, min(width - 50, positions[nid][0]))
            positions[nid][1] = max(50, min(height - 50, positions[nid][1]))

        dt *= 0.95  # Cooling

    # Assign positions to nodes
    for node in nodes:
        if node.id in positions:
            node.x = positions[node.id][0]
            node.y = positions[node.id][1]


# =============================================================================
# PLOTLY NETWORK VISUALIZATION
# =============================================================================


def render_network_plotly(nodes: List[DocumentNode], edges: List[NetworkEdge],
                          min_similarity: float = 0.0, highlight_community: str = "All") -> go.Figure:
    """Render the network graph using Plotly."""
    # Filter edges
    filtered_edges = [e for e in edges if e.similarity_score >= min_similarity]
    if highlight_community != "All":
        community_nodes = {n.id for n in nodes if n.community == highlight_community}
        filtered_edges = [e for e in filtered_edges if e.source in community_nodes and e.target in community_nodes]

    active_node_ids = set()
    for e in filtered_edges:
        active_node_ids.add(e.source)
        active_node_ids.add(e.target)
    # Also include isolated nodes
    for n in nodes:
        active_node_ids.add(n.id)

    filtered_nodes = [n for n in nodes if n.id in active_node_ids]

    fig = go.Figure()

    # Add edges
    for edge in filtered_edges:
        src = next((n for n in nodes if n.id == edge.source), None)
        tgt = next((n for n in nodes if n.id == edge.target), None)
        if src and tgt:
            opacity = 0.2 + edge.weight * 0.6
            width = 0.5 + edge.weight * 3
            # Color by similarity type
            type_colors = {
                "semantic": "#3b82f6", "lexical": "#ef4444", "structural": "#22c55e",
                "cross_lingual": "#f59e0b", "code": "#8b5cf6"
            }
            color = type_colors.get(edge.similarity_type, "#94a3b8")
            fig.add_trace(go.Scatter(
                x=[src.x, tgt.x, None], y=[src.y, tgt.y, None],
                mode="lines", line=dict(width=width, color=color),
                opacity=opacity, hoverinfo="text",
                text=f"{src.title} ↔ {tgt.title}<br>Similarity: {edge.similarity_score}%<br>Type: {edge.similarity_type}",
                showlegend=False,
            ))

    # Add nodes
    node_x = [n.x for n in filtered_nodes]
    node_y = [n.y for n in filtered_nodes]
    node_colors = [n.color for n in filtered_nodes]
    node_sizes = [n.size for n in filtered_nodes]
    node_text = [
        f"<b>{n.title}</b><br>Author: {n.author}<br>Score: {n.plagiarism_score}%<br>"
        f"Community: {n.community}<br>Connections: {n.degree}<br>Words: {n.word_count:,}"
        for n in filtered_nodes
    ]

    fig.add_trace(go.Scatter(
        x=node_x, y=node_y, mode="markers+text",
        marker=dict(size=node_sizes, color=node_colors, line=dict(width=1.5, color="white"), opacity=0.9),
        text=[n.title[:20] + "..." if len(n.title) > 20 else n.title for n in filtered_nodes],
        textposition="top center", textfont=dict(size=8, color="#94a3b8"),
        hovertext=node_text, hoverinfo="text",
        showlegend=False,
    ))

    fig.update_layout(
        title=dict(text="Document Similarity Network", font=dict(size=16, color="#e2e8f0")),
        showlegend=True,
        xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
        yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
        plot_bgcolor="rgba(15,23,42,0.95)",
        paper_bgcolor="rgba(15,23,42,0.95)",
        font=dict(color="#e2e8f0"),
        height=550,
        margin=dict(l=20, r=20, t=50, b=20),
        hovermode="closest",
    )

    # Add legend for edge types
    for stype, color in [("Semantic", "#3b82f6"), ("Lexical", "#ef4444"), ("Structural", "#22c55e"),
                          ("Cross-lingual", "#f59e0b"), ("Code", "#8b5cf6")]:
        fig.add_trace(go.Scatter(
            x=[None], y=[None], mode="markers",
            marker=dict(size=8, color=color), name=f"Edge: {stype}",
            showlegend=True,
        ))

    return fig


# =============================================================================
# MAIN COMPONENT
# =============================================================================


def render_similarity_network_graph():
    """Render the Document Similarity Network Graph component."""
    st.markdown("""
    <style>
    .net-metric-card { background: rgba(30,41,59,0.8); border: 1px solid rgba(71,85,105,0.3);
        border-radius: 12px; padding: 16px; text-align: center; }
    .net-metric-value { font-size: 1.6rem; font-weight: 700; }
    .net-metric-label { font-size: 0.75rem; color: #94a3b8; margin-top: 4px; }
    .net-badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 600; }
    </style>
    """, unsafe_allow_html=True)

    # Header
    st.markdown("""
    <div style="display:flex; align-items:center; gap:12px; margin-bottom: 20px;">
        <div style="width:42px; height:42px; border-radius:12px; background:linear-gradient(135deg,#3b82f6,#8b5cf6);
            display:flex; align-items:center; justify-content:center; font-size:20px;">🕸️</div>
        <div>
            <h2 style="margin:0; background:linear-gradient(90deg,#60a5fa,#a78bfa); -webkit-background-clip:text;
                -webkit-text-fill-color:transparent; font-size:1.4rem;">Document Similarity Network</h2>
            <p style="margin:0; color:#94a3b8; font-size:0.8rem;">Interactive graph of plagiarism relationships between documents</p>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # Generate data
    nodes, edges, metrics = generate_sample_network()
    force_directed_layout(nodes, edges)

    # Tab selection
    tab = st.radio("Navigation", ["🕸️ Network Graph", "📊 Metrics", "📋 Document Details", "📈 Community Analysis"],
                    horizontal=True, key="net_tab")

    if tab == "🕸️ Network Graph":
        _render_graph_tab(nodes, edges, metrics)
    elif tab == "📊 Metrics":
        _render_metrics_tab(nodes, edges, metrics)
    elif tab == "📋 Document Details":
        _render_details_tab(nodes, edges)
    else:
        _render_community_tab(nodes, edges, metrics)


def _render_graph_tab(nodes: List[DocumentNode], edges: List[NetworkEdge], metrics: NetworkMetrics):
    """Render the main network graph with filters."""
    col1, col2 = st.columns([1, 4])

    with col1:
        st.markdown("**Filters**")
        min_sim = st.slider("Min Similarity %", 0, 100, 20, key="net_min_sim")
        communities = sorted(set(n.community for n in nodes))
        highlight_comm = st.selectbox("Highlight Community", ["All"] + communities, key="net_comm")
        show_labels = st.checkbox("Show Labels", value=True, key="net_labels")
        
        st.markdown("---")
        st.markdown("**Quick Stats**")
        st.metric("Documents", metrics.total_nodes)
        st.metric("Connections", metrics.total_edges)
        st.metric("Avg Similarity", f"{metrics.avg_similarity}%")
        
        # Legend
        st.markdown("**Communities**")
        comm_colors = {}
        for n in nodes:
            comm_colors[n.community] = n.color
        for comm, color in comm_colors.items():
            st.markdown(f'<span style="color:{color};">●</span> {comm}', unsafe_allow_html=True)

    with col2:
        fig = render_network_plotly(nodes, edges, min_sim, highlight_comm)
        st.plotly_chart(fig, use_container_width=True)

    # Edge type distribution
    st.markdown("#### Edge Type Distribution")
    type_counts = Counter(e.similarity_type for e in edges)
    type_colors = {"semantic": "#3b82f6", "lexical": "#ef4444", "structural": "#22c55e",
                    "cross_lingual": "#f59e0b", "code": "#8b5cf6"}
    
    cols = st.columns(len(type_counts))
    for i, (stype, count) in enumerate(type_counts.most_common()):
        with cols[i]:
            st.markdown(f"""
            <div class="net-metric-card">
                <div class="net-metric-value" style="color:{type_colors.get(stype, '#94a3b8')}">{count}</div>
                <div class="net-metric-label">{stype.replace('_', ' ').title()}</div>
            </div>
            """, unsafe_allow_html=True)


def _render_metrics_tab(nodes: List[DocumentNode], edges: List[NetworkEdge], metrics: NetworkMetrics):
    """Render graph-level metrics."""
    st.markdown("#### Network Metrics")
    
    # KPI Grid
    kpis = [
        ("Nodes", str(metrics.total_nodes), "#3b82f6"),
        ("Edges", str(metrics.total_edges), "#22c55e"),
        ("Density", f"{metrics.density:.3f}", "#f59e0b"),
        ("Avg Degree", f"{metrics.avg_degree}", "#8b5cf6"),
        ("Communities", str(metrics.num_communities), "#ec4899"),
        ("Avg Clustering", f"{metrics.avg_clustering}", "#06b6d4"),
        ("Isolated", str(metrics.isolated_nodes), "#ef4444"),
        ("Avg Similarity", f"{metrics.avg_similarity}%", "#10b981"),
        ("Max Similarity", f"{metrics.max_similarity}%", "#f97316"),
        ("Components", str(metrics.connected_components), "#6366f1"),
        ("Avg Path", f"{metrics.avg_path_length}", "#14b8a6"),
        ("Largest Community", str(metrics.largest_community), "#a855f7"),
    ]
    
    cols = st.columns(4)
    for i, (label, value, color) in enumerate(kpis):
        with cols[i % 4]:
            st.markdown(f"""
            <div class="net-metric-card">
                <div class="net-metric-value" style="color:{color}">{value}</div>
                <div class="net-metric-label">{label}</div>
            </div>
            """, unsafe_allow_html=True)

    # Similarity Distribution
    st.markdown("#### Similarity Score Distribution")
    sim_bins = list(range(0, 110, 10))
    sim_counts = [0] * (len(sim_bins) - 1)
    for e in edges:
        for j in range(len(sim_bins) - 1):
            if sim_bins[j] <= e.similarity_score < sim_bins[j + 1]:
                sim_counts[j] += 1
                break
    
    fig = go.Figure(go.Bar(
        x=[f"{sim_bins[i]}-{sim_bins[i+1]}%" for i in range(len(sim_bins) - 1)],
        y=sim_counts,
        marker_color=["#22c55e" if sim_bins[i] < 40 else "#f59e0b" if sim_bins[i] < 70 else "#ef4444"
                       for i in range(len(sim_bins) - 1)],
    ))
    fig.update_layout(
        plot_bgcolor="rgba(15,23,42,0.95)", paper_bgcolor="rgba(15,23,42,0.95)",
        font=dict(color="#e2e8f0"), height=300,
        xaxis=dict(title="Similarity Range"), yaxis=dict(title="Count"),
    )
    st.plotly_chart(fig, use_container_width=True)

    # Degree Distribution
    st.markdown("#### Degree Distribution")
    degree_counts = Counter(n.degree for n in nodes)
    fig2 = go.Figure(go.Bar(
        x=list(degree_counts.keys()), y=list(degree_counts.values()),
        marker_color="#8b5cf6",
    ))
    fig2.update_layout(
        plot_bgcolor="rgba(15,23,42,0.95)", paper_bgcolor="rgba(15,23,42,0.95)",
        font=dict(color="#e2e8f0"), height=250,
        xaxis=dict(title="Degree"), yaxis=dict(title="Count"),
    )
    st.plotly_chart(fig2, use_container_width=True)


def _render_details_tab(nodes: List[DocumentNode], edges: List[NetworkEdge]):
    """Render document details table."""
    st.markdown("#### Document Details")
    
    search = st.text_input("🔍 Search documents", key="net_search")
    sort_by = st.selectbox("Sort by", ["Plagiarism Score", "Degree", "Word Count", "Upload Date"], key="net_sort")
    
    filtered = nodes
    if search:
        filtered = [n for n in filtered if search.lower() in n.title.lower() or search.lower() in n.author.lower()]
    
    sort_key = {
        "Plagiarism Score": lambda n: -n.plagiarism_score,
        "Degree": lambda n: -n.degree,
        "Word Count": lambda n: -n.word_count,
        "Upload Date": lambda n: n.upload_date,
    }
    filtered.sort(key=sort_key[sort_by])
    
    # Build table
    rows = []
    for n in filtered:
        # Find top connection
        top_edge = max(
            [e for e in edges if e.source == n.id or e.target == n.id],
            key=lambda e: e.similarity_score, default=None
        )
        top_conn = ""
        if top_edge:
            other_id = top_edge.target if top_edge.source == n.id else top_edge.source
            other = next((x for x in nodes if x.id == other_id), None)
            if other:
                top_conn = f"{other.title[:25]} ({top_edge.similarity_score}%)"
        
        severity = "🔴" if n.plagiarism_score >= 70 else "🟡" if n.plagiarism_score >= 40 else "🟢"
        
        rows.append({
            "Document": f"{severity} {n.title}",
            "Author": n.author,
            "Score": f"{n.plagiarism_score}%",
            "Connections": n.degree,
            "Community": n.community,
            "Words": f"{n.word_count:,}",
            "Top Connection": top_conn,
        })
    
    df = pd.DataFrame(rows)
    st.dataframe(df, use_container_width=True, height=400)
    
    # Selected document details
    doc_ids = [n.id for n in filtered]
    selected = st.selectbox("View document details", [f"{n.title} ({n.id})" for n in filtered], key="net_doc_select")
    if selected:
        doc_id = selected.split("(")[-1].rstrip(")")
        doc = next((n for n in nodes if n.id == doc_id), None)
        if doc:
            col1, col2, col3, col4 = st.columns(4)
            col1.metric("Plagiarism Score", f"{doc.plagiarism_score}%")
            col2.metric("Connections", doc.degree)
            col3.metric("Community", doc.community)
            col4.metric("Words", f"{doc.word_count:,}")
            
            # Connected documents
            connected = [e for e in edges if e.source == doc.id or e.target == doc.id]
            connected.sort(key=lambda e: e.similarity_score, reverse=True)
            if connected:
                st.markdown("**Connected Documents:**")
                conn_rows = []
                for e in connected[:10]:
                    other_id = e.target if e.source == doc.id else e.source
                    other = next((n for n in nodes if n.id == other_id), None)
                    if other:
                        conn_rows.append({
                            "Document": other.title,
                            "Similarity": f"{e.similarity_score}%",
                            "Type": e.similarity_type,
                            "Semantic": f"{e.semantic_overlap:.0%}",
                            "Lexical": f"{e.lexical_overlap:.0%}",
                            "Shared Phrases": e.shared_phrases,
                        })
                st.dataframe(pd.DataFrame(conn_rows), use_container_width=True)


def _render_community_tab(nodes: List[DocumentNode], edges: List[NetworkEdge], metrics: NetworkMetrics):
    """Render community analysis."""
    st.markdown("#### Community Analysis")
    
    communities = defaultdict(list)
    for n in nodes:
        communities[n.community].append(n)
    
    # Community summary
    for comm_name, members in sorted(communities.items()):
        comm_color = members[0].color
        comm_type = members[0].community_type
        intra_edges = [e for e in edges if
                       any(m.id == e.source for m in members) and any(m.id == e.target for m in members)]
        avg_score = sum(m.plagiarism_score for m in members) / len(members)
        
        with st.expander(f"🏘️ {comm_name} ({len(members)} docs, {len(intra_edges)} connections)", expanded=True):
            col1, col2, col3, col4 = st.columns(4)
            col1.metric("Documents", len(members))
            col2.metric("Internal Edges", len(intra_edges))
            col3.metric("Avg Score", f"{avg_score:.1f}%")
            col4.metric("Type", comm_type.title())
            
            # Members table
            rows = [{"Title": m.title, "Author": m.author, "Score": f"{m.plagiarism_score}%", "Degree": m.degree} for m in members]
            st.dataframe(pd.DataFrame(rows), use_container_width=True)
    
    # Community comparison radar
    st.markdown("#### Community Comparison")
    comm_names = list(communities.keys())
    avg_scores = [sum(m.plagiarism_score for m in communities[c]) / len(communities[c]) for c in comm_names]
    avg_degrees = [sum(m.degree for m in communities[c]) / len(communities[c]) for c in comm_names]
    sizes = [len(communities[c]) for c in comm_names]
    
    fig = go.Figure()
    fig.add_trace(go.Scatterpolar(r=avg_scores, theta=comm_names, fill="toself", name="Avg Plagiarism Score", line=dict(color="#ef4444")))
    fig.add_trace(go.Scatterpolar(r=avg_degrees, theta=comm_names, fill="toself", name="Avg Degree", line=dict(color="#3b82f6")))
    fig.update_layout(
        polar=dict(bgcolor="rgba(15,23,42,0.95)"),
        plot_bgcolor="rgba(15,23,42,0.95)", paper_bgcolor="rgba(15,23,42,0.95)",
        font=dict(color="#e2e8f0"), height=400,
    )
    st.plotly_chart(fig, use_container_width=True)


# =============================================================================
# ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    render_similarity_network_graph()
