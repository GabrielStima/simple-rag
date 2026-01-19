# RAG System with Local Models

A production-ready Retrieval-Augmented Generation (RAG) system built with Node.js and TypeScript that enables intelligent question-answering from PDF documents using **completely local/offline models** - no API keys or external services required.

## 🚀 Features

- **🔒 100% Local & Offline** - No API keys, no cloud dependencies, runs entirely on your machine
- **📄 PDF Document Processing** - Upload and process PDF documents automatically
- **🧠 Semantic Search** - Uses embedding-based vector similarity for intelligent retrieval
- **🔄 Advanced Reranking** - Two-stage retrieval with keyword-based reranking for improved accuracy
- **🤖 Local Text Generation** - Generates answers using Xenova/LaMini-T5-738M
- **📊 Built-in Diagnostics** - Comprehensive evaluation metrics and debugging tools
- **⚡ Fast & Efficient** - In-memory vector store with optimized chunking strategy
- **📚 Interactive API Documentation** - Swagger UI for easy testing and exploration

## 🔍 How It Works

This RAG system implements a sophisticated retrieval and generation pipeline:

### Indexing Phase (Upload)
1. **PDF Parsing** - Extracts text from uploaded PDF
2. **Text Chunking** - Splits text into 800-character chunks with 200-character overlap
3. **Embedding Generation** - Converts each chunk to a 384-dimensional vector using `Xenova/all-MiniLM-L6-v2`
4. **Vector Storage** - Stores chunks and embeddings in an in-memory vector database

### Query Phase (Ask)
1. **Question Embedding** - Converts user question to vector representation
2. **Similarity Search** - Retrieves top 15 most similar chunks using cosine similarity
3. **Filtering** - Keeps only chunks with similarity score < 0.6
4. **Reranking** - Reorders chunks by keyword overlap for better relevance
5. **Context Building** - Combines top 5 reranked chunks
6. **Answer Generation** - Feeds context to LaMini-T5-738M for answer synthesis

## 💾 Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- At least 4GB RAM (for model loading)

### Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd simple-rag

# Install dependencies
npm install --legacy-peer-deps

# Build the project
npm run build

# Start the server
npm start
```

The server will start at `http://localhost:3000`

**Swagger documentation will be available at `http://localhost:3000/api-docs`**

## 🎯 Usage

### Interactive Testing with Swagger UI

The easiest way to test the API is through the **Swagger UI** interface:

1. Start the server: `npm start`
2. Open your browser: `http://localhost:3000/api-docs`
3. Use the interactive interface to:
   - Upload PDF files
   - Ask questions with debug mode
   - View detailed request/response schemas

### Command Line Testing

### 1. Upload a PDF Document

```bash
curl -X POST http://localhost:3000/api/upload \
  -F "pdf=@/path/to/your/document.pdf"
```

**Response:**
```json
{
  "message": "File processed successfully"
}
```

### 2. Ask Questions

```bash
curl -X POST http://localhost:3000/api/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Who is Fulano?"
  }'
```

**Response:**
```json
{
  "answer": "Fulano was born in Rio Grande do Sul..."
}
```

### 3. Enable Debug Mode

```bash
curl -X POST http://localhost:3000/api/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Who is Fulano?",
    "debug": true
  }'
```

**Response with Diagnostics:**
```json
{
  "answer": "Fulano was born in...",
  "diagnostics": {
    "retrieval": {
      "totalChunksSearched": 15,
      "chunksUsed": 5,
      "averageSimilarityScore": 0.3421,
      "topScores": [0.2891, 0.3245, 0.3567, 0.3821, 0.4012],
      "contextLength": 3842,
      "qualityWarning": null
    },
    "generation": {
      "promptLength": 4210,
      "answerLength": 156,
      "generationTimeMs": 8234,
      "modelUsed": "Xenova/LaMini-T5-738M"
    },
    "retrievedChunks": [
      {
        "index": 1,
        "originalScore": 0.3821,
        "rerankScore": 0.857,
        "preview": "Fulano was born in..."
      }
    ]
  }
}
```

