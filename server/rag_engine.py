import faiss, numpy as np
from sentence_transformers import SentenceTransformer

embed_model = SentenceTransformer("all-mpnet-base-v2")

def chunk_text(text, size=1200, overlap=200):
    return [text[i:i+size] for i in range(0, len(text), size-overlap)]

def build_index(chunks):
    embeddings = embed_model.encode(chunks)
    index = faiss.IndexFlatL2(embeddings.shape[1])
    index.add(np.array(embeddings))
    return index

def retrieve_context(query, index, chunks, k=5):
    q_embed = embed_model.encode([query])
    _, idx = index.search(np.array(q_embed), k)
    return "\n".join([chunks[i] for i in idx[0]])
