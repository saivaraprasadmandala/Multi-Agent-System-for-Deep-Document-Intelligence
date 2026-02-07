from fastapi import FastAPI, UploadFile, File, Form
from pypdf import PdfReader
from langgraph.graph import StateGraph, END
import json

from rag_engine import chunk_text, build_index, retrieve_context
from agents import run_agent
from models import AgentState

app = FastAPI()

@app.post("/analyze")
async def analyze(file: UploadFile = File(...), api_key: str = Form(...)):
    reader = PdfReader(file.file)
    document_text = "\n".join([p.extract_text() for p in reader.pages if p.extract_text()])
    chunks = chunk_text(document_text)
    index = build_index(chunks)

    def summary_agent(state):
        context = retrieve_context("objectives scope decisions stakeholders", index, chunks)
        schema = {"decisions":[],"constraints":[],"stakeholders":[],"summary":""}
        state.update(run_agent("Summary", context, json.dumps(schema), api_key))
        return state

    def action_agent(state):
        context = retrieve_context("tasks milestones deadlines deliverables", index, chunks)
        schema = [{"id":"","description":"","owner":"","deadline":"","dependencies":[],"priority":""}]
        state["actions"] = run_agent("Action", context, json.dumps(schema), api_key)
        return state

    def risk_agent(state):
        context = retrieve_context("risks issues blockers assumptions", index, chunks)
        schema = [{"type":"","detail":"","impact_level":"","probability":"","mitigation":""}]
        state["risks"] = run_agent("Risk", context, json.dumps(schema), api_key)
        return state

    def confidence_agent(state):
        state["confidence"] = min(0.95, 0.5 + 0.1*len(state["actions"]))
        return state

    workflow = StateGraph(AgentState)
    workflow.add_node("summary", summary_agent)
    workflow.add_node("actions", action_agent)
    workflow.add_node("risks", risk_agent)
    workflow.add_node("confidence", confidence_agent)

    workflow.set_entry_point("summary")
    workflow.add_edge("summary","actions")
    workflow.add_edge("actions","risks")
    workflow.add_edge("risks","confidence")
    workflow.add_edge("confidence",END)

    final = workflow.compile().invoke({
        "document": document_text,
        "summary":"",
        "decisions":[],
        "constraints":[],
        "stakeholders":[],
        "actions":[],
        "risks":[],
        "confidence":0.0
    })

    return final
