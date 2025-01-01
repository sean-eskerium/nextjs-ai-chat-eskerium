# Natural Language Postgres

## Overview

Learn how to build a natural language interface for PostgreSQL using the Vercel AI SDK. This guide shows you how to create an AI-powered system that converts natural language queries into SQL and executes them safely.

## Setup

### 1. Installation

```bash
npm install ai openai@^4.0.0 postgres @vercel/postgres
```

### 2. Database Configuration

```typescript
// lib/db.ts
import { sql } from '@vercel/postgres'
import { createPool } from '@vercel/postgres'

export const pool = createPool({
  connectionString: process.env.POSTGRES_URL
})

// Helper function to execute queries
export async function executeQuery(query: string) {
  try {
    const result = await sql.query(query)
    return result.rows
  } catch (error) {
    console.error('Database error:', error)
    throw error
  }
}
```

## Implementation

### 1. Query Generation API

```typescript
// app/api/nl-query/route.ts
import OpenAI from 'openai'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import { executeQuery } from '@/lib/db'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export async function POST(req: Request) {
  const { messages } = await req.json()
  
  // Get the schema information
  const schemaInfo = await getSchemaInfo()
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages: [
      {
        role: 'system',
        content: `You are a SQL expert. Use this schema information to generate SQL queries:
        
        ${schemaInfo}
        
        Generate only valid PostgreSQL queries. Always use parameterized queries for safety.`
      },
      ...messages
    ],
    functions: [
      {
        name: 'execute_query',
        description: 'Execute a SQL query',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The SQL query to execute'
            },
            params: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Query parameters'
            }
          },
          required: ['query']
        }
      }
    ]
  })

  const stream = OpenAIStream(response, {
    async experimental_onFunctionCall(functionCall) {
      if (functionCall.name === 'execute_query') {
        const { query, params = [] } = functionCall.arguments
        
        // Validate and execute the query
        const validatedQuery = await validateQuery(query)
        const result = await executeQuery(validatedQuery, params)
        
        return JSON.stringify(result)
      }
    }
  })

  return new StreamingTextResponse(stream)
}
```

### 2. Query Interface Component

```typescript
// components/NLQueryInterface.tsx
'use client'

import { useChat } from 'ai/react'
import { useState } from 'react'

export function NLQueryInterface() {
  const [results, setResults] = useState<any[]>([])
  
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit
  } = useChat({
    api: '/api/nl-query',
    onFinish: (message) => {
      try {
        // Try to parse the response as JSON
        const data = JSON.parse(message.content)
        setResults(data)
      } catch (error) {
        console.error('Failed to parse results:', error)
      }
    }
  })

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map(m => (
          <div key={m.id} className="mb-4">
            <div className="font-bold">
              {m.role === 'user' ? 'Question:' : 'Answer:'}
            </div>
            <div className="mt-1">{m.content}</div>
          </div>
        ))}
        
        {results.length > 0 && (
          <div className="mt-4">
            <h3 className="font-bold">Results:</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full mt-2">
                <thead>
                  <tr>
                    {Object.keys(results[0]).map(key => (
                      <th key={key} className="px-4 py-2 bg-gray-100">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((value, j) => (
                        <td key={j} className="border px-4 py-2">
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t p-4">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask a question about your data..."
          className="w-full p-2 border rounded"
        />
      </form>
    </div>
  )
}
```

## Safety Features

### 1. Query Validation

```typescript
// lib/query-validation.ts
import { parse } from 'pgsql-ast-parser'

export async function validateQuery(query: string) {
  try {
    // Parse the query to ensure it's valid SQL
    const ast = parse(query)
    
    // Check for dangerous operations
    if (containsDangerousOperations(ast)) {
      throw new Error('Query contains dangerous operations')
    }
    
    // Ensure it's a read-only query
    if (!isReadOnlyQuery(ast)) {
      throw new Error('Only SELECT queries are allowed')
    }
    
    return query
  } catch (error) {
    throw new Error(`Invalid query: ${error.message}`)
  }
}

function containsDangerousOperations(ast: any) {
  // Check for DROP, DELETE, TRUNCATE, etc.
  const dangerousKeywords = [
    'DROP',
    'DELETE',
    'TRUNCATE',
    'ALTER',
    'UPDATE',
    'INSERT'
  ]
  
  return dangerousKeywords.some(keyword =>
    JSON.stringify(ast).includes(keyword)
  )
}

function isReadOnlyQuery(ast: any) {
  // Only allow SELECT statements
  return ast.every((statement: any) =>
    statement.type === 'select'
  )
}
```

### 2. Schema Management

```typescript
// lib/schema-management.ts
import { pool } from '@/lib/db'

export async function getSchemaInfo() {
  const query = `
    SELECT 
      table_name,
      column_name,
      data_type,
      is_nullable
    FROM 
      information_schema.columns
    WHERE 
      table_schema = 'public'
    ORDER BY 
      table_name, ordinal_position;
  `
  
  const result = await pool.query(query)
  
  // Format schema information for the AI
  return result.rows.reduce((acc, row) => {
    if (!acc[row.table_name]) {
      acc[row.table_name] = []
    }
    
    acc[row.table_name].push({
      column: row.column_name,
      type: row.data_type,
      nullable: row.is_nullable === 'YES'
    })
    
    return acc
  }, {})
}
```

## Best Practices

1. **Query Safety**
   - Always validate queries before execution
   - Use parameterized queries
   - Implement proper error handling
   - Limit query complexity and execution time

2. **Performance**
   - Cache schema information
   - Implement query timeouts
   - Monitor query performance
   - Use appropriate indexes

3. **User Experience**
   - Provide clear error messages
   - Show query execution time
   - Format results appropriately
   - Implement pagination for large results

## Environment Setup

```bash
# .env.local
POSTGRES_URL=your_postgres_connection_string
OPENAI_API_KEY=your_openai_api_key
MAX_QUERY_EXECUTION_TIME=5000
```

## Security Considerations

1. **Access Control**
   - Implement proper authentication
   - Use role-based access control
   - Limit database user permissions
   - Monitor query patterns

2. **Data Protection**
   - Sanitize all user inputs
   - Mask sensitive data in results
   - Implement rate limiting
   - Log all queries for audit

3. **Query Restrictions**
   - Allow only read operations
   - Limit result set size
   - Implement query timeouts
   - Monitor resource usage 