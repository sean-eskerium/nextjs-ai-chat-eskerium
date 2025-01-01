# Multi-Modal Chatbot Implementation Guide

## Overview

This guide covers implementing a multi-modal chatbot using the Vercel AI SDK, supporting text, images, and file attachments. The implementation uses OpenAI's GPT-4 Vision model for image understanding and text generation.

## Implementation Steps

### 1. Basic Setup

```typescript
// app/api/chat/route.ts
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'
import { ChatCompletionMessageParam } from 'openai/resources/chat'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {
  const { messages, attachments } = await req.json()
  
  // Transform messages for multi-modal support
  const formattedMessages = formatMessages(messages, attachments)
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4-vision-preview',
    stream: true,
    messages: formattedMessages,
    max_tokens: 500,
  })
  
  const stream = OpenAIStream(response)
  return new StreamingTextResponse(stream)
}
```

### 2. Message Formatting

```typescript
// lib/utils/format-messages.ts
function formatMessages(
  messages: ChatCompletionMessageParam[],
  attachments?: Attachment[]
) {
  return messages.map(message => {
    if (message.role === 'user' && attachments?.length) {
      return {
        ...message,
        content: [
          { type: 'text', text: message.content as string },
          ...attachments.map(attachment => ({
            type: 'image_url',
            image_url: attachment.url
          }))
        ]
      }
    }
    return message
  })
}
```

### 3. Frontend Implementation

```typescript
// components/chat/MultiModalChat.tsx
import { useChat, Message } from 'ai/react'
import { useState } from 'react'

export function MultiModalChat() {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
  } = useChat({
    api: '/api/chat',
    body: {
      attachments,
    },
  })

  return (
    <div>
      <div className="messages">
        {messages.map(message => (
          <Message key={message.id} {...message} />
        ))}
      </div>
      
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Type a message..."
        />
        <AttachmentUpload
          onUpload={files => setAttachments(files)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  )
}
```

### 4. File Upload Component

```typescript
// components/chat/AttachmentUpload.tsx
import { useState } from 'react'

export function AttachmentUpload({ onUpload }) {
  const [uploading, setUploading] = useState(false)

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target.files?.length) return

    setUploading(true)
    
    try {
      const files = Array.from(event.target.files)
      const uploadPromises = files.map(async file => {
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        
        return response.json()
      })
      
      const uploadedFiles = await Promise.all(uploadPromises)
      onUpload(uploadedFiles)
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && <span>Uploading...</span>}
    </div>
  )
}
```

### 5. File Upload API

```typescript
// app/api/upload/route.ts
import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const form = await request.formData()
  const file = form.get('file') as File
  
  const blob = await put(file.name, file, {
    access: 'public',
  })

  return NextResponse.json(blob)
}
```

## Features and Capabilities

### Supported File Types
- Images (PNG, JPEG, GIF)
- PDFs (for document analysis)
- Code files (for code understanding)

### Message Types
1. **Text Messages**
   - Regular chat messages
   - System prompts
   - Error messages

2. **Image Messages**
   - Image uploads
   - Image analysis
   - Image generation responses

3. **Mixed Content**
   - Text with images
   - Multiple images
   - Image annotations

## Best Practices

### Performance
1. **Image Optimization**
   - Compress images before upload
   - Use appropriate image formats
   - Implement lazy loading

2. **Stream Management**
   - Handle connection drops
   - Implement retry logic
   - Monitor stream health

### Security
1. **File Validation**
   - Check file types
   - Limit file sizes
   - Scan for malware

2. **Access Control**
   - Implement user authentication
   - Rate limit uploads
   - Validate file permissions

### Error Handling
1. **Upload Errors**
   - Network issues
   - File size limits
   - Format validation

2. **Processing Errors**
   - Model timeout
   - Content moderation
   - Rate limiting

## Advanced Features

### 1. Progress Tracking
```typescript
function UploadProgress({ progress }) {
  return (
    <div className="progress-bar">
      <div 
        className="progress"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
```

### 2. Drag and Drop
```typescript
function DropZone({ onDrop }) {
  const handleDrop = (e) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    onDrop(files)
  }

  return (
    <div 
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      Drop files here
    </div>
  )
}
```

### 3. File Preview
```typescript
function FilePreview({ files }) {
  return (
    <div className="previews">
      {files.map(file => (
        <div key={file.name}>
          <img src={URL.createObjectURL(file)} />
          <span>{file.name}</span>
        </div>
      ))}
    </div>
  )
}
``` 