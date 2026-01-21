export class GeneratorService {
  private modelLoaded: boolean = false;
  private ollamaUrl: string = 'http://localhost:11434';
  private ollamaModel: string = 'llama3.2:3b';

  async initialize(): Promise<void> {
    if (this.modelLoaded) return;

    try {
      console.log(`Checking if model ${this.ollamaModel} is available...`);
      
      const response = await fetch(`${this.ollamaUrl}/api/tags`);
      const data = await response.json() as { models?: Array<{ name: string }> };
      
      const modelExists = data.models?.some((m: any) => m.name === this.ollamaModel);
      
      if (!modelExists) {
        console.log(`Pulling model ${this.ollamaModel}... This may take a few minutes.`);
        await this.pullModel();
      }
      
      this.modelLoaded = true;
      console.log(`Model ${this.ollamaModel} is ready.`);
    } catch (error) {
      console.error('Error initializing Ollama:', error);
      throw new Error('Failed to connect to Ollama. Ensure it is running on ' + this.ollamaUrl);
    }
  }

  private async pullModel(): Promise<void> {
    const response = await fetch(`${this.ollamaUrl}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: this.ollamaModel }),
    });

    if (!response.ok) {
      throw new Error(`Failed to pull model: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (reader) {
      while (true) {
        const { done } = await reader.read();
        if (done) break;
      }
    }
  }

  async generate(
    context: string, 
    question: string
  ): Promise<{ answer: string; generationTime: number; promptLength: number }> {
    await this.initialize();

    const prompt = `Answer the question based on the context below. Be concise and accurate.

Context: ${context}

Question: ${question}

Answer:`;
    
    console.log(`Prompt length: ${prompt.length} chars`);

    const startTime = Date.now();
    
    const response = await fetch(`${this.ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.ollamaModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.9,
          top_k: 40,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.statusText}`);
    }

    const data = await response.json() as { response: string };
    const generationTime = Date.now() - startTime;

    return {
      answer: data.response.trim(),
      generationTime,
      promptLength: prompt.length,
    };
  }

  isLoaded(): boolean {
    return this.modelLoaded;
  }

  getModelName(): string {
    return this.ollamaModel;
  }
}

export const generatorService = new GeneratorService();