## 📡 API Reference

### Swagger Documentation

**Interactive API documentation is available at: `http://localhost:3000/api-docs`**

The Swagger UI provides:
- Complete API schema
- Interactive request testing
- Request/response examples
- Model definitions
- Easy file upload testing

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                  PDF Upload                         │
│  (Multer → PDF Parse → Text Splitter)               │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│            Embedding Generation                     │
│  (Xenova/all-MiniLM-L6-v2 - 384 dimensions)         │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│            Vector Store (In-Memory)                 │
│  Chunks + Embeddings stored for similarity search   │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│                User Question                        │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│          Similarity Search (Cosine)                 │
│  Find 15 most similar chunks by vector distance     │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│         Filtering (score < 0.6)                      │
│  Keep only reasonably relevant chunks                │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│      Reranking (Keyword Overlap)                     │
│  Reorder by question term frequency                  │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│          Context Building                            │
│  Concatenate top 5 chunks                           │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│         Answer Generation                            │
│  (Xenova/LaMini-T5-738M)                            │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│              Final Answer                            │
└─────────────────────────────────────────────────────┘
```

### Key Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Web Server** | Express.js | HTTP API endpoints |
| **PDF Parser** | pdf-parse | Extract text from PDFs |
| **Text Splitter** | LangChain RecursiveCharacterTextSplitter | Chunk documents |
| **Embeddings** | Xenova/all-MiniLM-L6-v2 | Convert text → vectors |
| **Vector Store** | LangChain MemoryVectorStore | Store and search embeddings |
| **Reranker** | Custom keyword overlap | Improve retrieval accuracy |
| **LLM** | Xenova/LaMini-T5-738M | Generate natural language answers |

## 📊 Evaluation & Debugging

### Understanding Similarity Scores

The similarity score indicates how relevant a chunk is to the question:

- **0.0 - 0.3**: Highly relevant ✅
- **0.3 - 0.5**: Moderately relevant ⚠️
- **0.5 - 0.6**: Weakly relevant 🔶
- **> 0.6**: Not relevant ❌

### Diagnostic Flags

Enable detailed debugging with the `debug` parameter:

```json
{
  "question": "Your question",
  "debug": true
}
```

This returns:
- Retrieval quality metrics
- Chunk similarity scores
- Reranking information
- Generation parameters
- Full chunk previews
- Quality warnings

### Quality Warning System

The system automatically warns when retrieval quality is poor:

```json
"qualityWarning": "Poor retrieval quality - document may not contain relevant information"
```

This triggers when the best chunk has a score > 0.6, indicating the answer likely isn't in the document.

## ⚠️ Limitations

### Current Limitations

1. **Small Model Size** - LaMini-T5-738M (738M parameters) struggles with:
   - Complex multi-hop reasoning
   - Inference across multiple facts
   - Long-form detailed answers
   
2. **In-Memory Storage** - Vector store is lost on server restart

3. **Single Document** - Only one PDF can be active at a time

4. **No Persistence** - Documents must be re-uploaded after restart

5. **Limited Context Window** - Model can only process ~512 tokens

### When to Upgrade

Consider upgrading to a larger model if you experience:
- Incomplete or confused answers
- Poor inference on "who/what/how" questions
- Hallucinations despite good context
- Generic responses that don't use retrieved information

**Better Model Options:**
- `Xenova/flan-t5-base` (250M - better reasoning)
- `Xenova/flan-t5-large` (780M - much better quality)
- External APIs (OpenAI GPT-4, Anthropic Claude) for production use

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Runtime** | Node.js 18+ |
| **Language** | TypeScript 5.9 |
| **Framework** | Express 5.2 |
| **API Documentation** | Swagger UI Express 5.0 |
| **PDF Processing** | pdf-parse 2.4 |
| **File Upload** | Multer 2.0 |
| **RAG Pipeline** | LangChain 1.0 |
| **Embeddings** | Xenova Transformers 2.17 |
| **LLM** | Xenova/LaMini-T5-738M |
| **Vector Store** | LangChain MemoryVectorStore |
