# Prompts

## Overview

Learn about how Prompts are used and defined in the AI SDK.

## System Messages

System messages help set the behavior and context for the AI model. They should be placed at the beginning of your conversation.

```typescript
const messages = [
  { role: 'system', content: 'You are a helpful AI assistant.' },
  { role: 'user', content: 'Hello!' }
]
```

## Message Types

The AI SDK supports different message types:

```typescript
type Message = {
  role: 'system' | 'user' | 'assistant' | 'function'
  content: string
  name?: string // Required for function messages
  function_call?: {
    name: string
    arguments: string
  }
}
```

## Best Practices

### 1. Clear Instructions

```typescript
// Good
const systemMessage = {
  role: 'system',
  content: 'You are a technical expert. Provide clear, concise answers with code examples when relevant.'
}

// Less Effective
const vagueMessage = {
  role: 'system',
  content: 'Be helpful.'
}
```

### 2. Context Management

```typescript
const conversation = {
  messages: [
    {
      role: 'system',
      content: 'You are an AI assistant with expertise in JavaScript.'
    },
    {
      role: 'user',
      content: 'How do I use async/await?'
    }
  ],
  
  addMessage(content: string, role: Message['role'] = 'user') {
    this.messages.push({ role, content })
  },
  
  getContext() {
    return this.messages
  }
}
```

### 3. Temperature Control

```typescript
// More deterministic responses
const preciseConfig = {
  temperature: 0.2,
  messages: [/* ... */]
}

// More creative responses
const creativeConfig = {
  temperature: 0.8,
  messages: [/* ... */]
}
```

## Advanced Usage

### 1. Function Calling

```typescript
const messages = [
  {
    role: 'system',
    content: 'You can search the knowledge base and create tickets.'
  },
  {
    role: 'user',
    content: 'Find documentation about prompts.'
  },
  {
    role: 'assistant',
    content: null,
    function_call: {
      name: 'search_knowledge_base',
      arguments: '{"query": "prompts documentation", "type": "docs"}'
    }
  }
]
```

### 2. Prompt Templates

```typescript
interface PromptTemplate {
  template: string
  variables: string[]
}

const templates = {
  codeExplanation: {
    template: 'Explain the following {language} code:\n\n{code}',
    variables: ['language', 'code']
  },
  
  bugFix: {
    template: 'Fix the following bug in {language}:\n\n{code}\n\nError: {error}',
    variables: ['language', 'code', 'error']
  }
}

function generatePrompt(
  templateName: string,
  variables: Record<string, string>
): string {
  const template = templates[templateName]
  if (!template) throw new Error('Template not found')
  
  let prompt = template.template
  for (const key of template.variables) {
    if (!(key in variables)) {
      throw new Error(`Missing variable: ${key}`)
    }
    prompt = prompt.replace(`{${key}}`, variables[key])
  }
  
  return prompt
}
```

### 3. Chain of Thought

```typescript
const messages = [
  {
    role: 'system',
    content: 'Break down complex problems step by step.'
  },
  {
    role: 'user',
    content: 'Calculate (15 * 23) + (45 / 5)'
  },
  {
    role: 'assistant',
    content: `Let me solve this step by step:

1. First, let's calculate 15 * 23
   - 15 * 23 = 345

2. Next, let's calculate 45 / 5
   - 45 / 5 = 9

3. Finally, let's add the results
   - 345 + 9 = 354

Therefore, (15 * 23) + (45 / 5) = 354`
  }
]
```

## Integration Examples

### 1. React Component

```typescript
import { useChat } from 'ai/react'

function ChatComponent() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    initialMessages: [
      {
        role: 'system',
        content: 'You are a helpful AI assistant.'
      }
    ]
  })

  return (
    <div>
      {messages.map(m => (
        <div key={m.id}>
          {m.role}: {m.content}
        </div>
      ))}
      
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Say something..."
        />
      </form>
    </div>
  )
}
```

### 2. API Route

```typescript
// app/api/chat/route.ts
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'

export async function POST(req: Request) {
  const { messages } = await req.json()
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages: [
      {
        role: 'system',
        content: 'You are a helpful AI assistant.'
      },
      ...messages
    ]
  })

  const stream = OpenAIStream(response)
  return new StreamingTextResponse(stream)
}
```

## Security Considerations

### 1. Input Validation

```typescript
function validateMessage(message: Message): boolean {
  if (!message.role || !message.content) {
    return false
  }
  
  if (message.role === 'function' && !message.name) {
    return false
  }
  
  // Prevent injection attacks
  const sanitizedContent = message.content.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ''
  )
  
  message.content = sanitizedContent
  return true
}
```

### 2. Rate Limiting

```typescript
class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  
  isAllowed(userId: string, limit: number, window: number): boolean {
    const now = Date.now()
    const userRequests = this.requests.get(userId) || []
    
    // Remove old requests
    const recentRequests = userRequests.filter(
      time => now - time < window
    )
    
    if (recentRequests.length >= limit) {
      return false
    }
    
    recentRequests.push(now)
    this.requests.set(userId, recentRequests)
    return true
  }
}
```

### 3. Content Filtering

```typescript
function filterSensitiveContent(content: string): string {
  const sensitivePatterns = [
    /\b(password|secret|api[_-]?key)\b/gi,
    /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/, // Credit card
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i // Email
  ]
  
  let filteredContent = content
  for (const pattern of sensitivePatterns) {
    filteredContent = filteredContent.replace(pattern, '[REDACTED]')
  }
  
  return filteredContent
}
``` 