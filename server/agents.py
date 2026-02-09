import json, re
from langchain_openai import ChatOpenAI

def safe_json(text):
    try:
        return json.loads(text)
    except:
        match = re.search(r'\{.*\}|\[.*\]', text, re.DOTALL)
        return json.loads(match.group()) if match else {}

def run_agent(role, context, schema, api_key):
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2, api_key=api_key)

    prompt = f"""
You are a {role} analysis specialist.

Return only JSON.

SCHEMA:
{schema}

CONTEXT:
{context}
"""
    return safe_json(llm.invoke(prompt).content)
