import { pipeline } from '@xenova/transformers';

const TEXT_GENERATION_MODEL = 'Xenova/LaMini-T5-738M';

export class GeneratorService {
  private generator: any = null;

  async initialize(): Promise<void> {
    if (!this.generator) {
      console.log('Loading text generation model... This may take a moment.');
      this.generator = await pipeline('text2text-generation', TEXT_GENERATION_MODEL);
      console.log('Text generation model loaded.');
    }
  }

  async generate(context: string, question: string): Promise<{ answer: string; generationTime: number; promptLength: number }> {
    await this.initialize();

    const prompt = `Answer the question based on the context.\n\nContext: ${context}\n\nQuestion: ${question}\n\nAnswer:`;
    
    console.log(`Prompt length: ${prompt.length} chars`);

    const startTime = Date.now();
    const result = await this.generator(prompt, {
      max_length: 512,
      min_length: 30,
      no_repeat_ngram_size: 2,
      num_beams: 3,
      early_stopping: true,
      temperature: 0.3,
    });
    const generationTime = Date.now() - startTime;

    return {
      answer: result[0].generated_text,
      generationTime,
      promptLength: prompt.length,
    };
  }

  isLoaded(): boolean {
    return this.generator !== null;
  }

  getModelName(): string {
    return TEXT_GENERATION_MODEL;
  }
}

export const generatorService = new GeneratorService();
