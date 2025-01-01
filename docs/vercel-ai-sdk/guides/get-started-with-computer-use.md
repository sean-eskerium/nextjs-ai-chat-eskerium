# Get Started with Computer Use

## Overview

Learn how to implement AI-powered computer control and automation using the Vercel AI SDK. This guide covers setting up and using AI models to interact with computer systems safely and effectively.

## Setup

### 1. Installation

```bash
npm install ai openai@^4.0.0 @vercel/ai-computer
```

### 2. Configuration

```typescript
// lib/computer-config.ts
import { defineConfig } from '@vercel/ai-computer'

export const computerConfig = defineConfig({
  // Define allowed actions and their permissions
  allowedActions: {
    fileSystem: {
      read: true,
      write: false
    },
    network: {
      outbound: true,
      inbound: false
    },
    process: {
      execute: ['node', 'npm']
    }
  },
  
  // Set safety limits
  limits: {
    maxExecutionTime: 5000, // 5 seconds
    maxMemoryUsage: '256mb'
  }
})
```

## Implementation

### 1. API Route

```typescript
// app/api/computer/route.ts
import { ComputerStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'
import { computerConfig } from '@/lib/computer-config'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export async function POST(req: Request) {
  const { messages } = await req.json()

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages: [
      {
        role: 'system',
        content: 'You are an AI assistant that can help users with computer tasks.'
      },
      ...messages
    ],
    functions: [
      {
        name: 'execute_command',
        description: 'Execute a system command',
        parameters: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              description: 'The command to execute'
            }
          },
          required: ['command']
        }
      },
      {
        name: 'read_file',
        description: 'Read a file from the system',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to the file'
            }
          },
          required: ['path']
        }
      }
    ]
  })

  const stream = ComputerStream(response, {
    config: computerConfig,
    async onFunctionCall(functionCall) {
      // Handle computer interactions
      switch (functionCall.name) {
        case 'execute_command':
          return executeCommand(functionCall.arguments.command)
        case 'read_file':
          return readFile(functionCall.arguments.path)
        default:
          throw new Error(`Unknown function: ${functionCall.name}`)
      }
    }
  })

  return new StreamingTextResponse(stream)
}
```

### 2. Computer Control Component

```typescript
// components/ComputerControl.tsx
'use client'

import { useChat } from 'ai/react'
import { useState } from 'react'

export function ComputerControl() {
  const [status, setStatus] = useState<string>('')
  
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit
  } = useChat({
    api: '/api/computer',
    onResponse: (response) => {
      setStatus('Processing command...')
    },
    onFinish: () => {
      setStatus('Command completed')
    },
    onError: (error) => {
      setStatus(`Error: ${error.message}`)
    }
  })

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map(m => (
          <div key={m.id} className="mb-4">
            <div className="font-bold">
              {m.role === 'user' ? 'User: ' : 'AI: '}
            </div>
            <div className="mt-1">{m.content}</div>
          </div>
        ))}
        
        {status && (
          <div className="text-sm text-gray-500">
            {status}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t p-4">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Describe what you want to do..."
          className="w-full p-2 border rounded"
        />
      </form>
    </div>
  )
}
```

## Safety Features

### 1. Command Validation

```typescript
// lib/command-validation.ts
const ALLOWED_COMMANDS = [
  'ls',
  'dir',
  'pwd',
  'echo',
  'node',
  'npm'
]

export function validateCommand(command: string) {
  const baseCommand = command.split(' ')[0]
  
  if (!ALLOWED_COMMANDS.includes(baseCommand)) {
    throw new Error(`Command not allowed: ${baseCommand}`)
  }
  
  // Check for dangerous patterns
  const dangerousPatterns = [
    /rm\s+-rf/,
    />\s*\//,
    /\|\s*sudo/
  ]
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(command)) {
      throw new Error('Potentially dangerous command detected')
    }
  }
  
  return command
}
```

### 2. Resource Monitoring

```typescript
// lib/resource-monitor.ts
export class ResourceMonitor {
  private startTime: number
  private memoryUsage: number
  
  constructor(private limits: typeof computerConfig.limits) {
    this.startTime = Date.now()
    this.memoryUsage = 0
  }
  
  checkLimits() {
    const executionTime = Date.now() - this.startTime
    if (executionTime > this.limits.maxExecutionTime) {
      throw new Error('Execution time limit exceeded')
    }
    
    const currentMemory = process.memoryUsage().heapUsed
    if (currentMemory > this.memoryUsage) {
      this.memoryUsage = currentMemory
      if (this.memoryUsage > this.parseMemoryLimit()) {
        throw new Error('Memory limit exceeded')
      }
    }
  }
  
  private parseMemoryLimit() {
    const match = this.limits.maxMemoryUsage.match(/(\d+)mb/)
    return match ? parseInt(match[1]) * 1024 * 1024 : Infinity
  }
}
```

## Best Practices

1. **Security**
   - Always validate commands before execution
   - Implement proper permission checks
   - Monitor resource usage
   - Log all operations

2. **Error Handling**
   - Implement timeouts for all operations
   - Provide clear error messages
   - Handle cleanup after failures

3. **User Experience**
   - Provide clear feedback on operation status
   - Implement progress indicators
   - Allow operation cancellation

## Environment Setup

```bash
# .env.local
OPENAI_API_KEY=your_openai_api_key
ALLOWED_COMMANDS=node,npm,ls,dir
MAX_EXECUTION_TIME=5000
MAX_MEMORY_USAGE=256mb
```

## Security Considerations

1. **Command Isolation**
   - Run commands in isolated environments
   - Implement proper user permissions
   - Monitor for suspicious activity

2. **Resource Limits**
   - Set strict execution timeouts
   - Monitor memory usage
   - Implement rate limiting

3. **Audit Logging**
   - Log all commands and their results
   - Track resource usage
   - Monitor for abuse patterns 