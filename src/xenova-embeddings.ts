import { pipeline, env } from '@xenova/transformers';
import { Embeddings, EmbeddingsParams } from '@langchain/core/embeddings';

env.allowLocalModels = false;
env.useFS = false;

export class XenovaEmbeddings extends Embeddings {
  pipeline: any;
  model: string;

  constructor(params: EmbeddingsParams & { model?: string }) {
    super(params);
    this.model = params.model || 'Xenova/all-MiniLM-L6-v2';
    this.pipeline = null;
  }

  async _initPipeline() {
    if (this.pipeline === null) {
      this.pipeline = await pipeline('feature-extraction', this.model);
    }
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    await this._initPipeline();
    const output = await this.pipeline(texts, { pooling: 'mean', normalize: true });
    return output.tolist();
  }

  async embedQuery(text: string): Promise<number[]> {
    const result = await this.embedDocuments([text]);
    if (result.length === 0) {
        throw new Error("No embedding found for query");
    }
    return result[0]!;
  }
}
