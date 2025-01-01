# Expo

## Overview

Learn how to use the Vercel AI SDK with Expo.

## Installation

```bash
npm install ai openai@^4.0.0
```

## Basic Setup

### 1. API Route

```typescript
// app/api/chat.ts
import OpenAI from 'openai'
import { OpenAIStream, StreamingTextResponse } from 'ai'

// Create an OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export default async function handler(req: Request) {
  const { messages } = await req.json()

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages
  })

  const stream = OpenAIStream(response)
  return new StreamingTextResponse(stream)
}
```

### 2. React Native Component

```typescript
// components/Chat.tsx
import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet
} from 'react-native'
import { useChat } from 'ai/react'

export function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat()
  const [inputValue, setInputValue] = useState('')

  const onSubmit = () => {
    handleSubmit(new Event('submit') as any)
    setInputValue('')
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.messagesContainer}>
        {messages.map((m) => (
          <View
            key={m.id}
            style={[
              styles.message,
              m.role === 'user'
                ? styles.userMessage
                : styles.assistantMessage
            ]}
          >
            <Text style={styles.messageText}>{m.content}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={(text) => {
            setInputValue(text)
            handleInputChange({
              target: { value: text }
            } as any)
          }}
          placeholder="Say something..."
          placeholderTextColor="#666"
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={onSubmit}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  messagesContainer: {
    flex: 1,
    padding: 16
  },
  message: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    maxWidth: '80%'
  },
  userMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end'
  },
  assistantMessage: {
    backgroundColor: '#E9E9EB',
    alignSelf: 'flex-start'
  },
  messageText: {
    fontSize: 16,
    color: '#000'
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E9E9EB'
  },
  input: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E9E9EB',
    borderRadius: 8,
    marginRight: 8,
    fontSize: 16
  },
  sendButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center'
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
})
```

## Advanced Features

### 1. Custom Stream Processing

```typescript
// app/api/chat.ts
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export default async function handler(req: Request) {
  const { messages } = await req.json()

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages,
    temperature: 0.7,
    max_tokens: 500
  })

  const stream = OpenAIStream(response, {
    async onCompletion(completion) {
      // Store in database, etc...
      await saveToDatabase(completion)
    },
    onToken(token) {
      // Process individual tokens
      console.log(token)
    },
    experimental_streamData: true
  })

  return new StreamingTextResponse(stream)
}
```

### 2. Function Calling

```typescript
// app/api/chat.ts
import OpenAI from 'openai'
import { OpenAIStream, StreamingTextResponse } from 'ai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export default async function handler(req: Request) {
  const { messages } = await req.json()

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages,
    functions: [
      {
        name: 'get_weather',
        description: 'Get the weather for a location',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'The location to get the weather for'
            }
          },
          required: ['location']
        }
      }
    ]
  })

  const stream = OpenAIStream(response, {
    async experimental_onFunctionCall(functionCall) {
      // Call your function here...
      const result = await getWeather(functionCall.arguments.location)
      
      // Return the result to the model
      return JSON.stringify(result)
    }
  })

  return new StreamingTextResponse(stream)
}
```

## UI Components

### 1. Chat Component with Animations

```typescript
// components/AnimatedChat.tsx
import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated
} from 'react-native'
import { useChat } from 'ai/react'

export function AnimatedChat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat()
  const [inputValue, setInputValue] = useState('')
  const fadeAnim = new Animated.Value(0)

  const onSubmit = () => {
    handleSubmit(new Event('submit') as any)
    setInputValue('')
  }

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true
    }).start()
  }, [messages])

  return (
    <View style={styles.container}>
      <ScrollView style={styles.messagesContainer}>
        {messages.map((m) => (
          <Animated.View
            key={m.id}
            style={[
              styles.message,
              m.role === 'user'
                ? styles.userMessage
                : styles.assistantMessage,
              { opacity: fadeAnim }
            ]}
          >
            <Text style={styles.messageText}>{m.content}</Text>
          </Animated.View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={(text) => {
            setInputValue(text)
            handleInputChange({
              target: { value: text }
            } as any)
          }}
          placeholder="Say something..."
          placeholderTextColor="#666"
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={onSubmit}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  messagesContainer: {
    flex: 1,
    padding: 16
  },
  message: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    maxWidth: '80%'
  },
  userMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end'
  },
  assistantMessage: {
    backgroundColor: '#E9E9EB',
    alignSelf: 'flex-start'
  },
  messageText: {
    fontSize: 16,
    color: '#000'
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E9E9EB'
  },
  input: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E9E9EB',
    borderRadius: 8,
    marginRight: 8,
    fontSize: 16
  },
  sendButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center'
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
})
```

