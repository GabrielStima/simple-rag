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

3. **Configure environment (optional):**
   ```bash
   cp .env.example .env
   # Edit .env to change model (default: llama3.2:3b)
   ```

4. **Start all services (ChromaDB + Ollama):**
   ```bash
   npm run services:start
   ```

5. **Pull the Ollama model (first time only - ~2GB download):**
   ```bash
   npm run ollama:pull
   ```

6. **Build and start the application:**
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
- **Generation:** `Ollama - llama3.2:3b` (configurable)

### Available Ollama Models
Configure via `OLLAMA_MODEL` in `.env`:
- `llama3.2:3b` - Default, best balance (2GB)
- `llama3.2:1b` - Faster, smaller (1.3GB)
- `mistral:7b` - Better quality (4.1GB)
- `phi3:mini` - Microsoft, efficient (2.3GB)
- `gemma2:2b` - Google, fast (1.6GB)

To switch models:
```bash
# Edit .env file
OLLAMA_MODEL=mistral:7b

# Pull new model
docker exec ollama ollama pull mistral:7b

# Restart app
npm run build && npm start
```

### Retrieval Parameters
- **Chunk Size:** 800 characters
- **Chunk Overlap:** 200 characters
- **Initial Retrieval:** 15 documents
- **Reranking:** Top 10 candidates
- **Final Context:** Top 5 documents
- **Similarity Threshold:** < 0.6 (lower is better)
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
Ollama generates answer using Llama 3.2
   - Response includes answer and optional diagnostics

## 📦 Scripts

```json
{
  "build": "tsc",
  "start": "node dist/index.js",
  "dev": "npm run services:start && npm run build && npm start",
  "services:start": "docker-compose up -d",
  "services:stop": "docker-compose down",
  "services:logs": "docker-compose logs -f",
  "ollama:pull": "docker exec ollama ollama pull llama3.2:3b",
  "ollama:list": "docker exec ollama ollama list"
}
```

## 🔍 Troubleshooting

### Services not starting
- Ensure Docker Desktop is running
- Check if ports 8000 and 11434 are available
- Run `npm run services:logs` to see errors

### Ollama model not found
- Pull the model: `npm run ollama:pull`
- Check available models: `npm run ollama:list`
- Ensure sufficient disk space (~2GB per model)

### ChromaDB connection failed
- Verify ChromaDB is running: `docker ps`
- Check logs: `docker logs chromadb`
- Restart services: `npm run services:stop && npm run services:start`
  Ollama model download: ~2GB (one-time)
- Embedding model cache: ~80MB (one-time)
- Initial setup: ~3-5 minutes

**Subsequent Runs:**
- Services startup: ~5 seconds
- PDF processing: ~1-2 seconds per page
- Question answering: ~1-3 seconds (depends on model and context length)

**Model Comparison:**
| Model | Size | Speed | Quality |
|-------|------|-------|---------|
| llama3.2:1b | 1.3GB | ⚡⚡⚡ | ⭐⭐⭐ |
| llama3.2:3b | 2GB | ⚡⚡ | ⭐⭐⭐⭐ |
| mistral:7b | 4.1GB | ⚡ | ⭐⭐⭐⭐⭐ |

## 🛣️ Future Improvements

- [ ] Support multiple PDF documents in one collection
- [ ] Add conversation history and follow-up questions
- [ ] Implement streaming responses for real-time answers
- [ ] Add authentication and user management
- [ ] Support more file formats (DOCX, TXT, Markdown)
- [ ] Implement cross-encoder reranking
- [ ] Add caching layer for repeated questions
- [ ] GPU acceleration for Ollama
- [ ] Web UI for easier interaction

## 📄 License

ISC

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Tech Stack:** Node.js • TypeScript • Express • ChromaDB • Ollama • LangChain • Docker

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