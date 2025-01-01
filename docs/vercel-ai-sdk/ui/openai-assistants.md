# OpenAI Assistants Integration

## Overview

The Vercel AI SDK provides seamless integration with OpenAI's Assistants API, enabling you to create powerful AI assistants with access to files, tools, and custom functions.

## Basic Implementation

### 1. Assistant Configuration

```typescript
// lib/assistants/config.ts
import OpenAI from 'openai'
import { AssistantCreateParams } from 'openai/resources/beta/assistants'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function createAssistant(
  config: Partial<AssistantCreateParams>
) {
  const assistant = await openai.beta.assistants.create({
    name: 'Customer Support Assistant',
    instructions: `You are a helpful customer support assistant.
You can access product documentation and help users
with their questions.`,
    model: 'gpt-4-1106-preview',
    tools: [
      {
        type: 'retrieval' // Enable file access
      },
      {
        type: 'function',
        function: {
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
      }
    ],
    ...config
  })

  return assistant
}
```

### 2. Thread Management

```typescript
// lib/assistants/threads.ts
import { ThreadCreateParams } from 'openai/resources/beta/threads'

export async function createThread(
  config?: Partial<ThreadCreateParams>
) {
  const thread = await openai.beta.threads.create(config)
  return thread
}

export async function addMessage(
  threadId: string,
  content: string,
  metadata?: Record<string, unknown>
) {
  const message = await openai.beta.threads.messages.create(
    threadId,
    {
      role: 'user',
      content,
      metadata
    }
  )
  return message
}
```

### 3. Assistant Component

```typescript
// components/assistants/AssistantChat.tsx
import { useAssistant } from 'ai/react'
import { useState } from 'react'

export function AssistantChat() {
  const [threadId, setThreadId] = useState<string>()

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error
  } = useAssistant({
    api: '/api/assistant',
    threadId,
    onThreadCreated: (thread) => {
      setThreadId(thread.id)
    }
  })

  return (
    <div className="assistant-chat">
      <div className="messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.role}`}
          >
            {message.content.map((content) => (
              <div key={content.id}>
                {content.type === 'text' && (
                  <p>{content.text.value}</p>
                )}
                {content.type === 'image' && (
                  <img
                    src={content.image.url}
                    alt={content.image.title}
                  />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask a question..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          Send
        </button>
      </form>
    </div>
  )
}
```

## Advanced Features

### 1. File Handling

```typescript
// lib/assistants/files.ts
export async function uploadFile(
  file: File,
  purpose: 'assistants' | 'assistants_output'
) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('purpose', purpose)

  const uploadedFile = await openai.files.create(formData)
  return uploadedFile
}

export async function attachFileToAssistant(
  assistantId: string,
  fileId: string
) {
  const assistant = await openai.beta.assistants.update(
    assistantId,
    {
      file_ids: [fileId]
    }
  )
  return assistant
}
```

### 2. Run Management

```typescript
// lib/assistants/runs.ts
import {
  RunCreateParams,
  RunSubmitToolOutputsParams
} from 'openai/resources/beta/threads/runs'

export async function createRun(
  threadId: string,
  config: Partial<RunCreateParams>
) {
  const run = await openai.beta.threads.runs.create(
    threadId,
    config
  )
  return run
}

export async function submitToolOutputs(
  threadId: string,
  runId: string,
  outputs: RunSubmitToolOutputsParams
) {
  const run = await openai.beta.threads.runs.submitToolOutputs(
    threadId,
    runId,
    outputs
  )
  return run
}
```

### 3. Status Tracking

```typescript
// components/assistants/RunStatus.tsx
import { Run } from 'openai/resources/beta/threads/runs'

interface RunStatusProps {
  run: Run
  onComplete?: () => void
}

export function RunStatus({
  run,
  onComplete
}: RunStatusProps) {
  useEffect(() => {
    if (run.status === 'completed') {
      onComplete?.()
    }
  }, [run.status, onComplete])

  return (
    <div className="run-status">
      <div className="status">
        Status: {run.status}
      </div>
      
      {run.required_action && (
        <div className="required-action">
          <h4>Action Required</h4>
          <pre>
            {JSON.stringify(
              run.required_action.submit_tool_outputs,
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  )
}
```

## API Integration

### 1. Assistant Route

```typescript
// app/api/assistant/route.ts
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {
  const {
    threadId,
    message,
    assistantId = process.env.ASSISTANT_ID
  } = await req.json()

  // Create or retrieve thread
  const thread = threadId
    ? await openai.beta.threads.retrieve(threadId)
    : await openai.beta.threads.create()

  // Add message to thread
  await openai.beta.threads.messages.create(
    thread.id,
    {
      role: 'user',
      content: message
    }
  )

  // Create run
  const run = await openai.beta.threads.runs.create(
    thread.id,
    {
      assistant_id: assistantId
    }
  )

  // Create stream
  const stream = OpenAIStream(run)
  
  // Return streaming response
  return new StreamingTextResponse(stream)
}
```

### 2. File Upload Route

```typescript
// app/api/assistant/files/route.ts
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    const uploadedFile = await openai.files.create({
      file,
      purpose: 'assistants'
    })

    return NextResponse.json({ file: uploadedFile })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
```

## Styling

### 1. Assistant Chat Styles

```css
/* styles/assistant.css */
.assistant-chat {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 800px;
  margin: 0 auto;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.message {
  margin-bottom: 1rem;
  padding: 1rem;
  border-radius: 0.5rem;
}

.message.user {
  background: var(--user-message-bg);
  margin-left: auto;
  max-width: 80%;
}

.message.assistant {
  background: var(--assistant-message-bg);
  margin-right: auto;
  max-width: 80%;
}
```

### 2. File Upload Styles

```css
/* styles/file-upload.css */
.file-upload {
  margin: 1rem 0;
  padding: 1rem;
  border: 2px dashed var(--border-color);
  border-radius: 0.5rem;
  text-align: center;
}

.file-upload.dragging {
  background: var(--drag-bg);
  border-color: var(--primary-color);
}

.uploaded-files {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.file-card {
  padding: 0.75rem;
  border-radius: 0.375rem;
  background: var(--file-card-bg);
}
```

### 3. Theme Variables

```typescript
// styles/theme.ts
export const assistantTheme = {
  light: {
    '--user-message-bg': '#e9ecef',
    '--assistant-message-bg': '#f8f9fa',
    '--drag-bg': '#e9ecef',
    '--file-card-bg': '#ffffff',
    '--border-color': '#dee2e6'
  },
  dark: {
    '--user-message-bg': '#343a40',
    '--assistant-message-bg': '#212529',
    '--drag-bg': '#343a40',
    '--file-card-bg': '#212529',
    '--border-color': '#495057'
  }
}
``` 