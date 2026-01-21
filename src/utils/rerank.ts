export interface DocumentWithScore {
  content: string;
  score: number;
}

export interface RerankedDocument extends DocumentWithScore {
  rerankScore: number;
}

export function rerank(
  question: string, 
  docs: DocumentWithScore[]
): RerankedDocument[] {
  const questionTokens = question
    .toLowerCase()
    .split(/\W+/)
    .filter(t => t.length > 3);
  
  return docs
    .map(doc => {
      const docTokens = doc.content.toLowerCase().split(/\W+/);
      const overlap = questionTokens.filter(qt => docTokens.includes(qt)).length;
      const rerankScore = overlap / questionTokens.length;
      
      return { ...doc, rerankScore };
    })
    .sort((a, b) => b.rerankScore - a.rerankScore);
}
