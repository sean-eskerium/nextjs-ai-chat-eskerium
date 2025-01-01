# Providers and Models

## Overview

Learn about the providers and models that you can use with the AI SDK.

## Supported Providers

The AI SDK supports multiple AI providers:

1. OpenAI
2. Anthropic
3. Hugging Face
4. Google AI
5. AWS Bedrock
6. Azure OpenAI

## Provider Configuration

### 1. OpenAI

```typescript
// app/api/chat/route.ts
import OpenAI from 'openai'
import { OpenAIStream, StreamingTextResponse } from 'ai'

export async function POST(req: Request) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages: [{ role: 'user', content: 'Hello!' }]
  })

  const stream = OpenAIStream(response)
  return new StreamingTextResponse(stream)
}
```

### 2. Anthropic

```typescript
// app/api/chat/route.ts
import Anthropic from '@anthropic-ai/sdk'
import { AnthropicStream, StreamingTextResponse } from 'ai'

export async function POST(req: Request) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  })

  const response = await anthropic.messages.create({
    model: 'claude-2',
    stream: true,
    messages: [{ role: 'user', content: 'Hello!' }]
  })

  const stream = AnthropicStream(response)
  return new StreamingTextResponse(stream)
}
```

### 3. Hugging Face

```typescript
// app/api/chat/route.ts
import { HfInference } from '@huggingface/inference'
import { HuggingFaceStream, StreamingTextResponse } from 'ai'

export async function POST(req: Request) {
  const hf = new HfInference(process.env.HUGGINGFACE_API_KEY)

  const response = await hf.textGeneration({
    model: 'mistralai/Mistral-7B-v0.1',
    inputs: 'Hello!',
    parameters: {
      max_new_tokens: 100,
      temperature: 0.7
    }
  })

  const stream = HuggingFaceStream(response)
  return new StreamingTextResponse(stream)
}
```

### 4. Google AI

```typescript
// app/api/chat/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai'
import { GoogleStream, StreamingTextResponse } from 'ai'

export async function POST(req: Request) {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

  const response = await model.generateContentStream('Hello!')
  const stream = GoogleStream(response)
  return new StreamingTextResponse(stream)
}
```

### 5. AWS Bedrock

```typescript
// app/api/chat/route.ts
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { BedrockStream, StreamingTextResponse } from 'ai'

export async function POST(req: Request) {
  const client = new BedrockRuntimeClient({
    region: 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    }
  })

  const response = await client.send(
    new InvokeModelCommand({
      modelId: 'anthropic.claude-v2',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        prompt: 'Hello!',
        max_tokens_to_sample: 300
      })
    })
  )

  const stream = BedrockStream(response)
  return new StreamingTextResponse(stream)
}
```

### 6. Azure OpenAI

```typescript
// app/api/chat/route.ts
import { OpenAIClient } from '@azure/openai'
import { AzureKeyCredential } from '@azure/core-auth'
import { AzureStream, StreamingTextResponse } from 'ai'

export async function POST(req: Request) {
  const client = new OpenAIClient(
    'https://your-resource.openai.azure.com/',
    new AzureKeyCredential(process.env.AZURE_OPENAI_API_KEY!)
  )

  const response = await client.getChatCompletions(
    'your-deployment',
    [{ role: 'user', content: 'Hello!' }],
    { stream: true }
  )

  const stream = AzureStream(response)
  return new StreamingTextResponse(stream)
}
```

## Model Selection

### 1. OpenAI Models

```typescript
// lib/models/openai.ts
export const openaiModels = {
  // Chat models
  gpt4: {
    id: 'gpt-4',
    name: 'GPT-4',
    description: 'Most capable model, best for complex tasks',
    maxTokens: 8192,
    inputPricing: 0.03,
    outputPricing: 0.06
  },
  
  gpt35Turbo: {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Fast and cost-effective for most tasks',
    maxTokens: 4096,
    inputPricing: 0.0015,
    outputPricing: 0.002
  }
}
```

### 2. Anthropic Models

```typescript
// lib/models/anthropic.ts
export const anthropicModels = {
  claude2: {
    id: 'claude-2',
    name: 'Claude 2',
    description: 'Most capable Anthropic model',
    maxTokens: 100000
  },
  
  claude1: {
    id: 'claude-1',
    name: 'Claude 1',
    description: 'Balanced performance and efficiency',
    maxTokens: 9000
  }
}
```

### 3. Google AI Models

```typescript
// lib/models/google.ts
export const googleModels = {
  geminiPro: {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    description: 'Advanced model for text generation',
    maxTokens: 30720
  },
  
  geminiProVision: {
    id: 'gemini-pro-vision',
    name: 'Gemini Pro Vision',
    description: 'Multimodal model for text and image tasks',
    maxTokens: 30720
  }
}
```

## Model Management

### 1. Model Selection Helper

```typescript
// lib/models/selection.ts
interface ModelConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'aws' | 'azure'
  model: string
  temperature?: number
  maxTokens?: number
}

export class ModelSelector {
  private static defaultConfigs: Record<string, ModelConfig> = {
    chat: {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      temperature: 0.7
    },
    completion: {
      provider: 'openai',
      model: 'gpt-4',
      temperature: 0.5
    },
    longForm: {
      provider: 'anthropic',
      model: 'claude-2',
      temperature: 0.7
    },
    vision: {
      provider: 'google',
      model: 'gemini-pro-vision',
      temperature: 0.4
    }
  }

  static getConfig(
    useCase: string,
    overrides?: Partial<ModelConfig>
  ): ModelConfig {
    const config = this.defaultConfigs[useCase]
    if (!config) {
      throw new Error(`No configuration for use case: ${useCase}`)
    }

    return {
      ...config,
      ...overrides
    }
  }
}
```

### 2. Token Management

```typescript
// lib/models/tokens.ts
interface TokenConfig {
  maxTokens: number
  reservedTokens: number
}

export class TokenManager {
  private static tokenEstimates = {
    'gpt-4': (text: string) => Math.ceil(text.length / 3),
    'gpt-3.5-turbo': (text: string) => Math.ceil(text.length / 3.5),
    'claude-2': (text: string) => Math.ceil(text.length / 4),
    'gemini-pro': (text: string) => Math.ceil(text.length / 3.2)
  }

  static estimateTokens(
    text: string,
    model: string
  ): number {
    const estimator = this.tokenEstimates[model]
    if (!estimator) {
      // Fallback estimator
      return Math.ceil(text.length / 4)
    }
    return estimator(text)
  }

  static async truncateToFit(
    text: string,
    model: string,
    config: TokenConfig
  ): Promise<string> {
    const estimatedTokens = this.estimateTokens(text, model)
    const availableTokens = 
      config.maxTokens - config.reservedTokens

    if (estimatedTokens <= availableTokens) {
      return text
    }

    const ratio = availableTokens / estimatedTokens
    return text.slice(0, Math.floor(text.length * ratio))
  }
}
```

## Provider-Specific Features

### 1. OpenAI Functions

```typescript
// lib/providers/openai-functions.ts
export const functions = [
  {
    name: 'search_knowledge_base',
    description: 'Search the knowledge base',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query'
        }
      },
      required: ['query']
    }
  }
]

export async function createFunctionCall(
  messages: any[],
  functions: any[]
) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages,
    functions,
    function_call: 'auto'
  })

  return response
}
```

### 2. Anthropic System Prompts

```typescript
// lib/providers/anthropic-prompts.ts
export const systemPrompts = {
  assistant: `\n\nHuman: You are a helpful AI assistant. Be concise and clear in your responses.
</code_block_to_apply_changes_from> 