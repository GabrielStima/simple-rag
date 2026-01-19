import express, { Request, Response } from 'express';
import multer from 'multer';
import { PDFParse } from 'pdf-parse';
import fs from 'fs';
import path from 'path';
import swaggerUi from 'swagger-ui-express';

import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { MemoryVectorStore } from '@langchain/classic/vectorstores/memory';
import { XenovaEmbeddings } from './xenova-embeddings.js';
import { pipeline } from '@xenova/transformers';
import { swaggerDocument } from './swagger.js';

const app = express();
const port = 3000;

let activeVectorStore: MemoryVectorStore | null = null;
let generator: any = null;

function rerank(question: string, docs: Array<{content: string, score: number}>): Array<{content: string, score: number, rerankScore: number}> {
    const questionTokens = question.toLowerCase().split(/\W+/).filter(t => t.length > 3);
    
    return docs.map(doc => {
        const docTokens = doc.content.toLowerCase().split(/\W+/);
        const overlap = questionTokens.filter(qt => docTokens.includes(qt)).length;
        const rerankScore = overlap / questionTokens.length; 
        
        return { ...doc, rerankScore };
    }).sort((a, b) => b.rerankScore - a.rerankScore); 
}

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    const uploadPath = path.join(__dirname, '..', 'data');

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    callback(null, uploadPath);
  },
  filename: (req, file, callback) => {
    callback(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.post('/api/upload', upload.single('pdf'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const pdfPath = req.file.path;

  try {
    const pdfData = new PDFParse({url: pdfPath});
    const data = (await pdfData.getText()).text;

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 800,
      chunkOverlap: 200,
    });

    const docs = await textSplitter.createDocuments([data]);

    const embeddings = new XenovaEmbeddings({
      model: 'Xenova/all-MiniLM-L6-v2',
    });

    activeVectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);

    res.status(200).json({ message: 'File processed successfully' });

  } catch (error) {
    console.error('Error processing PDF:', error);
    res.status(500).send('Error processing file.');
  } finally {
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
      }
  }
});

app.post('/api/ask', async (req: Request, res: Response) => {
    const { question, debug = false } = req.body;

    if (!question) {
        return res.status(400).json({ error: 'Question is required.' });
    }

    if (!activeVectorStore) {
        return res.status(400).json({ error: 'No vector store is active. Please upload a PDF first.' });
    }

    try {
        
        const relevantDocsWithScore = await activeVectorStore.similaritySearchWithScore(question, 15);
        
        const filteredDocs = relevantDocsWithScore
            .filter(([doc, score]) => score < 0.6)
            .map(([doc, score]) => ({ content: doc.pageContent, score }));
        
        const candidates = filteredDocs.length > 0 
            ? filteredDocs.slice(0, 10)  
            : relevantDocsWithScore.slice(0, 10).map(([doc, score]) => ({ content: doc.pageContent, score }));
        
        const rerankedDocs = rerank(question, candidates);
        
        const docsToUse = rerankedDocs.slice(0, 5);
        
        const context = docsToUse.map(d => d.content).join('\n\n');
        
        if (!generator) {
            console.log('Loading text generation model... This may take a moment.');
            generator = await pipeline('text2text-generation', 'Xenova/LaMini-T5-738M');
            console.log('Text generation model loaded.');
        }
        
        const prompt = `Answer the question based on the context.\n\nContext: ${context}\n\nQuestion: ${question}\n\nAnswer:`;
        
        console.log(`Prompt length: ${prompt.length} chars`);

        const startTime = Date.now();
        const result = await generator(prompt, {
            max_length: 512,
            min_length: 30,
            no_repeat_ngram_size: 2,
            num_beams: 3,
            early_stopping: true,
            temperature: 0.3,  
        });
        const generationTime = Date.now() - startTime;

        const answer = result[0].generated_text;
        
        const response: any = { answer };
        
        if (debug) {
          const teste = docsToUse.length >= 1 && docsToUse[0];
            response.diagnostics = {
                retrieval: {
                    totalChunksSearched: 15,
                    chunksUsed: docsToUse.length,
                    averageSimilarityScore: parseFloat((docsToUse.reduce((sum, d) => sum + d.score, 0) / docsToUse.length).toFixed(4)),
                    topScores: relevantDocsWithScore.slice(0, 10).map(([_, score]) => parseFloat(score.toFixed(4))),
                    contextLength: context.length,
                    qualityWarning: (teste && teste.score > 0.6) ? 'Poor retrieval quality - document may not contain relevant information' : null,
                },
                generation: {
                    promptLength: prompt.length,
                    answerLength: answer.length,
                    generationTimeMs: generationTime,
                    modelUsed: 'Xenova/LaMini-T5-738M'
                },
                retrievedChunks: docsToUse.map((d, i) => ({
                    index: i + 1,
                    originalScore: parseFloat(d.score.toFixed(4)),
                    rerankScore: parseFloat(d.rerankScore.toFixed(3)),
                    preview: d.content.substring(0, 150) + '...'
                }))
            };
        }
        res.status(200).json(response);
    } catch (error) {
        console.error('Error in /api/ask:', error);
        res.status(500).json({ error: 'Failed to generate answer.' });
    }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
  console.log(`Swagger documentation available at http://localhost:${port}/api-docs`);
});