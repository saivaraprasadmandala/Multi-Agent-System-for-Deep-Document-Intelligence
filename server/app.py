import streamlit as st
import requests, json, pandas as pd

st.set_page_config(layout="wide")
st.title("📄 AI Document Intelligence")

api_key = st.text_input("Enter OpenAI API Key", type="password")
file = st.file_uploader("Upload PDF", type="pdf")

if st.button("Analyze") and file and api_key:
    with st.spinner("AI Agents Working..."):
        res = requests.post(
            "http://127.0.0.1:8000/analyze",
            files={"file": file.getvalue()},
            data={"api_key": api_key}
        )
        data = res.json()

    st.subheader("Summary")
    st.write(data["summary"])

    col1, col2 = st.columns(2)
    with col1:
        st.subheader("Actions")
        st.dataframe(pd.DataFrame(data["actions"]))
    with col2:
        st.subheader("Risks")
        st.dataframe(pd.DataFrame(data["risks"]))

    st.metric("Confidence", f"{data['confidence']*100:.1f}%")
    st.download_button("Download JSON", json.dumps(data, indent=2), "analysis.json")