### 2. Completion Component

```typescript
// components/Completion.tsx
import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native'
import { useCompletion } from 'ai/react'

export function Completion() {
  const {
    completion,
    input,
    stop,
    isLoading,
    handleInputChange,
    handleSubmit
  } = useCompletion()
  const [inputValue, setInputValue] = useState('')

  const onSubmit = () => {
    handleSubmit(new Event('submit') as any)
    setInputValue('')
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={(text) => {
            setInputValue(text)
            handleInputChange({
              target: { value: text }
            } as any)
          }}
          placeholder="Enter a prompt..."
          placeholderTextColor="#666"
        />
        <TouchableOpacity
          style={styles.submitButton}
          onPress={onSubmit}
        >
          <Text style={styles.submitButtonText}>Generate</Text>
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <TouchableOpacity
            style={styles.stopButton}
            onPress={stop}
          >
            <Text style={styles.stopButtonText}>Stop</Text>
          </TouchableOpacity>
        </View>
      )}

      {completion && (
        <View style={styles.completionContainer}>
          <Text style={styles.completionText}>{completion}</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff'
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 16
  },
  input: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E9E9EB',
    borderRadius: 8,
    marginRight: 8,
    fontSize: 16
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center'
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 16
  },
  stopButton: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 8
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  },
  completionContainer: {
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 8
  },
  completionText: {
    fontSize: 16,
    lineHeight: 24
  }
})
```

## Best Practices

### 1. Error Handling

```typescript
// utils/error-handling.ts
import { Alert } from 'react-native'

export function handleError(error: unknown) {
  if (error instanceof Error) {
    Alert.alert(
      'Error',
      error.message,
      [{ text: 'OK' }]
    )
  } else {
    Alert.alert(
      'Error',
      'An unknown error occurred',
      [{ text: 'OK' }]
    )
  }
}

// components/Chat.tsx
import { handleError } from '../utils/error-handling'

export function Chat() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    error
  } = useChat({
    onError: handleError
  })

  // ... rest of component
}
```

### 2. Loading States

```typescript
// components/LoadingIndicator.tsx
import React from 'react'
import {
  View,
  ActivityIndicator,
  StyleSheet
} from 'react-native'

export function LoadingIndicator() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center'
  }
})

// components/Chat.tsx
import { LoadingIndicator } from './LoadingIndicator'

export function Chat() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading
  } = useChat()

  return (
    <View style={styles.container}>
      {/* ... messages ... */}
      {isLoading && <LoadingIndicator />}
      {/* ... input ... */}
    </View>
  )
}
```

### 3. Offline Support

```typescript
// utils/offline.ts
import NetInfo from '@react-native-community/netinfo'
import AsyncStorage from '@react-native-async-storage/async-storage'

export async function checkConnection() {
  const state = await NetInfo.fetch()
  return state.isConnected
}

export async function saveMessage(message: any) {
  try {
    const messages = await AsyncStorage.getItem('messages')
    const parsed = messages ? JSON.parse(messages) : []
    parsed.push(message)
    await AsyncStorage.setItem('messages', JSON.stringify(parsed))
  } catch (error) {
    console.error('Error saving message:', error)
  }
}

export async function syncMessages() {
  try {
    const messages = await AsyncStorage.getItem('messages')
    if (messages) {
      const parsed = JSON.parse(messages)
      // Sync with server...
      await AsyncStorage.removeItem('messages')
    }
  } catch (error) {
    console.error('Error syncing messages:', error)
  }
}

// components/Chat.tsx
import {
  checkConnection,
  saveMessage,
  syncMessages
} from '../utils/offline'

export function Chat() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit
  } = useChat({
    async onFinish(message) {
      const isConnected = await checkConnection()
      if (!isConnected) {
        await saveMessage(message)
      }
    }
  })

  React.useEffect(() => {
    syncMessages()
  }, [])

  // ... rest of component
}
``` 