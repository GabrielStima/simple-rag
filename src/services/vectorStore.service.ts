import { Chroma } from '@langchain/community/vectorstores/chroma';
import { XenovaEmbeddings } from '../xenova-embeddings.js';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

const COLLECTION_NAME = 'pdf-documents';
const CHROMA_URL = 'http://localhost:8000';
const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';

export class VectorStoreService {
  private vectorStore: Chroma | null = null;
  private embeddings: XenovaEmbeddings;

  constructor() {
    this.embeddings = new XenovaEmbeddings({
      model: EMBEDDING_MODEL,
    });
  }

  async initialize(): Promise<void> {
    try {
      this.vectorStore = await Chroma.fromExistingCollection(this.embeddings, {
        collectionName: COLLECTION_NAME,
        url: CHROMA_URL,
      });
      console.log('Connected to existing ChromaDB collection');
    } catch (error) {
      console.log('No existing collection found. Upload a PDF to create one.');
    }
  }

  async createFromText(text: string): Promise<void> {
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 800,
      chunkOverlap: 200,
    });

    const docs = await textSplitter.createDocuments([text]);

    this.vectorStore = await Chroma.fromDocuments(docs, this.embeddings, {
      collectionName: COLLECTION_NAME,
      url: CHROMA_URL,
    });
  }

  async similaritySearchWithScore(query: string, k: number) {
    if (!this.vectorStore) {
      throw new Error('Vector store is not initialized');
    }
    return this.vectorStore.similaritySearchWithScore(query, k);
  }

  isActive(): boolean {
    return this.vectorStore !== null;
  }
}

export const vectorStoreService = new VectorStoreService();
