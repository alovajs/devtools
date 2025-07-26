/// <reference types="vitest/config" />
import path from 'node:path'
import vscode from '@czhlin/vite-plugin-vscode'
import VueI18n from '@intlify/unplugin-vue-i18n/vite'
import Shiki from '@shikijs/markdown-it'
import { unheadVueComposablesImports } from '@unhead/vue'
import Vue from '@vitejs/plugin-vue'
import VueJsx from '@vitejs/plugin-vue-jsx'
import LinkAttributes from 'markdown-it-link-attributes'
import Unocss from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import Markdown from 'unplugin-vue-markdown/vite'
import { VueRouterAutoImports } from 'unplugin-vue-router'
import VueRouter from 'unplugin-vue-router/vite'
import { defineConfig } from 'vite'
import VueDevTools from 'vite-plugin-vue-devtools'
import Layouts from 'vite-plugin-vue-layouts'
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isVscode = mode === 'vscode'
  return {
    resolve: {
      alias: {
        '~/': `${path.resolve(__dirname, 'src')}/`,
        '@/': `${path.resolve(__dirname, 'ext')}/`,
      },
    },
    plugins: [
      // https://github.com/posva/unplugin-vue-router
      VueRouter({
        extensions: ['.vue', '.md'],
        dts: path.resolve(__dirname, 'src/typed-router.d.ts'),
      }),
      Vue({
        template: isVscode
          ? {
              compilerOptions: {
                isCustomElement: (tag: string) => tag.startsWith('vscode-'),
              },
            }
          : undefined,
        include: [/\.vue$/, /\.md$/],
      }),
      VueJsx(),

      // https://github.com/JohnCampionJr/vite-plugin-vue-layouts
      Layouts(),

      // https://github.com/antfu/unplugin-auto-import
      AutoImport({
        include: [/\.[jt]sx?$/, /\.vue$/, /\.vue\?vue/, /\.md$/],
        imports: [
          'vue',
          'vue-i18n',
          '@vueuse/core',
          unheadVueComposablesImports,
          VueRouterAutoImports,
          {
          // add any other imports you were relying on
            'vue-router/auto': ['useLink'],
          },
          {
            'naive-ui': [
              'useDialog',
              'useMessage',
              'useModal',
              'useNotification',
              'useLoadingBar',
            ],
          },
        ],
        dts: path.resolve(__dirname, 'src/auto-imports.d.ts'),
        dirs: [
          'src/composables',
          'src/stores',
        ],
        vueTemplate: true,
      }),

      // https://github.com/antfu/unplugin-vue-components
      Components({
      // allow auto load markdown components under `./src/components/`
        extensions: ['vue', 'md'],
        // allow auto import and register components used in markdown
        include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
        dts: path.resolve(__dirname, 'src/components.d.ts'),
        resolvers: [NaiveUiResolver()],
      }),

      // https://github.com/antfu/unocss
      // see uno.config.ts for config
      Unocss(),

      // https://github.com/unplugin/unplugin-vue-markdown
      // Don't need this? Try vitesse-lite: https://github.com/antfu/vitesse-lite
      Markdown({
        wrapperClasses: 'prose prose-sm m-auto text-left',
        headEnabled: true,
        async markdownItSetup(md) {
          md.use(LinkAttributes, {
            matcher: (link: string) => /^https?:\/\//.test(link),
            attrs: {
              target: '_blank',
              rel: 'noopener',
            },
          })
          md.use(await Shiki({
            defaultColor: false,
            themes: {
              light: 'vitesse-light',
              dark: 'vitesse-dark',
            },
          }))
        },
      }),

      // https://github.com/intlify/bundle-tools/tree/main/packages/unplugin-vue-i18n
      VueI18n({
        runtimeOnly: true,
        compositionOnly: true,
        fullInstall: true,
        include: [path.resolve(__dirname, 'locales/**')],
      }),

      // https://github.com/webfansplz/vite-plugin-vue-devtools
      VueDevTools(),

      // https://github.com/tomjs/vite-plugin-vscode
      isVscode && vscode({
        extension: { entry: 'ext/index.ts' },
        webview: {
          csp: `<meta http-equiv="Content-Security-Policy" content="default-src 'none';  img-src 'self' data: base64;style-src {{cspSource}} 'unsafe-inline'; script-src 'nonce-{{nonce}}' 'unsafe-eval';">`,
        },
      }),
    ],
    // https://github.com/vitest-dev/vitest
    test: {
      include: ['test/**/*.test.ts'],
      environment: 'jsdom',
    },
  }
})
