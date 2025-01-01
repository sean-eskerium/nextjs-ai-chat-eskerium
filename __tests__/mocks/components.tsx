import React from 'react';

// Mock Chat component
export function Chat({ id, initialMessages, selectedModelId, selectedVisibilityType, isReadonly }: any) {
  return (
    <div className="flex flex-col min-w-0 h-dvh" data-testid="chat-component">
      <div data-testid="chat-header"></div>
      <div data-testid="chat-messages"></div>
      <form className="flex mx-auto px-4" data-testid="chat-form"></form>
    </div>
  );
}

// Mock DataStreamHandler component
export function DataStreamHandler({ id }: { id: string }) {
  return <div data-testid="data-stream-handler"></div>;
}

// Mock AppSidebar component
export function AppSidebar({ user }: any) {
  return <div data-testid="app-sidebar"></div>;
}

// Mock SidebarProvider component
export function SidebarProvider({ children, defaultOpen }: any) {
  return <div data-testid="sidebar-provider">{children}</div>;
}

// Mock SidebarInset component
export function SidebarInset({ children }: any) {
  return <div data-testid="sidebar-inset">{children}</div>;
} 