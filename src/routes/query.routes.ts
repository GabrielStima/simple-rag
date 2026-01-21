import { Router, Request, Response } from 'express';
import { vectorStoreService } from '../services/vectorStore.service.js';
import { generatorService } from '../services/generator.service.js';
import { rerank } from '../utils/rerank.js';

const router = Router();

router.post('/ask', async (req: Request, res: Response) => {
  const { question, debug = false } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'Question is required.' });
  }

  if (!vectorStoreService.isActive()) {
    return res.status(400).json({ 
      error: 'No vector store is active. Please upload a PDF first.' 
    });
  }

  try {
    const relevantDocsWithScore = await vectorStoreService.similaritySearchWithScore(question, 15);
    
    const filteredDocs = relevantDocsWithScore
      .filter(([doc, score]) => score < 0.6)
      .map(([doc, score]) => ({ content: doc.pageContent, score }));
    
    const candidates = filteredDocs.length > 0 
      ? filteredDocs.slice(0, 10)  
      : relevantDocsWithScore.slice(0, 10).map(([doc, score]) => ({ 
          content: doc.pageContent, 
          score 
        }));
    
    const rerankedDocs = rerank(question, candidates);
    const docsToUse = rerankedDocs.slice(0, 5);
    
    const context = docsToUse.map(d => d.content).join('\n\n');
    
    const { answer, generationTime, promptLength } = await generatorService.generate(context, question);
    
    const response: any = { answer };
    
    if (debug) {
      const topDoc = docsToUse.length >= 1 ? docsToUse[0] : null;
      
      response.diagnostics = {
        retrieval: {
          totalChunksSearched: 15,
          chunksUsed: docsToUse.length,
          averageSimilarityScore: parseFloat(
            (docsToUse.reduce((sum, d) => sum + d.score, 0) / docsToUse.length).toFixed(4)
          ),
          topScores: relevantDocsWithScore
            .slice(0, 10)
            .map(([_, score]) => parseFloat(score.toFixed(4))),
          contextLength: context.length,
          qualityWarning: (topDoc && topDoc.score > 0.6) 
            ? 'Poor retrieval quality - document may not contain relevant information' 
            : null,
        },
        generation: {
          promptLength,
          answerLength: answer.length,
          generationTimeMs: generationTime,
          modelUsed: generatorService.getModelName()
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

export default router;
