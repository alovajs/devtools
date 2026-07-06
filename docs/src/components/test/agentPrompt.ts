const PREDEFINED_CLIENTS = ['alova', 'axios', 'fetch', 'ky'] as const

export const AGENT_PROMPT = `Install the worma-guidelines skill and the worma npm package, then configure worma for this project.

**Step 1: Install**
\`\`\`bash
npx skills add alovajs/skills --skill worma-guidelines
npm i wormajs -D
\`\`\`

**Step 2: Detect HTTP client**
Check \`package.json\` for an already installed HTTP client among: ${PREDEFINED_CLIENTS.join(', ')}.
- If found, use that client's worma template (e.g. axios → \`axios()\`, fetch → \`fetch()\`).
- If none found, install alova (\`npm i alova\`) and default to the \`alova()\` template.

**Step 3: Ask the user for their API setup**
Before configuring, ask:
- What is the OpenAPI data source URL?
- Which platform or source type are they using?
  - Swagger / Knife4j / FastAPI → use the \`platform()\` plugin
  - Apifox → use the \`apifox()\` plugin (needs projectId and apifoxToken)
  - Direct OpenAPI file URL → use \`input\` directly

**Step 4: Initialize config**
Run \`npx worma init -T <template>\` with the template detected in Step 2. This auto-detects the project type and generates a config pre-configured for that HTTP client.
Then modify the generated config to:
- Add the appropriate data source plugin from Step 3
- Add \`aiDoc()\` to generate AI Skill docs

Example: \`npx worma init -T axios\` for an axios project, then add \`platform('swagger')\` and \`aiDoc()\`.

Result for a TypeScript project using axios + Swagger:
\`\`\`ts
import { defineConfig } from 'wormajs';
import { axios, aiDoc, platform } from 'wormajs/plugin';

export default defineConfig({
  generator: [{
    input: '<user-provided-url>',
    output: 'src/api',
    plugins: [platform('swagger'), axios(), aiDoc()],
  }],
});
\`\`\`

**Step 5: Run generation**
\`npx worma gen\`

This will produce API calling code, TypeScript types, and AI Skill docs for the project.`

export const COPY_TOAST_MESSAGE = '已复制提示词，请直接发送给agent'
