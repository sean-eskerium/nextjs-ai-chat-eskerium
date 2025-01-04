# AI Chat Integration with Fuse React - Migration Plan

## 1. Complete File Mapping

### App Directory Structure
```
Current → Target

/app/layout.tsx → /src/app/(control-panel)/(chat)/layout.tsx
/app/(chat)/**/* → /src/app/(control-panel)/(chat)/**/*
/app/(auth)/**/* → /src/app/(auth)/**/*
/app/globals.css → /src/styles/chat-globals.css

# Components
/components/ui/* → /src/components/shared/ui/*
/components/chat.tsx → /src/app/(control-panel)/(chat)/components/ChatContainer.tsx
/components/chat-header.tsx → /src/app/(control-panel)/(chat)/components/ChatHeader.tsx
/components/block.tsx → /src/app/(control-panel)/(chat)/components/Block.tsx
/components/console.tsx → /src/app/(control-panel)/(chat)/components/Console.tsx
/components/version-footer.tsx → /src/app/(control-panel)/(chat)/components/VersionFooter.tsx
/components/weather.tsx → /src/app/(control-panel)/(chat)/components/Weather.tsx
/components/icons.tsx → /src/components/shared/icons.tsx
/components/markdown.tsx → /src/app/(control-panel)/(chat)/components/Markdown.tsx
/components/message-actions.tsx → /src/app/(control-panel)/(chat)/components/MessageActions.tsx
/components/multimodal-input.tsx → /src/app/(control-panel)/(chat)/components/MultimodalInput.tsx
/components/visibility-selector.tsx → /src/app/(control-panel)/(chat)/components/VisibilitySelector.tsx
/components/toolbar.tsx → /src/app/(control-panel)/(chat)/components/Toolbar.tsx
/components/app-sidebar.tsx → /src/app/(control-panel)/(chat)/components/AppSidebar.tsx
/components/model-selector.tsx → /src/app/(control-panel)/(chat)/components/ModelSelector.tsx
/components/code-block.tsx → /src/app/(control-panel)/(chat)/components/CodeBlock.tsx
/components/message.tsx → /src/app/(control-panel)/(chat)/components/Message.tsx
/components/messages.tsx → /src/app/(control-panel)/(chat)/components/Messages.tsx
/components/sidebar-history.tsx → /src/app/(control-panel)/(chat)/components/SidebarHistory.tsx
/components/document.tsx → /src/app/(control-panel)/(chat)/components/Document.tsx
/components/editor.tsx → /src/app/(control-panel)/(chat)/components/Editor.tsx

# Library Files
/lib/db/**/* → /src/lib/db/**/*
/lib/editor/**/* → /src/lib/editor/**/*
/lib/ai/**/* → /src/lib/ai/**/*
/lib/utils.ts → /src/lib/utils/chat.ts

# Hooks
/hooks/**/* → /src/hooks/chat/**/*

# Config Files
/next.config.mjs → Merge into fuse-skeleton/next.config.mjs
/tailwind.config.ts → Merge into fuse-skeleton/tailwind.config.js
/drizzle.config.ts → /src/lib/db/drizzle.config.ts
/middleware.ts → Merge into fuse-skeleton/src/middleware.ts

# Types
/types/**/* → /src/types/**/*

# Tests
/__tests__/**/* → /src/__tests__/chat/**/*
/jest.config.ts → Merge into fuse-skeleton/jest.config.ts

# Public Assets
/public/**/* → /src/public/assets/chat/**/*
```

### Database Schema Integration
```typescript
// src/lib/db/schema.ts
import { chat, message, vote } from './models/chat'
import { user } from './models/user'

export {
  chat,
  message,
  vote,
  user
}
```

### Navigation Integration
```typescript
// src/@fuse/navigation/navigation.ts
export const navigationConfig = {
  // ... existing items
  {
    id: 'chat',
    title: 'AI Chat',
    type: 'item',
    icon: 'heroicons-outline:chat',
    url: '/control-panel/chat',
    auth: ['admin', 'user']  // Match with your auth roles
  }
}
```

## 2. Migration Process

### Phase 1: Core Setup
1. Create new repository from Fuse skeleton
2. Set up directory structure as above
3. Copy core configuration files
4. Set up database schema

### Phase 2: Component Migration
1. Move all components following the mapping above
2. Update import paths
3. Integrate with Fuse theming
4. Test each component in isolation

### Phase 3: Feature Integration
1. Set up authentication
2. Integrate API routes
3. Set up database connections
4. Test core functionality

### Phase 4: UI/UX Integration
1. Implement Fuse navigation
2. Style consistency updates
3. Responsive design testing
4. Cross-browser testing

## 3. Testing Strategy

### Unit Tests
- Migrate all existing tests
- Update import paths
- Add new integration tests

### Integration Tests
- Test chat within Fuse layout
- Test authentication flow
- Test API routes

### E2E Tests
- Full chat workflow
- Authentication flows
- Navigation integration

## 4. Deployment Steps

1. **Database Migration**
   - Backup existing data
   - Run schema migrations
   - Verify data integrity

2. **Application Deployment**
   - Build production bundle
   - Deploy to staging
   - Verify all features
   - Deploy to production

## 5. Post-Migration Tasks

1. **Cleanup**
   - Remove unused code
   - Update documentation
   - Update environment variables

2. **Monitoring**
   - Set up error tracking
   - Monitor performance
   - Set up alerts

## Notes
- Keep component names consistent with Fuse conventions
- Use Fuse's theme system
- Maintain chat app's core functionality
- Follow Fuse's coding standards 