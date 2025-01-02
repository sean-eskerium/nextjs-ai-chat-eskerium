import { Chat } from '@/components/chat';
import { Block } from '@/components/block';
import { Editor } from '@/components/editor';
import { DocumentToolResult, DocumentToolCall } from '@/components/document';
import { AppSidebar } from '@/components/app-sidebar';
import { Markdown } from '@/components/markdown';
import { isValidElement } from 'react';

describe('Component Import Tests', () => {
  describe('Core Components', () => {
    it('loads Chat and related components', () => {
      expect(Chat).toBeDefined();
      expect(() => <Chat id="test" initialMessages={[]} selectedModelId="test" selectedVisibilityType="private" isReadonly={false} />).not.toThrow();
    });

    it('loads Block-related components', () => {
      expect(Block).toBeDefined();
      expect(() => <Block 
        chatId="test"
        input=""
        setInput={() => {}}
        isLoading={false}
        stop={() => {}}
        attachments={[]}
        setAttachments={() => {}}
        messages={[]}
        setMessages={() => {}}
        votes={[]}
        append={async () => null}
        handleSubmit={() => {}}
        reload={async () => null}
        isReadonly={false}
      />).not.toThrow();
    });
  });

  describe('UI Components', () => {
    it('loads editor components', () => {
      expect(Editor).toBeDefined();
      expect(() => <Editor 
        content=""
        saveContent={() => {}}
        status="idle"
        isCurrentVersion={true}
        currentVersionIndex={0}
        suggestions={[]}
      />).not.toThrow();
    });

    it('loads document components', () => {
      expect(DocumentToolResult).toBeDefined();
      expect(() => <DocumentToolResult 
        type="create" 
        result={{ id: "test", title: "test", kind: "text" }} 
        isReadonly={false} 
      />).not.toThrow();
      expect(DocumentToolCall).toBeDefined();
      expect(() => <DocumentToolCall 
        type="create" 
        args={{ title: "test" }} 
        isReadonly={false} 
      />).not.toThrow();
    });

    it('loads sidebar components', () => {
      expect(AppSidebar).toBeDefined();
      expect(() => <AppSidebar user={undefined} />).not.toThrow();
    });
  });

  describe('Utility Components', () => {
    it('loads utility components', () => {
      expect(Markdown).toBeDefined();
      expect(() => <Markdown>test</Markdown>).not.toThrow();
    });
  });
}); 