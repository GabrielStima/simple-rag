export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'RAG System API',
    version: '1.0.0',
    description: 'A Retrieval-Augmented Generation system for PDF document question-answering using local models',
    contact: {
      name: 'API Support'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server'
    }
  ],
  tags: [
    {
      name: 'Document',
      description: 'Document upload and processing'
    },
    {
      name: 'Question',
      description: 'Question answering operations'
    }
  ],
  paths: {
    '/api/upload': {
      post: {
        tags: ['Document'],
        summary: 'Upload and process a PDF document',
        description: 'Uploads a PDF file, extracts text, chunks it, generates embeddings, and stores in vector database',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  pdf: {
                    type: 'string',
                    format: 'binary',
                    description: 'PDF file to process'
                  }
                },
                required: ['pdf']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'File processed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'File processed successfully'
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'No file uploaded',
            content: {
              'text/plain': {
                schema: {
                  type: 'string',
                  example: 'No file uploaded.'
                }
              }
            }
          },
          '500': {
            description: 'Error processing file',
            content: {
              'text/plain': {
                schema: {
                  type: 'string',
                  example: 'Error processing file.'
                }
              }
            }
          }
        }
      }
    },
    '/api/ask': {
      post: {
        tags: ['Question'],
        summary: 'Ask a question about the uploaded document',
        description: 'Performs semantic search on the document, retrieves relevant chunks, reranks them, and generates an answer using a local LLM',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  question: {
                    type: 'string',
                    description: 'The question to ask about the document',
                    example: 'Who is Fulano?'
                  },
                  debug: {
                    type: 'boolean',
                    description: 'Enable detailed diagnostics in the response',
                    default: false,
                    example: false
                  }
                },
                required: ['question']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Successfully generated answer',
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    {
                      type: 'object',
                      properties: {
                        answer: {
                          type: 'string',
                          description: 'The generated answer',
                          example: 'Fulano was born in Rio de Janeiro and later studied at MIT...'
                        }
                      }
                    },
                    {
                      type: 'object',
                      properties: {
                        answer: {
                          type: 'string',
                          description: 'The generated answer',
                          example: 'Fulano was born in Rio de Janeiro...'
                        },
                        diagnostics: {
                          type: 'object',
                          description: 'Detailed diagnostics (only when debug=true)',
                          properties: {
                            retrieval: {
                              type: 'object',
                              properties: {
                                totalChunksSearched: {
                                  type: 'number',
                                  example: 15
                                },
                                chunksUsed: {
                                  type: 'number',
                                  example: 5
                                },
                                averageSimilarityScore: {
                                  type: 'number',
                                  example: 0.3421
                                },
                                topScores: {
                                  type: 'array',
                                  items: {
                                    type: 'number'
                                  },
                                  example: [0.2891, 0.3245, 0.3567, 0.3821, 0.4012]
                                },
                                contextLength: {
                                  type: 'number',
                                  example: 3842
                                },
                                qualityWarning: {
                                  type: 'string',
                                  nullable: true,
                                  example: null
                                }
                              }
                            },
                            generation: {
                              type: 'object',
                              properties: {
                                promptLength: {
                                  type: 'number',
                                  example: 4210
                                },
                                answerLength: {
                                  type: 'number',
                                  example: 156
                                },
                                generationTimeMs: {
                                  type: 'number',
                                  example: 8234
                                },
                                modelUsed: {
                                  type: 'string',
                                  example: 'Xenova/LaMini-T5-738M'
                                }
                              }
                            },
                            retrievedChunks: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  index: {
                                    type: 'number',
                                    example: 1
                                  },
                                  originalScore: {
                                    type: 'number',
                                    example: 0.3821
                                  },
                                  rerankScore: {
                                    type: 'number',
                                    example: 0.857
                                  },
                                  preview: {
                                    type: 'string',
                                    example: 'Bartolomeo was born in Rio de Janeiro...'
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: {
                      type: 'string',
                      example: 'Question is required.'
                    }
                  }
                },
                examples: {
                  noQuestion: {
                    value: {
                      error: 'Question is required.'
                    }
                  },
                  noVectorStore: {
                    value: {
                      error: 'No vector store is active. Please upload a PDF first.'
                    }
                  }
                }
              }
            }
          },
          '500': {
            description: 'Failed to generate answer',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: {
                      type: 'string',
                      example: 'Failed to generate answer.'
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message'
          }
        }
      }
    }
  }
};
