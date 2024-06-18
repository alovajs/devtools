/* tslint:disable */
/* eslint-disable */
/**
 * Swagger Generator - version 3.0.57
 *
 * This is an online swagger codegen server.  You can find out more at https://github.com/swagger-api/swagger-codegen or on [irc.freenode.net, #swagger](http://swagger.io/irc/).
 *
 * OpenAPI version: 3.0.1
 *
 *
 * NOTE: This file is auto generated by the alova's vscode plugin.
 *
 * https://alova.js.org/devtools/vscode
 *
 * **Do not edit the file manually.**
 */
import { Alova, AlovaMethodCreateConfig, Method } from 'alova';
import type { $$userConfigMap, alovaInstance } from '.';
import type apiDefinitions from './apiDefinitions';

type CollapsedAlova = typeof alovaInstance;
type UserMethodConfigMap = typeof $$userConfigMap;

type Alova2MethodConfig<
  Responded,
  T =
    | {
        [x: string]: any;
      }
    | undefined
> =
  CollapsedAlova extends Alova<any, any, infer RequestConfig, any, infer ResponseHeader>
    ? AlovaMethodCreateConfig<any, Responded, RequestConfig, ResponseHeader> & { params: T }
    : never;

// Extract the return type of transformData function that define in $$userConfigMap, if it not exists, use the default type.
type ExtractUserDefinedTransformed<
  DefinitionKey extends keyof typeof apiDefinitions,
  Default
> = DefinitionKey extends keyof UserMethodConfigMap
  ? UserMethodConfigMap[DefinitionKey]['transformData'] extends (...args: any[]) => any
    ? Awaited<ReturnType<UserMethodConfigMap[DefinitionKey]['transformData']>>
    : Default
  : Default;
type Alova2Method<
  Responded,
  DefinitionKey extends keyof typeof apiDefinitions,
  CurrentConfig extends Alova2MethodConfig<any>
> =
  CollapsedAlova extends Alova<infer State, infer Export, infer RequestConfig, infer Response, infer ResponseHeader>
    ? Method<
        State,
        Export,
        CurrentConfig extends undefined
          ? ExtractUserDefinedTransformed<DefinitionKey, Responded>
          : CurrentConfig['transformData'] extends (...args: any[]) => any
            ? Awaited<ReturnType<CurrentConfig['transformData']>>
            : ExtractUserDefinedTransformed<DefinitionKey, Responded>,
        any,
        RequestConfig,
        Response,
        ResponseHeader
      >
    : never;

