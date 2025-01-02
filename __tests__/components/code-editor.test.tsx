import { render, screen } from '@testing-library/react';
import { CodeEditor } from '@/components/code-editor';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';

describe('CodeEditor', () => {
  const defaultProps = {
    content: 'test content',
    saveContent: jest.fn(),
    status: 'idle' as const,
    isCurrentVersion: true,
    currentVersionIndex: 0,
    suggestions: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with initial content', () => {
    const createSpy = jest.spyOn(EditorState, 'create');
    const viewSpy = jest.spyOn(EditorView.prototype, 'destroy');
    
    render(<CodeEditor {...defaultProps} />);
    
    expect(createSpy).toHaveBeenCalled();
    expect(viewSpy).toBeDefined();
  });

  it('handles non-current version', () => {
    const createSpy = jest.spyOn(EditorState, 'create');
    
    render(<CodeEditor {...defaultProps} isCurrentVersion={false} />);
    
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        doc: 'test content',
      })
    );
  });

  it('cleans up editor on unmount', () => {
    const destroySpy = jest.spyOn(EditorView.prototype, 'destroy');
    const { unmount } = render(<CodeEditor {...defaultProps} />);
    
    unmount();
    expect(destroySpy).toHaveBeenCalled();
  });
}); 