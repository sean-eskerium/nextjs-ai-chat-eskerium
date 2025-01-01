import { rest } from 'msw'
import { setupServer } from 'msw/node'

export const handlers = [
  rest.post('/api/chat', (req, res, ctx) => {
    return res(
      ctx.json({
        messages: [],
        status: 'success'
      })
    )
  }),
  
  rest.get('/api/chat/:id', (req, res, ctx) => {
    return res(
      ctx.json({
        id: '123',
        messages: [],
        status: 'success'
      })
    )
  }),
  
  rest.post('/api/document', (req, res, ctx) => {
    return res(
      ctx.json({
        id: '123',
        status: 'success'
      })
    )
  })
]

export const server = setupServer(...handlers) 