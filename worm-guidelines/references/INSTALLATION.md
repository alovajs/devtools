# Installation & Setup

→ Full guide: [Installation & Configuration](https://worma.js.org/docs/guide/installation-config.md)

## Install worma

```bash
npm i wormajs -D
```

## Initialize

```bash
npx worma init
npx worma init -T axios       # Template preset
npx worma init -t typescript  # Config file type
npx worma init -p ./pkg       # Specific directory
```

## Simplified Setup (.wormarc)

```
https://api.example.com/v1/openapi.json
admin=https://api.admin.com/openapi.json, axios
```

## Install Skill for AI Agents

```bash
npx skills add alovajs/skills --skill worma-guidelines
```

## VSCode Extension

Search "worma" in the VSCode marketplace.
→ [Editor Documentation](https://worma.js.org/docs/guide/editor-docs.md)
