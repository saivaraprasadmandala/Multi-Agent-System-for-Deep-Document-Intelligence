from typing import TypedDict, List

class AgentState(TypedDict):
    document: str
    summary: str
    decisions: List[str]
    constraints: List[str]
    stakeholders: List[str]
    actions: List[dict]
    risks: List[dict]
    confidence: float
