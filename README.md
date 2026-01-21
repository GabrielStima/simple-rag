# Simple RAG v2 - PDF Question Answering System

A clean, production-ready RAG (Retrieval-Augmented Generation) API that enables intelligent question answering from PDF documents using local embeddings and Ollama LLMs.

## 🚀 Features

- **PDF Processing** - Upload and automatically process PDF documents
- **Vector Storage** - Persistent storage with ChromaDB
- **Smart Retrieval** - Similarity search with reranking for better accuracy
- **Ollama Integration** - Local LLM inference with Llama 3.2 (no API keys required)
- **Debug Mode** - Detailed diagnostics for retrieval and generation
- **REST API** - Clean API with Swagger documentation
- **Docker Compose** - One-command setup for all services

## 🏗️ Architecture

```
src/
├── config/           # Configuration files
│   └── multer.config.ts
├── services/         # Business logic
│   ├── vectorStore.service.ts
│   └── generator.service.ts
├── routes/           # API endpoints
│   ├── document.routes.ts
│   └── query.routes.ts
├── utils/            # Utility functions
│   └── rerank.ts
├── index.ts          # Application entry point
├── swagger.ts        # API documentation
└── xenova-embeddings.ts
```

## 📋 Prerequisites

- **Node.js** v18 or higher
- **Docker** and Docker Compose
- **npm** or **yarn**

## 🛠️ Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd simple-rag-v2
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start all services (ChromaDB + Ollama):**
   ```bash
   npm run services:start
   ```

4. **Pull the Ollama model (first time only - ~2GB download):**
   ```bash
   npm run ollama:pull
   ```

5. **Build and start the application:**
   ```bash
   npm run build
   npm start
   ```

The server will be available at `http://localhost:3000`

## 🐳 Docker Setup

Both ChromaDB and Ollama run in Docker containers:

```yaml
# docker-compose.yml
services:
  chromadb:
    image: chromadb/chroma:latest
    ports:
      - "8000:8000"
    volumes:
      - ./data:/chroma/chroma
  
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama (384 dimensions, fast)

### Retrieval Parameters
- **Chunk Size:** 800 characters
- **Chunk Overlap:** 200 characters
- **Initial Retrieval:** 15 documents
- **Reranking:** Top 10 candidates
- **Final Context:** Top 5 documents
- **Similarity Threshold:** < 0.6 (lower is better)
```

Interactive API documentation available at:
```
http://localhost:3000/api-docs
```

## 🚀 Performance

**First Run:**
- Model downloads: ~2-3 minutes
- Embedding model: ~80MB
- Generation model: ~600MB

**Subsequent Runs:**
- Models load from cache (~5-10 seconds)
- PDF processing: ~1-2 seconds per page
- Question answering: ~2-5 seconds