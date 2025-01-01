# AI SDK UI Components

## Overview

The Vercel AI SDK provides a set of React hooks and components for building AI-powered user interfaces. These components are designed to work seamlessly with the AI SDK Core and handle common patterns like streaming responses, loading states, and error handling.

## Core Hooks

### useChat

```typescript
import { useChat } from 'ai/react'

function ChatComponent() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    append,
    reload,
    stop,
    setMessages
  } = useChat({
    api: '/api/chat',
    id: 'unique-chat-id',
    body: {
      // Additional parameters to send to the API
      systemPrompt: 'You are a helpful assistant'
    },
    onResponse: (response) => {
      // Handle streaming response
    },
    onFinish: (message) => {
      // Handle completion
    },
    onError: (error) => {
      // Handle errors
    }
  })

  return (
    <div>
      {/* Chat UI implementation */}
    </div>
  )
}
```

### useCompletion

```typescript
import { useCompletion } from 'ai/react'

function CompletionComponent() {
  const {
    completion,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    stop
  } = useCompletion({
    api: '/api/completion',
    onResponse: (response) => {
      // Handle streaming response
    },
    onFinish: (completion) => {
      // Handle completion
    }
  })

  return (
    <div>
      {/* Completion UI implementation */}
    </div>
  )
}
```

## UI Components

### Message Components

```typescript
// components/chat/MessageList.tsx
import { Message } from 'ai'

interface MessageListProps {
  messages: Message[]
  isLoading?: boolean
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  return (
    <div className="messages">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`message ${message.role}`}
        >
          <div className="content">{message.content}</div>
          {message.function_call && (
            <div className="function-call">
              {JSON.stringify(message.function_call, null, 2)}
            </div>
          )}
        </div>
      ))}
      {isLoading && <LoadingIndicator />}
    </div>
  )
}
```

### Input Components

```typescript
// components/chat/ChatInput.tsx
interface ChatInputProps {
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading?: boolean
}

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading
}: ChatInputProps) {
  return (
    <form onSubmit={handleSubmit}>
      <input
        value={input}
        onChange={handleInputChange}
        placeholder="Type a message..."
        disabled={isLoading}
      />
      <button type="submit" disabled={isLoading}>
        Send
      </button>
    </form>
  )
}
```

## Advanced Features

### Stream Processing

```typescript
// components/chat/StreamProcessor.tsx
import { experimental_StreamingReactResponse } from 'ai/react'

function StreamProcessor({ stream }: { stream: ReadableStream }) {
  const [content, setContent] = useState('')

  useEffect(() => {
    const processStream = async () => {
      const reader = stream.getReader()
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          setContent(prev => prev + value)
        }
      } finally {
        reader.releaseLock()
      }
    }
    processStream()
  }, [stream])

  return <div>{content}</div>
}
```

### Error Boundaries

```typescript
// components/chat/ChatErrorBoundary.tsx
import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback: ReactNode
}

interface State {
  hasError: boolean
}

export class ChatErrorBoundary extends Component<Props, State> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error('Chat error:', error)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}
```

## State Management

### Message Store

```typescript
// lib/stores/message-store.ts
import { create } from 'zustand'
import { Message } from 'ai'

interface MessageStore {
  messages: Message[]
  addMessage: (message: Message) => void
  updateMessage: (id: string, update: Partial<Message>) => void
  removeMessage: (id: string) => void
  clearMessages: () => void
}

export const useMessageStore = create<MessageStore>((set) => ({
  messages: [],
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message]
    })),
  updateMessage: (id, update) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...update } : msg
      )
    })),
  removeMessage: (id) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== id)
    })),
  clearMessages: () => set({ messages: [] })
}))
```

## Styling Integration

### Tailwind CSS

```typescript
// components/chat/ChatUI.tsx
export function ChatUI() {
  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4">
        <MessageList messages={messages} />
      </div>
      <div className="border-t p-4">
        <ChatInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
        />
      </div>
    </div>
  )
}
```

### CSS Modules

```typescript
// styles/Chat.module.css
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.messageList {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.inputContainer {
  border-top: 1px solid #e5e7eb;
  padding: 1rem;
}

// components/chat/StyledChat.tsx
import styles from './Chat.module.css'

export function StyledChat() {
  return (
    <div className={styles.container}>
      <div className={styles.messageList}>
        <MessageList messages={messages} />
      </div>
      <div className={styles.inputContainer}>
        <ChatInput {...inputProps} />
      </div>
    </div>
  )
}
``` 