export interface GenerationRequest {
  /**
   * language to generate (required)
   */
  lang: string;
  /**
   * spec in json format. . Alternative to `specURL`
   */
  spec?: {};
  /**
   * URL of the spec in json format. Alternative to `spec`
   */
  specURL?: string;
  /**
   * type of the spec
   */
  type?: 'CLIENT' | 'SERVER' | 'DOCUMENTATION' | 'CONFIG';
  /**
   * codegen version to use
   */
  codegenVersion?: 'V2' | 'V3';
  options?: Options;
}
export interface Options {
  /**
   * adds authorization headers when fetching the open api definitions remotely. Pass in a URL-encoded string of name:header with a comma separating multiple values
   */
  auth?: string;
  authorizationValue?: AuthorizationValue;
  /**
   * package for generated api classes
   */
  apiPackage?: string;
  /**
   * template version for generation
   */
  templateVersion?: string;
  /**
   * package for generated models
   */
  modelPackage?: string;
  /**
   * Prefix that will be prepended to all model names. Default is the empty string.
   */
  modelNamePrefix?: string;
  /**
   * PrefixSuffix that will be appended to all model names. Default is the empty string.
   */
  modelNameSuffix?: string;
  /**
   * sets specified system properties in key/value format
   */
  systemProperties?: {
    [k: string]: string;
  };
  /**
   * sets instantiation type mappings in key/value format. For example (in Java): array=ArrayList,map=HashMap. In other words array types will get instantiated as ArrayList in generated code.
   */
  instantiationTypes?: {
    [k: string]: string;
  };
  /**
   * sets mappings between swagger spec types and generated code types in key/value format. For example: array=List,map=Map,string=String.
   */
  typeMappings?: {
    [k: string]: string;
  };
  /**
   * sets additional properties that can be referenced by the mustache templates in key/value format.
   */
  additionalProperties?: {
    [k: string]: {};
  };
  /**
   * specifies additional language specific primitive types in the format of type1,type2,type3,type3. For example: String,boolean,Boolean,Double. You can also have multiple occurrences of this option.
   */
  languageSpecificPrimitives?: string[];
  /**
   * specifies mappings between a given class and the import that should be used for that class in key/value format.
   */
  importMappings?: {
    [k: string]: string;
  };
  /**
   * root package for generated code
   */
  invokerPackage?: string;
  /**
   * groupId in generated pom.xml
   */
  groupId?: string;
  /**
   * artifactId in generated pom.xml
   */
  artifactId?: string;
  /**
   * artifact version generated in pom.xml
   */
  artifactVersion?: string;
  /**
   * library template (sub-template)
   */
  library?: string;
  /**
   * Git user ID, e.g. swagger-api.
   */
  gitUserId?: string;
  /**
   * Git repo ID, e.g. swagger-codegen.
   */
  gitRepoId?: string;
  /**
   * Release note, default to 'Minor update'.
   */
  releaseNote?: string;
  /**
   * HTTP user agent, e.g. codegen_csharp_api_client, default to 'Swagger-Codegen/{packageVersion}}/{language}'
   */
  httpUserAgent?: string;
  /**
   * pecifies how a reserved name should be escaped to. Otherwise, the default _<name> is used. For example id=identifier.
   */
  reservedWordsMappings?: {
    [k: string]: string;
  };
  /**
   * Specifies an override location for the .swagger-codegen-ignore file. Most useful on initial generation.
   */
  ignoreFileOverride?: string;
  /**
   * Remove prefix of operationId, e.g. config_getId => getId
   */
  removeOperationIdPrefix?: boolean;
  skipOverride?: boolean;
}
/**
 * adds authorization headers when fetching the open api definitions remotely. Pass in an authorizationValue object
 */
export interface AuthorizationValue {
  /**
   * Authorization value
   */
  value?: string;
  /**
   * Authorization key
   */
  keyName?: string;
  /**
   * Authorization type
   */
  type?: 'query' | 'header';
}

/**
 * adds authorization headers when fetching the open api definitions remotely. Pass in an authorizationValue object
 */
export interface AuthorizationValue {
  /**
   * Authorization value
   */
  value?: string;
  /**
   * Authorization key
   */
  keyName?: string;
  /**
   * Authorization type
   */
  type?: 'query' | 'header';
}

