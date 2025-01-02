# Fuse React Integration Migration Plan (Fully Prescriptive)

## 1. Analysis of Current State

### Chat App (Current Workspace)
- Next.js 13+ App Router based application in the project root
- Core functionality: AI Chat interface
- Directories: /app, /components, /hooks, /lib, plus config files
- Uses modern Next.js features (server components, server actions)

### Fuse React Skeleton
- “Fuse-React-v13.0.0-nextjs-skeleton”
- A minimal Fuse-based layout with “src/” folder
- Next.js 13+ structure, integrated with Fuse theming, layout, navigation

### Fuse React Demo
- “Fuse-React-v13.0.0-nextjs-demo”
- A full-featured example app
- We will selectively copy files from here into the skeleton if needed for advanced UI features

## 2. Migration Goals
1. Preserve Chat app functionality (no breakage).
2. Use Fuse layout/navigation for the Chat feature.
3. Merge all config files into one coherent environment.
4. Harmonize dependencies in a single package.json, favoring the Fuse skeleton’s versions.
5. End up with a predictable directory layout under “src/”.

## 3. Final Directory Layout Under Skeleton

After merging, the skeleton’s “src/” folder will look like this:

```
src/
  @fuse/            # Fuse core library (leave this untouched)   
  @auth/            # Auth config from skeleton or your app, if present
  @i18n/            # i18n config from skeleton or your app
  app/              # Next.js app router
    (control-panel)   # We place all control panel features here
      (chat)/         # Your Chat app’s pages, formerly in /app
      ...other routes from Chat app as needed
    api/              # API routes (if your Chat uses them)
    layout.tsx        # Possibly the top-level or other layout
    page.tsx          # Possibly a home page if you want
  components/
    shared/         # Shared UI components (if we discover any in your app)
    chat/           # Chat-specific components from /components
  hooks/            # All React hooks from /hooks
  store/            # App-wide state (if you have a Redux or Zustand store)
  utils/            # Utility functions from /lib
  configs/          # Merged config files from Chat app + skeleton
  styles/           # If you have a /styles folder, put it here
```

## 4. Merging package.json & Dependencies

1. Open both:
   - <root>/package.json (your current Chat app)
   - <fuse-skeleton>/package.json
2. For overlapping dependencies (e.g., next, react, typescript, eslint, tailwindcss), keep the Fuse skeleton’s version.  
3. Add any missing or unique dependencies from your Chat app to the skeleton’s package.json.  
4. Copy any scripts from your Chat app (e.g., "test", "lint", "dev:local") into the skeleton’s. Rename or unify them if needed.  
5. Remove or rename your old package.json (e.g., package.old.json) in the original root.  
6. Run “npm install” or “yarn install” in the skeleton folder to confirm no version conflicts.  

## 5. Exact File Moves from Root → Skeleton

Below is how we map each root folder to the skeleton. We assume you want your Chat routes in “(control-panel)/(chat)”. If you see a /styles or /store in your Chat app, we’ll place them accordingly:

- /app --> src/app/(control-panel)/(chat)  
  - If there’s an existing Next.js setup with index routes, copy them here.  
- /components --> src/components/chat  
  - If you have something obviously “shared” (like a “Modal” or “Button” used by multiple features), move that into src/components/shared.  
- /hooks --> src/hooks  
- /lib --> src/utils  
- /styles (if it exists) --> src/styles  
- All config files (tailwind.config.js, next.config.js, tsconfig.json, etc.) --> either root level (like tailwind.config.js, next.config.js) or inside src/configs if it’s strictly used by the code.  
- .env.* (if any) --> keep them in the new skeleton’s root.  

## 6. Automatic Migration Script

We’ll create “tools/migrate-chat.sh” in your skeleton folder. Update paths as needed (for example, if your original Chat code is in “../OriginalChatApp”). The script does:

1. Moves the entire /app → src/app/(control-panel)/(chat).  
2. Moves /components → src/components/chat.  
3. Moves /hooks and /lib similarly.  
4. Optionally moves /styles if present.  
5. Copies config files.  
6. Runs sed to update import statements.  

Below is a near-complete script. Validate the “RELATIVE_PATH_TO_OLD_APP” so it points to your current Chat project.

