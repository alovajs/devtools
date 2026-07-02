// @ts-nocheck
import * as __fd_glob_34 from "../content/docs/plugin-system/builtin-plugins/tag-modifier.mdx?collection=docs"
import * as __fd_glob_33 from "../content/docs/plugin-system/builtin-plugins/rename.mdx?collection=docs"
import * as __fd_glob_32 from "../content/docs/plugin-system/builtin-plugins/platform.mdx?collection=docs"
import * as __fd_glob_31 from "../content/docs/plugin-system/builtin-plugins/payload-modifier.mdx?collection=docs"
import * as __fd_glob_30 from "../content/docs/plugin-system/builtin-plugins/index.mdx?collection=docs"
import * as __fd_glob_29 from "../content/docs/plugin-system/builtin-plugins/import-type.mdx?collection=docs"
import * as __fd_glob_28 from "../content/docs/plugin-system/builtin-plugins/filter-api.mdx?collection=docs"
import * as __fd_glob_27 from "../content/docs/plugin-system/builtin-plugins/apifox.mdx?collection=docs"
import * as __fd_glob_26 from "../content/docs/plugin-system/builtin-plugins/aiDoc.mdx?collection=docs"
import * as __fd_glob_25 from "../content/docs/template-system/predefined-templates.mdx?collection=docs"
import * as __fd_glob_24 from "../content/docs/template-system/index.mdx?collection=docs"
import * as __fd_glob_23 from "../content/docs/template-system/custom-templates.mdx?collection=docs"
import * as __fd_glob_22 from "../content/docs/plugin-system/index.mdx?collection=docs"
import * as __fd_glob_21 from "../content/docs/plugin-system/examples.mdx?collection=docs"
import * as __fd_glob_20 from "../content/docs/plugin-system/custom-plugin.mdx?collection=docs"
import * as __fd_glob_19 from "../content/docs/guide/monorepo.mdx?collection=docs"
import * as __fd_glob_18 from "../content/docs/guide/installation-config.mdx?collection=docs"
import * as __fd_glob_17 from "../content/docs/guide/editor-docs.mdx?collection=docs"
import * as __fd_glob_16 from "../content/docs/api/plugin-api.mdx?collection=docs"
import * as __fd_glob_15 from "../content/docs/api/core-functions.mdx?collection=docs"
import * as __fd_glob_14 from "../content/docs/api/configuration.mdx?collection=docs"
import * as __fd_glob_13 from "../content/docs/ai-skills/skill-structure.mdx?collection=docs"
import * as __fd_glob_12 from "../content/docs/ai-skills/index.mdx?collection=docs"
import * as __fd_glob_11 from "../content/docs/quick-start.mdx?collection=docs"
import * as __fd_glob_10 from "../content/docs/performance.mdx?collection=docs"
import * as __fd_glob_9 from "../content/docs/migration.mdx?collection=docs"
import * as __fd_glob_8 from "../content/docs/index.mdx?collection=docs"
import * as __fd_glob_7 from "../content/docs/cli-commands.mdx?collection=docs"
import { default as __fd_glob_6 } from "../content/docs/plugin-system/builtin-plugins/meta.json?collection=docs"
import { default as __fd_glob_5 } from "../content/docs/template-system/meta.json?collection=docs"
import { default as __fd_glob_4 } from "../content/docs/plugin-system/meta.json?collection=docs"
import { default as __fd_glob_3 } from "../content/docs/guide/meta.json?collection=docs"
import { default as __fd_glob_2 } from "../content/docs/api/meta.json?collection=docs"
import { default as __fd_glob_1 } from "../content/docs/ai-skills/meta.json?collection=docs"
import { default as __fd_glob_0 } from "../content/docs/meta.json?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>({"doc":{"passthroughs":["extractedReferences"]}});

export const docs = await create.docs("docs", "content/docs", {"meta.json": __fd_glob_0, "ai-skills/meta.json": __fd_glob_1, "api/meta.json": __fd_glob_2, "guide/meta.json": __fd_glob_3, "plugin-system/meta.json": __fd_glob_4, "template-system/meta.json": __fd_glob_5, "plugin-system/builtin-plugins/meta.json": __fd_glob_6, }, {"cli-commands.mdx": __fd_glob_7, "index.mdx": __fd_glob_8, "migration.mdx": __fd_glob_9, "performance.mdx": __fd_glob_10, "quick-start.mdx": __fd_glob_11, "ai-skills/index.mdx": __fd_glob_12, "ai-skills/skill-structure.mdx": __fd_glob_13, "api/configuration.mdx": __fd_glob_14, "api/core-functions.mdx": __fd_glob_15, "api/plugin-api.mdx": __fd_glob_16, "guide/editor-docs.mdx": __fd_glob_17, "guide/installation-config.mdx": __fd_glob_18, "guide/monorepo.mdx": __fd_glob_19, "plugin-system/custom-plugin.mdx": __fd_glob_20, "plugin-system/examples.mdx": __fd_glob_21, "plugin-system/index.mdx": __fd_glob_22, "template-system/custom-templates.mdx": __fd_glob_23, "template-system/index.mdx": __fd_glob_24, "template-system/predefined-templates.mdx": __fd_glob_25, "plugin-system/builtin-plugins/aiDoc.mdx": __fd_glob_26, "plugin-system/builtin-plugins/apifox.mdx": __fd_glob_27, "plugin-system/builtin-plugins/filter-api.mdx": __fd_glob_28, "plugin-system/builtin-plugins/import-type.mdx": __fd_glob_29, "plugin-system/builtin-plugins/index.mdx": __fd_glob_30, "plugin-system/builtin-plugins/payload-modifier.mdx": __fd_glob_31, "plugin-system/builtin-plugins/platform.mdx": __fd_glob_32, "plugin-system/builtin-plugins/rename.mdx": __fd_glob_33, "plugin-system/builtin-plugins/tag-modifier.mdx": __fd_glob_34, });