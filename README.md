# Simple RAG v2 - PDF Question Answering System

A clean, production-ready RAG (Retrieval-Augmented Generation) API that enables intelligent question answering from PDF documents using local embeddings and LLM models.

## 🚀 Features

- **PDF Processing** - Upload and automatically process PDF documents
- **Vector Storage** - Persistent storage with ChromaDB
- **Smart Retrieval** - Similarity search with reranking for better accuracy
- **Local AI Models** - Uses Xenova transformers (no API keys required)
- **Debug Mode** - Detailed diagnostics for retrieval and generation
- **REST API** - Clean API with Swagger documentation
- **Docker Support** - Easy ChromaDB setup with Docker Compose

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
- **Docker** and Docker Compose (for ChromaDB)
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

3. **Start ChromaDB:**
   ```bash
   npm run start:chroma
   ```

4. **Build and start the application:**
   ```bash
   npm run build
   npm start
   ```

The server will be available at `http://localhost:3000`

## 🐳 Docker Setup

ChromaDB runs in a Docker container with persistent storage:

```yaml
# docker-compose.yml
services:
  chromadb:
    image: chromadb/chroma:latest
    ports:
      - "8000:8000"
    volumes:
      - ./data:/chroma/chroma
```

**Commands:**
- `npm run start:chroma` - Start ChromaDB in background
- `npm run stop:chroma` - Stop ChromaDB
- `docker-compose logs -f` - View logs

## 📚 Swagger Documentation

Interactive API documentation available at:
```
http://localhost:3000/api-docs
```

## 🔧 Configuration

### Models Used
- **Embeddings:** `Xenova/all-MiniLM-L6-v2`
- **Generation:** `Xenova/LaMini-T5-738M`

### Parameters
- **Chunk Size:** 800 characters
- **Chunk Overlap:** 200 characters
- **Initial Retrieval:** 15 documents
- **Reranking:** Top 10 candidates
- **Final Context:** Top 5 documents

### Similarity Threshold
Documents with similarity score < 0.6 are prioritized. Scores above 0.6 trigger a quality warning in debug mode.

## 🎯 How It Works

1. **Document Upload**
   - PDF is parsed and extracted to text
   - Text is split into chunks (800 chars, 200 overlap)
   - Embeddings are generated using Xenova model
   - Stored in ChromaDB with persistence

2. **Question Processing**
   - Question is embedded using same model
   - Similarity search retrieves 15 candidates
   - Documents are filtered by threshold (< 0.6)
   - Top 10 candidates are reranked by keyword overlap
   - Top 5 documents form the context

3. **Answer Generation**
   - Context + question create a prompt
   - LaMini-T5 model generates answer
   - Response includes answer and optional diagnostics

## 📦 Scripts

```json
{
  "build": "tsc",
  "start": "node dist/index.js",
  "start:chroma": "docker-compose up -d",
  "stop:chroma": "docker-compose down"
}
```

## 🔍 Troubleshooting

### ChromaDB not connecting
- Ensure Docker is running
- Check if port 8000 is available
- Run `docker-compose logs` to see errors

### Models not loading
- First run downloads models (~700MB total)
- Ensure sufficient disk space
- Check internet connection for initial download

### Poor answer quality
- Use debug mode to inspect retrieval scores
- Try uploading more relevant documents
- Check if similarity scores are too high (> 0.6)

## 🚀 Performance

**First Run:**
- Model downloads: ~2-3 minutes
- Embedding model: ~80MB
- Generation model: ~600MB

**Subsequent Runs:**
- Models load from cache (~5-10 seconds)
- PDF processing: ~1-2 seconds per page
- Question answering: ~2-5 seconds