# Object Generation with Vercel AI SDK

## Overview

The Vercel AI SDK provides powerful capabilities for generating structured data objects from natural language input. This guide covers implementing object generation features using the SDK's type-safe interfaces and validation.

## Basic Implementation

### 1. Type Definitions

```typescript
// lib/types/generated-objects.ts
export interface GeneratedProduct {
  name: string
  description: string
  price: number
  category: string
  features: string[]
  specifications: Record<string, string>
}

export interface GeneratedBlogPost {
  title: string
  content: string
  excerpt: string
  tags: string[]
  seoMetadata: {
    description: string
    keywords: string[]
  }
}
```

### 2. Generation Component

```typescript
// components/generation/ObjectGenerator.tsx
import { useCompletion } from 'ai/react'
import { useState } from 'react'

interface ObjectGeneratorProps<T> {
  prompt: string
  onGenerate: (object: T) => void
}

export function ObjectGenerator<T>({
  prompt,
  onGenerate
}: ObjectGeneratorProps<T>) {
  const [error, setError] = useState<Error | null>(null)

  const {
    completion,
    input,
    handleInputChange,
    handleSubmit,
    isLoading
  } = useCompletion({
    api: '/api/generate',
    body: {
      prompt,
      format: 'json'
    },
    onFinish: (result) => {
      try {
        const object = JSON.parse(result)
        onGenerate(object as T)
      } catch (error) {
        setError(new Error('Invalid JSON response'))
      }
    }
  })

  return (
    <div className="generator">
      <form onSubmit={handleSubmit}>
        <textarea
          value={input}
          onChange={handleInputChange}
          placeholder="Describe what you want to generate..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          Generate
        </button>
      </form>

      {error && (
        <div className="error">
          {error.message}
        </div>
      )}
    </div>
  )
}
```

### 3. API Implementation

```typescript
// app/api/generate/route.ts
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'
import { z } from 'zod'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const ProductSchema = z.object({
  name: z.string(),
  description: z.string(),
  price: z.number().positive(),
  category: z.string(),
  features: z.array(z.string()),
  specifications: z.record(z.string())
})

export async function POST(req: Request) {
  const { prompt, format } = await req.json()

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages: [
      {
        role: 'system',
        content: `Generate a valid JSON object based on the user's description. The object should match this schema: ${JSON.stringify(ProductSchema.shape)}`
      },
      {
        role: 'user',
        content: prompt
      }
    ]
  })

  const stream = OpenAIStream(response)
  return new StreamingTextResponse(stream)
}
```

## Advanced Features

### 1. Schema Validation

```typescript
// lib/validation/schema-validation.ts
import { z } from 'zod'

export const BlogPostSchema = z.object({
  title: z.string().min(10).max(100),
  content: z.string().min(100),
  excerpt: z.string().max(200),
  tags: z.array(z.string()).min(1).max(5),
  seoMetadata: z.object({
    description: z.string().max(160),
    keywords: z.array(z.string()).max(10)
  })
})

export function validateGeneratedObject<T>(
  object: unknown,
  schema: z.ZodType<T>
): T {
  const result = schema.safeParse(object)
  
  if (!result.success) {
    throw new Error(
      `Validation failed: ${result.error.message}`
    )
  }

  return result.data
}
```

### 2. Template System

```typescript
// lib/templates/generation-templates.ts
interface GenerationTemplate {
  systemPrompt: string
  examples: Array<{
    input: string
    output: unknown
  }>
  schema: z.ZodType<any>
}

export const templates: Record<string, GenerationTemplate> = {
  product: {
    systemPrompt: `Generate product information in JSON format. Include:
- Descriptive name
- Detailed description
- Realistic price
- Appropriate category
- Key features
- Technical specifications`,
    examples: [
      {
        input: 'Create a high-end wireless gaming mouse',
        output: {
          name: 'ProGamer X9000 Wireless Mouse',
          description: 'Professional-grade wireless gaming mouse with ultra-low latency...',
          price: 149.99,
          category: 'Gaming Peripherals',
          features: [
            '25,000 DPI optical sensor',
            '1ms response time',
            '100 hour battery life'
          ],
          specifications: {
            weight: '89g',
            connectivity: 'USB-C, 2.4GHz wireless',
            buttons: '8 programmable'
          }
        }
      }
    ],
    schema: ProductSchema
  }
}
```

### 3. Streaming UI

```typescript
// components/generation/StreamingGenerator.tsx
import { experimental_useGenerationStream } from 'ai/react'

export function StreamingGenerator() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    generatedObjects
  } = experimental_useGenerationStream({
    api: '/api/generate-stream',
    onGenerationComplete: (object) => {
      console.log('Generated:', object)
    }
  })

  return (
    <div className="streaming-generator">
      <div className="generated-objects">
        {generatedObjects.map((obj, index) => (
          <pre key={index}>
            {JSON.stringify(obj, null, 2)}
          </pre>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="What would you like to generate?"
        />
      </form>
    </div>
  )
}
```

## Integration Examples

### 1. Product Generator

```typescript
// components/products/ProductGenerator.tsx
import { ObjectGenerator } from '../generation/ObjectGenerator'
import { GeneratedProduct } from '@/lib/types'
import { ProductSchema } from '@/lib/validation'

export function ProductGenerator() {
  const handleGenerate = (product: GeneratedProduct) => {
    // Validate the generated product
    const validatedProduct = validateGeneratedObject(
      product,
      ProductSchema
    )

    // Add to product catalog
    addProductToCatalog(validatedProduct)
  }

  return (
    <ObjectGenerator<GeneratedProduct>
      prompt="Generate a product description"
      onGenerate={handleGenerate}
    />
  )
}
```

### 2. Blog Post Generator

```typescript
// components/blog/BlogPostGenerator.tsx
import { ObjectGenerator } from '../generation/ObjectGenerator'
import { GeneratedBlogPost } from '@/lib/types'
import { BlogPostSchema } from '@/lib/validation'

export function BlogPostGenerator() {
  const handleGenerate = async (post: GeneratedBlogPost) => {
    // Validate the generated blog post
    const validatedPost = validateGeneratedObject(
      post,
      BlogPostSchema
    )

    // Create new blog post
    await createBlogPost(validatedPost)
  }

  return (
    <div className="blog-generator">
      <h2>Generate Blog Post</h2>
      <ObjectGenerator<GeneratedBlogPost>
        prompt="Write a blog post about..."
        onGenerate={handleGenerate}
      />
    </div>
  )
}
```

## Styling

### 1. Generator Styles

```css
/* styles/generator.css */
.generator {
  max-width: 800px;
  margin: 2rem auto;
}

.generator textarea {
  width: 100%;
  min-height: 150px;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border-color);
}

.generator button {
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  background: var(--primary-color);
  color: white;
  font-weight: 500;
}

.generator .error {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 0.5rem;
  background: var(--error-bg);
  color: var(--error-text);
}
```

### 2. Preview Styles

```css
/* styles/preview.css */
.preview {
  margin-top: 2rem;
  padding: 1.5rem;
  border-radius: 0.5rem;
  background: var(--preview-bg);
}

.preview pre {
  font-family: monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-x: auto;
}

.preview .actions {
  margin-top: 1rem;
  display: flex;
  gap: 1rem;
}

.preview .actions button {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  background: var(--secondary-bg);
  color: var(--secondary-text);
}
``` 