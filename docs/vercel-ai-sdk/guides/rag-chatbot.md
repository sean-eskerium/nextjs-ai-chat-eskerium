# RAG Chatbot

## Overview

Learn how to build a Retrieval Augmented Generation (RAG) chatbot using the Vercel AI SDK. This guide will show you how to create a chatbot that can access and reference external documents to provide more accurate and contextual responses.

## Implementation Steps

### 1. Setup Vector Database

```typescript
// lib/vectordb.ts
import { PineconeClient } from '@pinecone-database/pinecone'
import { Document } from 'langchain/document'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'

export async function initVectorStore() {
  const client = new PineconeClient()
  await client.init({
    apiKey: process.env.PINECONE_API_KEY!,
    environment: process.env.PINECONE_ENVIRONMENT!
  })
  
  const pineconeIndex = client.Index(process.env.PINECONE_INDEX!)
  
  return {
    async addDocuments(documents: Document[]) {
      const embeddings = new OpenAIEmbeddings()
      const vectors = await embeddings.embedDocuments(
        documents.map(doc => doc.pageContent)
      )
      
      await pineconeIndex.upsert({
        vectors: vectors.map((vector, idx) => ({
          id: documents[idx].metadata.id,
          values: vector,
          metadata: documents[idx].metadata
        }))
      })
    },
    
    async similaritySearch(query: string, k = 4) {
      const embeddings = new OpenAIEmbeddings()
      const queryEmbedding = await embeddings.embedQuery(query)
      
      const results = await pineconeIndex.query({
        vector: queryEmbedding,
        topK: k,
        includeMetadata: true
      })
      
      return results.matches.map(match => ({
        pageContent: match.metadata.pageContent,
        metadata: match.metadata
      }))
    }
  }
}
```

### 2. Document Processing

```typescript
// lib/document-loader.ts
import { PDFLoader } from 'langchain/document_loaders/fs/pdf'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'

export async function processDocument(file: File) {
  const loader = new PDFLoader(file)
  const rawDocs = await loader.load()
  
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200
  })
  
  const docs = await textSplitter.splitDocuments(rawDocs)
  return docs
}
```

### 3. RAG Chat Implementation

```typescript
// app/api/chat/route.ts
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'
import { initVectorStore } from '@/lib/vectordb'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export async function POST(req: Request) {
  const { messages } = await req.json()
  const lastMessage = messages[messages.length - 1]
  
  // Initialize vector store
  const vectorStore = await initVectorStore()
  
  // Search for relevant documents
  const relevantDocs = await vectorStore.similaritySearch(
    lastMessage.content
  )
  
  // Create system message with context
  const context = relevantDocs
    .map(doc => doc.pageContent)
    .join('\n\n')
  
  const systemMessage = {
    role: 'system',
    content: `You are a helpful AI assistant. Use the following context to answer questions:\n\n${context}`
  }
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages: [systemMessage, ...messages]
  })
  
  const stream = OpenAIStream(response)
  return new StreamingTextResponse(stream)
}
```

### 4. Frontend Component

```typescript
// components/RAGChat.tsx
'use client'

import { useChat } from 'ai/react'
import { useCallback, useState } from 'react'
import { processDocument } from '@/lib/document-loader'

export function RAGChat() {
  const [isProcessing, setIsProcessing] = useState(false)
  
  const { messages, input, handleInputChange, handleSubmit } = useChat()
  
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    
    setIsProcessing(true)
    try {
      const file = e.target.files[0]
      const docs = await processDocument(file)
      
      // Upload to vector store
      const vectorStore = await initVectorStore()
      await vectorStore.addDocuments(docs)
      
      alert('Document processed successfully!')
    } catch (error) {
      console.error('Error processing document:', error)
      alert('Error processing document')
    } finally {
      setIsProcessing(false)
    }
  }, [])
  
  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map(m => (
          <div key={m.id} className="mb-4">
            <div className="font-bold">
              {m.role === 'user' ? 'You:' : 'AI:'}
            </div>
            <div className="mt-1">{m.content}</div>
          </div>
        ))}
      </div>
      
      <div className="border-t p-4">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          disabled={isProcessing}
          className="mb-4"
        />
        
        <form onSubmit={handleSubmit}>
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask a question..."
            className="w-full p-2 border rounded"
          />
        </form>
      </div>
    </div>
  )
}
```

## Best Practices

1. **Document Processing**
   - Split documents into appropriate chunk sizes
   - Maintain document metadata
   - Handle different file formats

2. **Vector Store Management**
   - Implement proper indexing strategies
   - Regular maintenance and cleanup
   - Monitor vector store performance

3. **Response Generation**
   - Balance context length with token limits
   - Implement proper error handling
   - Consider caching frequently accessed embeddings

4. **User Experience**
   - Provide clear feedback during document processing
   - Implement proper loading states
   - Handle errors gracefully

## Environment Setup

```bash
# .env.local
OPENAI_API_KEY=your_openai_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX=your_pinecone_index
```

## Dependencies

```json
{
  "dependencies": {
    "@pinecone-database/pinecone": "^0.1.0",
    "langchain": "^0.0.75",
    "ai": "latest",
    "openai": "^4.0.0"
  }
}
``` 