export interface Options {
  /**
   * adds authorization headers when fetching the open api definitions remotely. Pass in a URL-encoded string of name:header with a comma separating multiple values
   */
  auth?: string;
  authorizationValue?: AuthorizationValue;
  /**
   * package for generated api classes
   */
  apiPackage?: string;
  /**
   * template version for generation
   */
  templateVersion?: string;
  /**
   * package for generated models
   */
  modelPackage?: string;
  /**
   * Prefix that will be prepended to all model names. Default is the empty string.
   */
  modelNamePrefix?: string;
  /**
   * PrefixSuffix that will be appended to all model names. Default is the empty string.
   */
  modelNameSuffix?: string;
  /**
   * sets specified system properties in key/value format
   */
  systemProperties?: {
    [k: string]: string;
  };
  /**
   * sets instantiation type mappings in key/value format. For example (in Java): array=ArrayList,map=HashMap. In other words array types will get instantiated as ArrayList in generated code.
   */
  instantiationTypes?: {
    [k: string]: string;
  };
  /**
   * sets mappings between swagger spec types and generated code types in key/value format. For example: array=List,map=Map,string=String.
   */
  typeMappings?: {
    [k: string]: string;
  };
  /**
   * sets additional properties that can be referenced by the mustache templates in key/value format.
   */
  additionalProperties?: {
    [k: string]: {};
  };
  /**
   * specifies additional language specific primitive types in the format of type1,type2,type3,type3. For example: String,boolean,Boolean,Double. You can also have multiple occurrences of this option.
   */
  languageSpecificPrimitives?: string[];
  /**
   * specifies mappings between a given class and the import that should be used for that class in key/value format.
   */
  importMappings?: {
    [k: string]: string;
  };
  /**
   * root package for generated code
   */
  invokerPackage?: string;
  /**
   * groupId in generated pom.xml
   */
  groupId?: string;
  /**
   * artifactId in generated pom.xml
   */
  artifactId?: string;
  /**
   * artifact version generated in pom.xml
   */
  artifactVersion?: string;
  /**
   * library template (sub-template)
   */
  library?: string;
  /**
   * Git user ID, e.g. swagger-api.
   */
  gitUserId?: string;
  /**
   * Git repo ID, e.g. swagger-codegen.
   */
  gitRepoId?: string;
  /**
   * Release note, default to 'Minor update'.
   */
  releaseNote?: string;
  /**
   * HTTP user agent, e.g. codegen_csharp_api_client, default to 'Swagger-Codegen/{packageVersion}}/{language}'
   */
  httpUserAgent?: string;
  /**
   * pecifies how a reserved name should be escaped to. Otherwise, the default _<name> is used. For example id=identifier.
   */
  reservedWordsMappings?: {
    [k: string]: string;
  };
  /**
   * Specifies an override location for the .swagger-codegen-ignore file. Most useful on initial generation.
   */
  ignoreFileOverride?: string;
  /**
   * Remove prefix of operationId, e.g. config_getId => getId
   */
  removeOperationIdPrefix?: boolean;
  skipOverride?: boolean;
}
/**
 * adds authorization headers when fetching the open api definitions remotely. Pass in an authorizationValue object
 */
export interface AuthorizationValue {
  /**
   * Authorization value
   */
  value?: string;
  /**
   * Authorization key
   */
  keyName?: string;
  /**
   * Authorization type
   */
  type?: 'query' | 'header';
}

export interface CliOption {
  optionName?: string;
  description?: string;
  /**
   * Data type is based on the types supported by the JSON-Schema
   */
  type?: string;
  enum?: {
    [k: string]: string;
  };
  default?: string;
}

export interface RenderRequest {
  /**
   * template as string
   */
  template: string;
  /**
   * context as string
   */
  context: string;
}

export interface RenderResponse {
  value: string;
}

export type Version = 'V2' | 'V3';

export type Type = 'client' | 'server' | 'documentation' | 'config';

export type Types = ('client' | 'server' | 'documentation' | 'config')[];

