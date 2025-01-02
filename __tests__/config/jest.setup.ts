import '@testing-library/jest-dom';

// Mock CodeMirror modules
jest.mock('@codemirror/view', () => ({
  EditorView: jest.fn(() => ({
    destroy: jest.fn(),
    dispatch: jest.fn(),
    state: {
      doc: {
        toString: () => 'mock content',
      },
    },
    setState: jest.fn(),
  })),
}));

jest.mock('@codemirror/state', () => ({
  EditorState: {
    create: jest.fn(() => ({
      doc: {
        toString: () => 'mock content',
      },
    })),
  },
  Transaction: {
    remote: {
      of: jest.fn(() => true),
    },
  },
}));

jest.mock('@codemirror/lang-python', () => ({
  python: jest.fn(() => ({ extension: true })),
}));

jest.mock('@codemirror/theme-one-dark', () => ({
  oneDark: { extension: true },
}));

jest.mock('codemirror', () => ({
  basicSetup: { extension: true },
})); 