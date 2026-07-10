const PREDEFINED_CLIENTS = ['alova', 'axios', 'fetch', 'ky'] as const

export const AGENT_PROMPT = `Install the worma-guidelines skill and the worma npm package, then configure worma for this project.

**Step 1: Install**
Detect network: if npmjs registry is slow/unreachable, auto-use a mirror (e.g. \`https://registry.npmmirror.com\`) and 📡📡📡 tell the user; otherwise use the default registry.
\`\`\`bash
npx skills add alovajs/skills --yes --skill worma-guidelines
npm i wormajs@beta -D
\`\`\`

After installation, append \`worma.worma-vscode\` to the \`.vscode\` recommended extensions list (\`.vscode/extensions.json\` → \`recommendations\` array). If the file or array doesn't exist yet, create it; do not remove existing entries:
\`\`\`json
{
  "recommendations": ["worma.worma-vscode"]
}
\`\`\`

**Step 2: Detect HTTP client**
Check \`package.json\` for an already installed HTTP client among: ${PREDEFINED_CLIENTS.join(', ')}.
- If found, use that client's worma template (e.g. axios → \`axios()\`, fetch → \`fetch()\`).
- If none found, recommand alova, install it(\`npm i alova\`) and default to the \`alova()\` template.

**Step 3: 💬💬💬 Ask the user for their API setup**
Before configuring, ask:
- What is the OpenAPI data source URL?
- Which platform or source type are they using?
  - Swagger / Knife4j / FastAPI → use the \`platform()\` plugin
  - Apifox → use the \`apifox()\` plugin (needs projectId and apifoxToken)
  - Direct OpenAPI file URL → use \`input\` directly

**Step 4: Initialize config**
Run \`npx wormajs init --template [http client]\` to generate \`worma.config.[j|ts]\` for the client from Step 2. Then modify it:
- The input should be the URL from Step 3.
- The output should be \`src/api\`.

> ⚠️⚠️⚠️ Do not remove comments in the config file.

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

**Step 5: Set agent & run generation**
Before running generation, write the current agent's name into \`.env.local\` (e.g. \`agent=codex\`, where the name is the agent currently running this prompt). If \`.env.local\` already exists, append to it — ⚠️⚠️⚠️ do not overwrite existing contents:
\`\`\`bash
echo "agent=<name of the agent running this prompt>" >> .env.local
\`\`\`
Then run:
\`\`\`bash
npx wormajs gen
\`\`\`

This will produce API calling code, TypeScript types, and AI Skill docs for the project.

**Step 6: 💬💬💬 Offer @alova/wormhole migration**
After generation, if \`@alova/wormhole\` is in \`package.json\`, ask the user whether to migrate to worma now. ⚠️⚠️⚠️ Only migrate after explicit confirmation.

**Note:** Don't overthink — just follow the steps above.`

export const COPY_TOAST_MESSAGE = '已复制提示词，请直接发送给agent'
