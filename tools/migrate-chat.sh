#!/usr/bin/env bash

# 1) Move /app -> src/app/(chat) (or (control-panel)/(chat))
mkdir -p src/app/(chat)
mv ../OriginalChatApp/app/* src/app/(chat)

# 2) Move /components -> src/components/chat
mkdir -p src/components/chat
mv ../OriginalChatApp/components/* src/components/chat

# 2a) If you have "shared" subfolders, move them:
# mkdir -p src/components/shared
# mv ../OriginalChatApp/components/{SharedStuff} src/components/shared

# 3) Move /hooks -> src/hooks
mkdir -p src/hooks
mv ../OriginalChatApp/hooks/* src/hooks

# 4) Move /lib -> src/utils (or src/lib, your preference)
mkdir -p src/utils
mv ../OriginalChatApp/lib/* src/utils

# 5) Migrate other config files manually or as needed
# e.g. cp ../OriginalChatApp/tailwind.config.js ./tailwind.config.js 
# then unify changes with the skeleton’s version.

# 6) Use a find/replace approach to fix import paths:
# For example, if your original app used `import xyz from '@/components/stuff'` 
# you might need to change all instances from '@/components' -> '@/components/chat'
# Or if you had top-level: 'import from "@/hooks"' -> now 'import from "@/hooks"'
# Possibly also rewrite any references to /app -> /src/app or (chat) segment.
# We'll illustrate a possible find/replace with sed or a Node script.

# Example sed usage (Mac/BSD):
# grep -rl "from '@/components/" src | xargs sed -i '' "s/from '@/components\//from '@\/components\/chat\//g"
# This would replace all references to '@/components/...'
# with '@/components/chat/...'

echo "Migration script complete! Next step: Verify, fix or remove extraneous references." 