import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('/api/chat', () => {
    return HttpResponse.json({
      messages: [],
      status: 'success'
    });
  }),
  
  http.get('/api/chat/:id', () => {
    return HttpResponse.json({
      id: '123',
      messages: [],
      status: 'success'
    });
  }),
  
  http.post('/api/document', () => {
    return HttpResponse.json({
      id: '123',
      status: 'success'
    });
  })
]; 