declare global {
  interface APIS {
    clients: {
      /**
       * ---
       *
       * [GET]Generates and download code. GenerationRequest input provided as JSON available at URL specified in parameter codegenOptionsURL.
       *
       * **path:** /generate
       *
       * ---
       *
       * **Query Parameters**
       * ```ts
       * interface QueryParameters {
       *   //
       *   // required: true
       *   codegenOptionsURL: string;
       * }
       * ```
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = any
       * ```
       *
       * ---
       */
      generateFromURL<Config extends Alova2MethodConfig<any>>(
        params: {
          codegenOptionsURL: string; //
        },
        config?: Alova2MethodConfig<any>
      ): Alova2Method<any, 'clients.generateFromURL', Config>;
      /**
       * ---
       *
       * [POST]Generates and download code. GenerationRequest input provided as request body.
       *
       * **path:** /generate
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = any
       * ```
       *
       * ---
       */
      generate<Config extends Alova2MethodConfig<any>>(
        params: {},
        config?: Alova2MethodConfig<any>
      ): Alova2Method<any, 'clients.generate', Config>;
      /**
       * ---
       *
       * [GET]Deprecated, use '/{type}/{version}' instead. List generator languages of type 'client' or 'documentation' for given codegen version (defaults to V3)
       *
       * **path:** /clients
       *
       * ---
       *
       * **Query Parameters**
       * ```ts
       * interface QueryParameters {
       *   // generator version used by codegen engine
       *   version?: Version;
       *   // flag to only return languages of type `client`
       *   clientOnly?: boolean;
       * }
       * ```
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = string[]
       * ```
       *
       * ---
       */
      clientLanguages<Config extends Alova2MethodConfig<string[]>>(
        params: {
          version?: Version; // generator version used by codegen engine
          clientOnly?: boolean; // flag to only return languages of type `client`
        },
        config?: Alova2MethodConfig<string[]>
      ): Alova2Method<string[], 'clients.clientLanguages', Config>;
      /**
       * ---
       *
       * [GET]List generator languages of the given type and version
       *
       * **path:** /{type}/{version}
       *
       * ---
       *
       * **Path Parameters**
       * ```ts
       * interface PathParameters {
       *   // generator type
       *   // required: true
       *   type: Type;
       *   // generator version used by codegen engine
       *   // required: true
       *   version: string;
       * }
       * ```
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = string[]
       * ```
       *
       * ---
       */
      languages<Config extends Alova2MethodConfig<string[]>>(
        params: {
          type: Type; // generator type
          version: string; // generator version used by codegen engine
        },
        config?: Alova2MethodConfig<string[]>
      ): Alova2Method<string[], 'clients.languages', Config>;
      /**
       * ---
       *
       * [GET]List generator languages of version defined in 'version parameter (defaults to V3) and type included in 'types' parameter; all languages
       *
       * **path:** /types
       *
       * ---
       *
       * **Query Parameters**
       * ```ts
       * interface QueryParameters {
       *   // comma-separated list of generator types
       *   // required: true
       *   types: Types;
       *   // generator version used by codegen engine
       *   version?: Version;
       * }
       * ```
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = string[]
       * ```
       *
       * ---
       */
      languagesMulti<Config extends Alova2MethodConfig<string[]>>(
        params: {
          types: Types; // comma-separated list of generator types
          version?: Version; // generator version used by codegen engine
        },
        config?: Alova2MethodConfig<string[]>
      ): Alova2Method<string[], 'clients.languagesMulti', Config>;
      /**
       * ---
       *
       * [GET]Returns options for a given language and version (defaults to V3)
       *
       * **path:** /options
       *
       * ---
       *
       * **Query Parameters**
       * ```ts
       * interface QueryParameters {
       *   // language
       *   language?: string;
       *   // generator version used by codegen engine
       *   version?: Version;
       * }
       * ```
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = object
       * ```
       *
       * ---
       */
      listOptions<Config extends Alova2MethodConfig<object>>(
        params: {
          language?: string; // language
          version?: Version; // generator version used by codegen engine
        },
        config?: Alova2MethodConfig<object>
      ): Alova2Method<object, 'clients.listOptions', Config>;
      /**
       * ---
       *
       * [POST]Generates the intermediate model ("bundle") and returns it as a JSON. body.
       *
       * **path:** /model
       *
       * ---
       *
       * **Response**
       * ```ts
       * interface Response {
       *   // language to generate (required)
       *   lang: string;
       *   // spec in json format. . Alternative to `specURL`
       *   spec: object;
       *   // URL of the spec in json format. Alternative to `spec`
       *   specURL: string;
       *   // type of the spec
       *   type: string;
       *   // codegen version to use
       *   codegenVersion: string;
       *   //
       *   options: ;
       * }
       * ```
       *
       * ---
       */
      generateBundle<Config extends Alova2MethodConfig<GenerationRequest>>(
        params: {},
        config?: Alova2MethodConfig<GenerationRequest>
      ): Alova2Method<GenerationRequest, 'clients.generateBundle', Config>;
    };
    servers: {
      /**
       * ---
       *
       * [GET]Generates and download code. GenerationRequest input provided as JSON available at URL specified in parameter codegenOptionsURL.
       *
       * **path:** /generate
       *
       * ---
       *
       * **Query Parameters**
       * ```ts
       * interface QueryParameters {
       *   //
       *   // required: true
       *   codegenOptionsURL: string;
       * }
       * ```
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = any
       * ```
       *
       * ---
       */
      generateFromURL<Config extends Alova2MethodConfig<any>>(
        params: {
          codegenOptionsURL: string; //
        },
        config?: Alova2MethodConfig<any>
      ): Alova2Method<any, 'servers.generateFromURL', Config>;
      /**
       * ---
       *
       * [POST]Generates and download code. GenerationRequest input provided as request body.
       *
       * **path:** /generate
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = any
       * ```
       *
       * ---
       */
      generate<Config extends Alova2MethodConfig<any>>(
        params: {},
        config?: Alova2MethodConfig<any>
      ): Alova2Method<any, 'servers.generate', Config>;
      /**
       * ---
       *
       * [GET]Deprecated, use '/{type}/{version}' instead. List generator languages of type 'server' for given codegen version (defaults to V3)
       *
       * **path:** /servers
       *
       * ---
       *
       * **Query Parameters**
       * ```ts
       * interface QueryParameters {
       *   // generator version used by codegen engine
       *   version?: Version;
       * }
       * ```
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = string[]
       * ```
       *
       * ---
       */
      serverLanguages<Config extends Alova2MethodConfig<string[]>>(
        params: {
          version?: Version; // generator version used by codegen engine
        },
        config?: Alova2MethodConfig<string[]>
      ): Alova2Method<string[], 'servers.serverLanguages', Config>;
      /**
       * ---
       *
       * [GET]List generator languages of the given type and version
       *
       * **path:** /{type}/{version}
       *
       * ---
       *
       * **Path Parameters**
       * ```ts
       * interface PathParameters {
       *   // generator type
       *   // required: true
       *   type: Type;
       *   // generator version used by codegen engine
       *   // required: true
       *   version: string;
       * }
       * ```
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = string[]
       * ```
       *
       * ---
       */
      languages<Config extends Alova2MethodConfig<string[]>>(
        params: {
          type: Type; // generator type
          version: string; // generator version used by codegen engine
        },
        config?: Alova2MethodConfig<string[]>
      ): Alova2Method<string[], 'servers.languages', Config>;
      /**
       * ---
       *
       * [GET]List generator languages of version defined in 'version parameter (defaults to V3) and type included in 'types' parameter; all languages
       *
       * **path:** /types
       *
       * ---
       *
       * **Query Parameters**
       * ```ts
       * interface QueryParameters {
       *   // comma-separated list of generator types
       *   // required: true
       *   types: Types;
       *   // generator version used by codegen engine
       *   version?: Version;
       * }
       * ```
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = string[]
       * ```
       *
       * ---
       */
      languagesMulti<Config extends Alova2MethodConfig<string[]>>(
        params: {
          types: Types; // comma-separated list of generator types
          version?: Version; // generator version used by codegen engine
        },
        config?: Alova2MethodConfig<string[]>
      ): Alova2Method<string[], 'servers.languagesMulti', Config>;
      /**
       * ---
       *
       * [GET]Returns options for a given language and version (defaults to V3)
       *
       * **path:** /options
       *
       * ---
       *
       * **Query Parameters**
       * ```ts
       * interface QueryParameters {
       *   // language
       *   language?: string;
       *   // generator version used by codegen engine
       *   version?: Version;
       * }
       * ```
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = object
       * ```
       *
       * ---
       */
      listOptions<Config extends Alova2MethodConfig<object>>(
        params: {
          language?: string; // language
          version?: Version; // generator version used by codegen engine
        },
        config?: Alova2MethodConfig<object>
      ): Alova2Method<object, 'servers.listOptions', Config>;
      /**
       * ---
       *
       * [POST]Generates the intermediate model ("bundle") and returns it as a JSON. body.
       *
       * **path:** /model
       *
       * ---
       *
       * **Response**
       * ```ts
       * interface Response {
       *   // language to generate (required)
       *   lang: string;
       *   // spec in json format. . Alternative to `specURL`
       *   spec: object;
       *   // URL of the spec in json format. Alternative to `spec`
       *   specURL: string;
       *   // type of the spec
       *   type: string;
       *   // codegen version to use
       *   codegenVersion: string;
       *   //
       *   options: ;
       * }
       * ```
       *
       * ---
       */
      generateBundle<Config extends Alova2MethodConfig<GenerationRequest>>(
        params: {},
        config?: Alova2MethodConfig<GenerationRequest>
      ): Alova2Method<GenerationRequest, 'servers.generateBundle', Config>;
    };
    documentation: {
      /**
       * ---
       *
       * [GET]Generates and download code. GenerationRequest input provided as JSON available at URL specified in parameter codegenOptionsURL.
       *
       * **path:** /generate
       *
       * ---
       *
       * **Query Parameters**
       * ```ts
       * interface QueryParameters {
       *   //
       *   // required: true
       *   codegenOptionsURL: string;
       * }
       * ```
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = any
       * ```
       *
       * ---
       */
      generateFromURL<Config extends Alova2MethodConfig<any>>(
        params: {
          codegenOptionsURL: string; //
        },
        config?: Alova2MethodConfig<any>
      ): Alova2Method<any, 'documentation.generateFromURL', Config>;
      /**
       * ---
       *
       * [POST]Generates and download code. GenerationRequest input provided as request body.
       *
       * **path:** /generate
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = any
       * ```
       *
       * ---
       */
      generate<Config extends Alova2MethodConfig<any>>(
        params: {},
        config?: Alova2MethodConfig<any>
      ): Alova2Method<any, 'documentation.generate', Config>;
      /**
       * ---
       *
       * [GET]Deprecated, use '/{type}/{version}' instead. List generator languages of type 'client' or 'documentation' for given codegen version (defaults to V3)
       *
       * **path:** /clients
       *
       * ---
       *
       * **Query Parameters**
       * ```ts
       * interface QueryParameters {
       *   // generator version used by codegen engine
       *   version?: Version;
       *   // flag to only return languages of type `client`
       *   clientOnly?: boolean;
       * }
       * ```
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = string[]
       * ```
       *
       * ---
       */
      clientLanguages<Config extends Alova2MethodConfig<string[]>>(
        params: {
          version?: Version; // generator version used by codegen engine
          clientOnly?: boolean; // flag to only return languages of type `client`
        },
        config?: Alova2MethodConfig<string[]>
      ): Alova2Method<string[], 'documentation.clientLanguages', Config>;
      /**
       * ---
       *
       * [GET]Deprecated, use '/{type}/{version}' instead. List generator languages of type 'documentation' for given codegen version (defaults to V3)
       *
       * **path:** /documentation
       *
       * ---
       *
       * **Query Parameters**
       * ```ts
       * interface QueryParameters {
       *   // generator version used by codegen engine
       *   version?: Version;
       * }
       * ```
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = string[]
       * ```
       *
       * ---
       */
      documentationLanguages<Config extends Alova2MethodConfig<string[]>>(
        params: {
          version?: Version; // generator version used by codegen engine
        },
        config?: Alova2MethodConfig<string[]>
      ): Alova2Method<string[], 'documentation.documentationLanguages', Config>;
      /**
       * ---
       *
       * [GET]List generator languages of the given type and version
       *
       * **path:** /{type}/{version}
       *
       * ---
       *
       * **Path Parameters**
       * ```ts
       * interface PathParameters {
       *   // generator type
       *   // required: true
       *   type: Type;
       *   // generator version used by codegen engine
       *   // required: true
       *   version: string;
       * }
       * ```
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = string[]
       * ```
       *
       * ---
       */
      languages<Config extends Alova2MethodConfig<string[]>>(
        params: {
          type: Type; // generator type
          version: string; // generator version used by codegen engine
        },
        config?: Alova2MethodConfig<string[]>
      ): Alova2Method<string[], 'documentation.languages', Config>;
      /**
       * ---
       *
       * [GET]List generator languages of version defined in 'version parameter (defaults to V3) and type included in 'types' parameter; all languages
       *
       * **path:** /types
       *
       * ---
       *
       * **Query Parameters**
       * ```ts
       * interface QueryParameters {
       *   // comma-separated list of generator types
       *   // required: true
       *   types: Types;
       *   // generator version used by codegen engine
       *   version?: Version;
       * }
       * ```
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = string[]
       * ```
       *
       * ---
       */
      languagesMulti<Config extends Alova2MethodConfig<string[]>>(
        params: {
          types: Types; // comma-separated list of generator types
          version?: Version; // generator version used by codegen engine
        },
        config?: Alova2MethodConfig<string[]>
      ): Alova2Method<string[], 'documentation.languagesMulti', Config>;
      /**
       * ---
       *
       * [GET]Returns options for a given language and version (defaults to V3)
       *
       * **path:** /options
       *
       * ---
       *
       * **Query Parameters**
       * ```ts
       * interface QueryParameters {
       *   // language
       *   language?: string;
       *   // generator version used by codegen engine
       *   version?: Version;
       * }
       * ```
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = object
       * ```
       *
       * ---
       */
      listOptions<Config extends Alova2MethodConfig<object>>(
        params: {
          language?: string; // language
          version?: Version; // generator version used by codegen engine
        },
        config?: Alova2MethodConfig<object>
      ): Alova2Method<object, 'documentation.listOptions', Config>;
      /**
       * ---
       *
       * [POST]Generates the intermediate model ("bundle") and returns it as a JSON. body.
       *
       * **path:** /model
       *
       * ---
       *
       * **Response**
       * ```ts
       * interface Response {
       *   // language to generate (required)
       *   lang: string;
       *   // spec in json format. . Alternative to `specURL`
       *   spec: object;
       *   // URL of the spec in json format. Alternative to `spec`
       *   specURL: string;
       *   // type of the spec
       *   type: string;
       *   // codegen version to use
       *   codegenVersion: string;
       *   //
       *   options: ;
       * }
       * ```
       *
       * ---
       */
      generateBundle<Config extends Alova2MethodConfig<GenerationRequest>>(
        params: {},
        config?: Alova2MethodConfig<GenerationRequest>
      ): Alova2Method<GenerationRequest, 'documentation.generateBundle', Config>;
      /**
       * ---
       *
       * [POST]render a template using the provided data
       *
       * **path:** /render
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = any
       * ```
       *
       * ---
       */
      renderTemplate<Config extends Alova2MethodConfig<any>>(
        params: {},
        config?: Alova2MethodConfig<any>
      ): Alova2Method<any, 'documentation.renderTemplate', Config>;
    };
    config: {
      /**
       * ---
       *
       * [GET]Generates and download code. GenerationRequest input provided as JSON available at URL specified in parameter codegenOptionsURL.
       *
       * **path:** /generate
       *
       * ---
       *
       * **Query Parameters**
       * ```ts
       * interface QueryParameters {
       *   //
       *   // required: true
       *   codegenOptionsURL: string;
       * }
       * ```
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = any
       * ```
       *
       * ---
       */
      generateFromURL<Config extends Alova2MethodConfig<any>>(
        params: {
          codegenOptionsURL: string; //
        },
        config?: Alova2MethodConfig<any>
      ): Alova2Method<any, 'config.generateFromURL', Config>;
      /**
       * ---
       *
       * [POST]Generates and download code. GenerationRequest input provided as request body.
       *
       * **path:** /generate
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = any
       * ```
       *
       * ---
       */
      generate<Config extends Alova2MethodConfig<any>>(
        params: {},
        config?: Alova2MethodConfig<any>
      ): Alova2Method<any, 'config.generate', Config>;
      /**
       * ---
       *
       * [GET]List generator languages of the given type and version
       *
       * **path:** /{type}/{version}
       *
       * ---
       *
       * **Path Parameters**
       * ```ts
       * interface PathParameters {
       *   // generator type
       *   // required: true
       *   type: Type;
       *   // generator version used by codegen engine
       *   // required: true
       *   version: string;
       * }
       * ```
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = string[]
       * ```
       *
       * ---
       */
      languages<Config extends Alova2MethodConfig<string[]>>(
        params: {
          type: Type; // generator type
          version: string; // generator version used by codegen engine
        },
        config?: Alova2MethodConfig<string[]>
      ): Alova2Method<string[], 'config.languages', Config>;
      /**
       * ---
       *
       * [GET]List generator languages of version defined in 'version parameter (defaults to V3) and type included in 'types' parameter; all languages
       *
       * **path:** /types
       *
       * ---
       *
       * **Query Parameters**
       * ```ts
       * interface QueryParameters {
       *   // comma-separated list of generator types
       *   // required: true
       *   types: Types;
       *   // generator version used by codegen engine
       *   version?: Version;
       * }
       * ```
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = string[]
       * ```
       *
       * ---
       */
      languagesMulti<Config extends Alova2MethodConfig<string[]>>(
        params: {
          types: Types; // comma-separated list of generator types
          version?: Version; // generator version used by codegen engine
        },
        config?: Alova2MethodConfig<string[]>
      ): Alova2Method<string[], 'config.languagesMulti', Config>;
      /**
       * ---
       *
       * [GET]Returns options for a given language and version (defaults to V3)
       *
       * **path:** /options
       *
       * ---
       *
       * **Query Parameters**
       * ```ts
       * interface QueryParameters {
       *   // language
       *   language?: string;
       *   // generator version used by codegen engine
       *   version?: Version;
       * }
       * ```
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = object
       * ```
       *
       * ---
       */
      listOptions<Config extends Alova2MethodConfig<object>>(
        params: {
          language?: string; // language
          version?: Version; // generator version used by codegen engine
        },
        config?: Alova2MethodConfig<object>
      ): Alova2Method<object, 'config.listOptions', Config>;
      /**
       * ---
       *
       * [POST]Generates the intermediate model ("bundle") and returns it as a JSON. body.
       *
       * **path:** /model
       *
       * ---
       *
       * **Response**
       * ```ts
       * interface Response {
       *   // language to generate (required)
       *   lang: string;
       *   // spec in json format. . Alternative to `specURL`
       *   spec: object;
       *   // URL of the spec in json format. Alternative to `spec`
       *   specURL: string;
       *   // type of the spec
       *   type: string;
       *   // codegen version to use
       *   codegenVersion: string;
       *   //
       *   options: ;
       * }
       * ```
       *
       * ---
       */
      generateBundle<Config extends Alova2MethodConfig<GenerationRequest>>(
        params: {},
        config?: Alova2MethodConfig<GenerationRequest>
      ): Alova2Method<GenerationRequest, 'config.generateBundle', Config>;
    };
  }

  var Apis: APIS;
}
