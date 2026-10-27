"""
Algorithm 7: Seeded Louvain Community Detection.
Executes modularity optimization on an undirected weighted projection of the transaction graph.
Computes community density, size, and mule concentration ratios deterministically.

CRITICAL ARCHITECTURAL NOTE:
Community membership reflects topological clustering and shared flow channels.
Membership in a community does not constitute proof of criminal activity.
"""
import networkx as nx
from typing import List, Dict, Any, Set, Tuple, Optional
from backend.app.models.schemas import CommunitySummary, LouvainOutput
from backend.app.core.config import config
from backend.app.core.logging import logger

def detect_louvain_communities(
    undirected_graph: nx.Graph,
    flagged_account_ids: Optional[Set[str]] = None,
    seed: int = 42
) -> Tuple[Dict[str, int], List[CommunitySummary]]:
    """
    Executes seeded Louvain community detection on the weighted undirected transaction graph.
    Returns:
    - account_to_community_id: Map of account_id -> canonical community ID.
    - community_summaries: List of CommunitySummary models sorted canonically.
    """
    if undirected_graph.number_of_nodes() == 0:
        return {}, []

    flagged_set = flagged_account_ids or set()

    # NetworkX 3.x native seeded Louvain
    try:
        raw_communities = nx.community.louvain_communities(
            undirected_graph,
            weight='weight',
            seed=seed
        )
    except Exception as e:
        logger.error(f"Louvain execution error: {e}. Falling back to connected components.")
        raw_communities = list(nx.connected_components(undirected_graph))

    # Canonical sorting: Sort communities primarily by size (descending), then by lexicographical min node
    sorted_communities = sorted(
        raw_communities,
        key=lambda nodes: (-len(nodes), sorted(list(nodes))[0] if nodes else "")
    )

    account_to_community: Dict[str, int] = {}
    summaries: List[CommunitySummary] = []

    for c_idx, node_set in enumerate(sorted_communities, start=1):
        for node in node_set:
            account_to_community[node] = c_idx

        subgraph = undirected_graph.subgraph(node_set)
        density = nx.density(subgraph) if len(node_set) > 1 else 0.0

        # Calculate volume
        total_vol = sum(data.get("weight", 0.0) for _, _, data in subgraph.edges(data=True))

        # Flagged concentration
        flagged_count = sum(1 for node in node_set if node in flagged_set)
        flagged_ratio = round(flagged_count / max(1, len(node_set)), 3)

        summaries.append(CommunitySummary(
            community_id=c_idx,
            size=len(node_set),
            internal_density=round(density, 4),
            flagged_account_count=flagged_count,
            flagged_ratio=flagged_ratio,
            total_volume=round(total_vol, 2)
        ))

    return account_to_community, summaries

def get_account_community_output(
    account_id: str,
    account_to_community: Dict[str, int],
    summaries: List[CommunitySummary]
) -> Optional[LouvainOutput]:
    """Returns the LouvainOutput diagnostic for a single account."""
    c_id = account_to_community.get(account_id)
    if c_id is None:
        return None

    # Find summary
    for s in summaries:
        if s.community_id == c_id:
            return LouvainOutput(
                community_id=s.community_id,
                community_size=s.size,
                internal_density=s.internal_density,
                mule_concentration_ratio=s.flagged_ratio
            )
    return None
