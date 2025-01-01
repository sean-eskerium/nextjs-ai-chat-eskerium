export const useChat = jest.fn(() => ({
  messages: [],
  input: '',
  handleInputChange: jest.fn(),
  handleSubmit: jest.fn(),
  isLoading: false,
  append: jest.fn(),
  reload: jest.fn(),
  stop: jest.fn(),
  setInput: jest.fn()
}));

export const useCompletion = jest.fn(() => ({
  completion: '',
  input: '',
  handleInputChange: jest.fn(),
  handleSubmit: jest.fn(),
  isLoading: false,
  stop: jest.fn(),
  setInput: jest.fn()
})); 