import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';

// Mock functions
export const mockUpdateListener = jest.fn();
export const mockEditorView = {
  destroy: jest.fn(),
  dispatch: jest.fn(),
  state: {
    doc: {
      toString: () => 'mock content',
    },
  },
  setState: jest.fn(),
};

// Create a mock constructor function
export const MockEditorViewConstructor = jest.fn(() => mockEditorView);

// Add static properties
Object.defineProperty(MockEditorViewConstructor, 'updateListener', {
  value: {
    of: (fn: any) => {
      mockUpdateListener.mockImplementation(fn);
      return { extension: true };
    },
  },
  writable: true,
}); 