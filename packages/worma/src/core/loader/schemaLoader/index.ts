import type { GeneratorOptions } from '../astLoader/generates'
import type { ParserOptions } from '../astLoader/parsers'
import type { AST, CommentType, Loader, MaybeSchemaObject, OpenAPIDocument } from '@/type'
import { astLoader } from '../astLoader'
import { getValue } from '../astLoader/generates'
import normalizer from '../astLoader/normalize'
import { astParse } from '../astLoader/parsers'

export interface Schema2TypeOptions {
  deep?: boolean // Whether to parse recursively
  shallowDeep?: boolean // Only the outermost layer is analytic
  commentType?: CommentType // Comment style
  preText?: string // annotation prefix
  defaultRequire?: boolean // If there is no nullbale or require, the default is require.
  noEnum?: boolean
}
export interface SchemaLoaderOptions extends Schema2TypeOptions {
  document: OpenAPIDocument
  refNameMap?: Map<string, string>
  onReference?: (ast: AST) => void
}

/**
 * P0: WeakMap cache for normalized schema.
 *  The normalizer clones + transforms the schema (expensive), but the result
 *  is independent of commentType/onReference. Caching by schema identity avoids
 *  repeated normalization of shared schemas across APIs.
 */
const normalizeCache = new WeakMap<object, MaybeSchemaObject>()

export class SchemaLoader implements Loader<MaybeSchemaObject, Promise<string>, SchemaLoaderOptions> {
  name = 'schemaLoader'

  /** Normalize schema once, with WeakMap caching for repeated identical objects. */
  private normalizeSchema(schemaOrigin: MaybeSchemaObject): MaybeSchemaObject {
    const key = schemaOrigin as object
    if (normalizeCache.has(key)) {
      return normalizeCache.get(key)!
    }
    const normalized = normalizer.normalize(schemaOrigin)
    normalizeCache.set(key, normalized)
    return normalized
  }

  /** Parse schema to AST: normalize + parse. Uses normalization cache internally. */
  private parseSchema(schemaOrigin: MaybeSchemaObject, parserOptions: ParserOptions): AST {
    const normalized = this.normalizeSchema(schemaOrigin)
    return astParse(normalized, parserOptions)
  }

  /** Single-output: schema → TS string (backward compatible). */
  async transform(schemaOrigin: MaybeSchemaObject, options: SchemaLoaderOptions): Promise<string>
  /**
   * P0 dual-output: normalize schema once → parse twice → produce type + comment.
   *  Two AST parses needed because commentType affects getCommentBySchema:
   *  'doc' transforms [title] etc., 'line' preserves raw markers.
   */
  async transform(
    schemaOrigin: MaybeSchemaObject,
    typeOptions: SchemaLoaderOptions,
    commentOptions?: SchemaLoaderOptions,
  ): Promise<{ type: string, comment?: string }>
  async transform(
    schemaOrigin: MaybeSchemaObject,
    typeOptionsOrOptions: SchemaLoaderOptions,
    commentOptions?: SchemaLoaderOptions,
  ): Promise<string | { type: string, comment?: string }> {
    // Dual-output path: third argument present
    if (commentOptions !== undefined) {
      const typeOptions = typeOptionsOrOptions
      // Normalize once to save the clone+transform cost
      const normalized = this.normalizeSchema(schemaOrigin)

      // Parse for type: respects typeOptions.commentType (default 'doc' for marker transforms)
      const typeAst = astParse(normalized, {
        document: typeOptions.document,
        commentType: typeOptions.commentType ?? 'doc',
        defaultRequire: typeOptions.defaultRequire,
        refNameMap: typeOptions.refNameMap,
        onReference(ast) {
          typeOptions.onReference?.(ast)
        },
      })

      // Generate type output
      const typeOutput = await this.generateCode(typeAst, typeOptions)

      // Parse for comment: 'line' preserves raw markers, no onReference needed
      let commentOutput: string | undefined
      if (commentOptions) {
        const commentAst = astParse(normalized, {
          document: typeOptions.document,
          commentType: 'line',
          defaultRequire: typeOptions.defaultRequire,
        })
        commentOutput = await this.generateCode(commentAst, commentOptions)
      }

      return { type: typeOutput, comment: commentOutput }
    }

    // Single-output path: original behavior
    const options = typeOptionsOrOptions
    const ast = this.parseSchema(schemaOrigin, {
      document: options.document,
      commentType: options.commentType ?? 'line',
      defaultRequire: options.defaultRequire,
      refNameMap: options.refNameMap,
      onReference(ast) {
        options.onReference?.(ast)
      },
    })
    return this.generateCode(ast, options)
  }

  /** Generate TS code string from an AST node + options. */
  private async generateCode(ast: AST, options: SchemaLoaderOptions): Promise<string> {
    const genOptions: GeneratorOptions = {
      deep: options.deep,
      shallowDeep: options.shallowDeep,
      commentType: options.commentType ?? 'line',
      noEnum: options.noEnum,
    }
    const result = await astLoader.transform(ast, {
      ...genOptions,
      format: true,
    })
    const tsStrArr = getValue(result, {
      ...genOptions,
    })
      .trim()
      .split('\n')
    return tsStrArr.map((line, idx) => (idx ? options.preText : '') + line).join('\n')
  }
}

export const schemaLoader = new SchemaLoader()