```bash:tools/migrate-chat.sh
#!/usr/bin/env bash

################################################################################
# 0) Initial path checks
################################################################################
if [ ! -d "src" ]; then
  echo "Error: Run this script from the Fuse skeleton folder (where 'src' exists)."
  exit 1
fi

RELATIVE_PATH_TO_OLD_APP="../OriginalChatApp" 
# Adjust if your old Chat code is in another location

################################################################################
# 1) Move /app => src/app/(control-panel)/(chat)
################################################################################
mkdir -p src/app/(control-panel)/(chat)
if [ -d "$RELATIVE_PATH_TO_OLD_APP/app" ]; then
  mv "$RELATIVE_PATH_TO_OLD_APP/app/"* src/app/(control-panel)/(chat)/
  echo "Moved /app into src/app/(control-panel)/(chat)."
else
  echo "No /app directory found at $RELATIVE_PATH_TO_OLD_APP."
fi

################################################################################
# 2) Move /components => src/components/chat
################################################################################
mkdir -p src/components/chat
if [ -d "$RELATIVE_PATH_TO_OLD_APP/components" ]; then
  mv "$RELATIVE_PATH_TO_OLD_APP/components/"* src/components/chat/
  echo "Moved /components into src/components/chat."
else
  echo "No /components directory found at $RELATIVE_PATH_TO_OLD_APP."
fi

################################################################################
# 3) Move /hooks => src/hooks
################################################################################
mkdir -p src/hooks
if [ -d "$RELATIVE_PATH_TO_OLD_APP/hooks" ]; then
  mv "$RELATIVE_PATH_TO_OLD_APP/hooks/"* src/hooks/
  echo "Moved /hooks into src/hooks."
fi

################################################################################
# 4) Move /lib => src/utils (or keep it as src/lib if you prefer)
################################################################################
mkdir -p src/utils
if [ -d "$RELATIVE_PATH_TO_OLD_APP/lib" ]; then
  mv "$RELATIVE_PATH_TO_OLD_APP/lib/"* src/utils/
  echo "Moved /lib into src/utils."
fi

################################################################################
# 5) Move /styles => src/styles (if present)
################################################################################
if [ -d "$RELATIVE_PATH_TO_OLD_APP/styles" ]; then
  mkdir -p src/styles
  mv "$RELATIVE_PATH_TO_OLD_APP/styles/"* src/styles/
  echo "Moved /styles into src/styles."
fi

################################################################################
# 6) Move config files => unify at skeleton root or /src/configs
################################################################################
# Example for tailwind.config.js, next.config.js, etc.
# Because these typically belong in the root with Next.js:
for cf in tailwind.config.js next.config.js tsconfig.json; do
  if [ -f "$RELATIVE_PATH_TO_OLD_APP/$cf" ]; then
    echo "Moving $cf to the skeleton root (overwrites if it exists)."
    mv "$RELATIVE_PATH_TO_OLD_APP/$cf" "./"
  fi
done

################################################################################
# 7) Move .env files if present => skeleton root
################################################################################
for envfile in .env .env.local .env.production .env.development; do
  if [ -f "$RELATIVE_PATH_TO_OLD_APP/$envfile" ]; then
    echo "Moving $envfile to skeleton root."
    mv "$RELATIVE_PATH_TO_OLD_APP/$envfile" "./$envfile"
  fi
done

################################################################################
# 8) Rewrite import paths with sed
################################################################################
# This section adjusts your code to reflect new paths. 
# We'll demonstrate a few common replacements. 
# You may need to add more depending on how your imports are structured.

# If your code used `import something from '@/app/...`, 
# then we might need to rewrite these references to '@/app/(control-panel)/(chat)'
grep -rl "from '@/app/" src | xargs sed -i '' "s|from '@/app/|from '@/app/(control-panel)/(chat)/|g"

# If your code used `import Something from '@/components/...` for Chat stuff, 
# rewrite to '@/components/chat/...'
grep -rl "from '@/components/" src | xargs sed -i '' "s|from '@/components/|from '@/components/chat/|g"

# If your code used `import Something from '@/hooks/'`,
# we can keep that the same if we plan to keep the alias as @/hooks
# (No rewrite needed unless your code references a now-nonexistent path)

# If your code used `import Something from '@/lib/'`,
# rewrite it to `import Something from '@/utils/`
grep -rl "from '@/lib/" src | xargs sed -i '' "s|from '@/lib/|from '@/utils/|g"

# If your code used `import Something from '@/styles/'`,
# rewrite it to `import Something from '@/styles/`
# (No rename needed unless you changed the folder name or alias)

echo "Sed-based import rewriting complete."

################################################################################
# 9) Final message
################################################################################
echo "Migration script is done. Please review changes, then run 'npm install' or 'yarn' and test."

exit 0
```

Notes on imports:  
• We included the most common rewrites. You may need to add more if your code references “@/components/shared” or other special paths.  
• If your existing code uses purely relative imports (“../../../lib/xyz”), you may prefer your editor’s “auto import correction” or a more advanced script.  

## 7. Post-Migration Verification
1. From your skeleton folder, run “npm install” or “yarn” if you haven’t yet.  
2. Try “npm run dev” or “yarn dev.”  
3. Check that “/(control-panel)/chat” loads your Chat page.  
4. Inspect your imports. If you see fallback errors (e.g., “Cannot find module …”), do a quick grep to see what path wasn’t updated.  
5. Merge or fix any leftover config duplication.  

## 8. Fuse Layout & Navigation
- In “src/@fuse/navigation” (or near where the skeleton config is), add an item linking to the “/(control-panel)/chat” route with an icon, e.g.:

```typescript
const navigationConfig = [
  {
    id: 'chat',
    title: 'Chat',
    type: 'item',
    icon: 'chat',
    url: '/control-panel/chat',
  },
];

export default navigationConfig;
```

- Adjust layout: If your code references a “layout” in “/app/(control-panel)/layout.tsx,” ensure you wrap Chat pages with `<FuseLayout>` or the appropriate Fuse component.  

## 9. Next Steps
1. Test thoroughly with your existing unit & integration tests.  
2. Slowly bring in advanced demo features if you want (e.g., more Material UI components from “Fuse-React-v13.0.0-nextjs-demo”).  
3. Keep commits small and descriptive so you can revert if needed. 