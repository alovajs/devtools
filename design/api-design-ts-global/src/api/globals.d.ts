/* tslint:disable */
/* eslint-disable */
/**
 * Swagger Petstore - version 1.0.7
 *
 * This is a sample server Petstore server.  You can find out more about Swagger at [http://swagger.io](http://swagger.io) or on [irc.freenode.net, #swagger](http://swagger.io/irc/).  For this sample, you can use the api key &#x60;special-key&#x60; to test the authorization filters.
 *
 * OpenAPI version: 3.0.0
 *
 * Contact:
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

type Alova2MethodConfig<Responded> =
  CollapsedAlova extends Alova<any, any, infer RequestConfig, any, infer ResponseHeader>
    ? AlovaMethodCreateConfig<any, Responded, RequestConfig, ResponseHeader>
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

export interface ApiResponse {
  code?: number;
  type?: string;
  message?: string;
}

export interface Category {
  id?: number;
  name?: string;
}

export interface Pet {
  id?: number;
  category?: Category;
  name: string;
  photoUrls: string[];
  tags?: Tag[];
  /**
   * pet status in the store
   */
  status?: 'available' | 'pending' | 'sold';
}
export interface Category {
  id?: number;
  name?: string;
}
export interface Tag {
  id?: number;
  name?: string;
}

export interface Tag {
  id?: number;
  name?: string;
}

export interface Order {
  id?: number;
  petId?: number;
  quantity?: number;
  shipDate?: string;
  /**
   * Order Status
   */
  status?: 'placed' | 'approved' | 'delivered';
  complete?: boolean;
}

export interface User {
  id?: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  phone?: string;
  /**
   * User Status
   */
  userStatus?: number;
}

declare global {
  interface APIS {
    pet: {
      /**
       * ---
       *
       * [POST]uploads an image
       *
       * **path:** /pet/{petId}/uploadImage
       *
       * ---
       *
       * **Path Parameters**
       * ```ts
       * interface PathParameters {
       *  // ID of pet to update
       *  // required: true
       *   petId: number;
       * }
       * ```
       *
       * ---
       *
       * **RequestBody**
       * ```ts
       * interface RequestBody {
       *  // Additional data to pass to server
       *  additionalMetadata?: string;
       *  // file to upload
       *  file?: string;
       type RequestBody ={
      *  // Additional data to pass to server
      *  additionalMetadata?: string
      *  // file to upload
      *  file?: string
      *}
       * ```
       *
       * ---
       *
       * **Response**
       * ```ts
       * interface Response {
       *  code?: number;
       *  type?: string;
       *  message?: string;
       * }
       type Response ={
      *  code?: number
      *  type?: string
      *  message?: string
      *}
       * ```
       *
       * ---
       */
      uploadFile<
        Config extends Alova2MethodConfig<ApiResponse> & {
          pathParams: {
            /**
             *ID of pet to update
             */
            petId: number;
          };
          data: {
            /**
             *Additional data to pass to server
             */
            additionalMetadata?: string;
            /**
             *file to upload
             */
            file?: string;
          };
        }
      >(
        config?: Config
      ): Alova2Method<ApiResponse, 'pet.uploadFile', Config>;
      /**
       * ---
       *
       * [POST]Add a new pet to the store
       *
       * **path:** /pet
       *
       * ---
       *
       * **RequestBody**
       * ```ts
       * interface RequestBody {
       *  id?: number;
       *  category?: Category;
       *  name?: string;
       *  photoUrls?: string[];
       *  tags?: any[];
       *  // pet status in the store
       *  status?: string;
       type RequestBody ={
      *  id?: number
      *  category?: {
      *    id?: number
      *    name?: string
      *  }
      *  name?: string
      *  photoUrls?: string[]
      *  tags?: Array<{
      *    id?: number
      *    name?: string
      *  }>
      *  // pet status in the store
      *  status?: "available" | "pending" | "sold"
      *}
       * ```
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = unknown
       type Response =unknown
       * ```
       *
       * ---
       */
      addPet<
        Config extends Alova2MethodConfig<unknown> & {
          data: {
            id?: number;
            category?: Category;
            name?: string;
            photoUrls?: string[];
            tags?: any[];
            /**
             *pet status in the store
             */
            status?: string;
          };
        }
      >(
        config?: Config
      ): Alova2Method<unknown, 'pet.addPet', Config>;
      /**
       * ---
       *
       * [PUT]Update an existing pet
       *
       * **path:** /pet
       *
       * ---
       *
       * **RequestBody**
       * ```ts
       * interface RequestBody {
       *  id?: number;
       *  category?: Category;
       *  name?: string;
       *  photoUrls?: string[];
       *  tags?: any[];
       *  // pet status in the store
       *  status?: string;
       type RequestBody ={
      *  id?: number
      *  category?: {
      *    id?: number
      *    name?: string
      *  }
      *  name?: string
      *  photoUrls?: string[]
      *  tags?: Array<{
      *    id?: number
      *    name?: string
      *  }>
      *  // pet status in the store
      *  status?: "available" | "pending" | "sold"
      *}
       * ```
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = unknown
       type Response =unknown
       * ```
       *
       * ---
       */
      updatePet<
        Config extends Alova2MethodConfig<unknown> & {
          data: {
            id?: number;
            category?: Category;
            name?: string;
            photoUrls?: string[];
            tags?: any[];
            /**
             *pet status in the store
             */
            status?: string;
          };
        }
      >(
        config?: Config
      ): Alova2Method<unknown, 'pet.updatePet', Config>;
      /**
       * ---
       *
       * [GET]Finds Pets by status
       *
       * **path:** /pet/findByStatus
       *
       * ---
       *
       * **Query Parameters**
       * ```ts
       * interface QueryParameters {
       *  // Status values that need to be considered for filter
       *  // required: true
       *  status: string[];
       * }
       * ```
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = any[]
       type Response =Array<{
      *  id?: number
      *  category?: {
      *    id?: number
      *    name?: string
      *  }
      *  name?: string
      *  photoUrls?: string[]
      *  tags?: Array<{
      *    id?: number
      *    name?: string
      *  }>
      *  // pet status in the store
      *  status?: "available" | "pending" | "sold"
      *}>
       * ```
       *
       * ---
       */
      findPetsByStatus<
        Config extends Alova2MethodConfig<any[]> & {
          params: {
            /**
             *Status values that need to be considered for filter
             */
            status: string[];
          };
        }
      >(
        config?: Config
      ): Alova2Method<any[], 'pet.findPetsByStatus', Config>;
      /**
       * ---
       *
       * [GET]Finds Pets by tags
       *
       * **path:** /pet/findByTags
       *
       * ---
       *
       * **Query Parameters**
       * ```ts
       * interface QueryParameters {
       *  // Tags to filter by
       *  // required: true
       *  tags: string[];
       * }
       * ```
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = any[]
       type Response =Array<{
      *  id?: number
      *  category?: {
      *    id?: number
      *    name?: string
      *  }
      *  name?: string
      *  photoUrls?: string[]
      *  tags?: Array<{
      *    id?: number
      *    name?: string
      *  }>
      *  // pet status in the store
      *  status?: "available" | "pending" | "sold"
      *}>
       * ```
       *
       * ---
       */
      findPetsByTags<
        Config extends Alova2MethodConfig<any[]> & {
          params: {
            /**
             *Tags to filter by
             */
            tags: string[];
          };
        }
      >(
        config?: Config
      ): Alova2Method<any[], 'pet.findPetsByTags', Config>;
      /**
       * ---
       *
       * [GET]Find pet by ID
       *
       * **path:** /pet/{petId}
       *
       * ---
       *
       * **Path Parameters**
       * ```ts
       * interface PathParameters {
       *  // ID of pet to return
       *  // required: true
       *   petId: number;
       * }
       * ```
       *
       * ---
       *
       * **Response**
       * ```ts
       * interface Response {
       *  id?: number;
       *  category?: Category;
       *  name?: string;
       *  photoUrls?: string[];
       *  tags?: any[];
       *  // pet status in the store
       *  status?: string;
       * }
       type Response ={
      *  id?: number
      *  category?: {
      *    id?: number
      *    name?: string
      *  }
      *  name?: string
      *  photoUrls?: string[]
      *  tags?: Array<{
      *    id?: number
      *    name?: string
      *  }>
      *  // pet status in the store
      *  status?: "available" | "pending" | "sold"
      *}
       * ```
       *
       * ---
       */
      getPetById<
        Config extends Alova2MethodConfig<Pet> & {
          pathParams: {
            /**
             *ID of pet to return
             */
            petId: number;
          };
        }
      >(
        config?: Config
      ): Alova2Method<Pet, 'pet.getPetById', Config>;
      /**
       * ---
       *
       * [POST]Updates a pet in the store with form data
       *
       * **path:** /pet/{petId}
       *
       * ---
       *
       * **Path Parameters**
       * ```ts
       * interface PathParameters {
       *  // ID of pet that needs to be updated
       *  // required: true
       *   petId: number;
       * }
       * ```
       *
       * ---
       *
       * **RequestBody**
       * ```ts
       * interface RequestBody {
       *  // Updated name of the pet
       *  name?: string;
       *  // Updated status of the pet
       *  status?: string;
       type RequestBody ={
      *  // Updated name of the pet
      *  name?: string
      *  // Updated status of the pet
      *  status?: string
      *}
       * ```
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = unknown
       type Response =unknown
       * ```
       *
       * ---
       */
      updatePetWithForm<
        Config extends Alova2MethodConfig<unknown> & {
          pathParams: {
            /**
             *ID of pet that needs to be updated
             */
            petId: number;
          };
          data: {
            /**
             *Updated name of the pet
             */
            name?: string;
            /**
             *Updated status of the pet
             */
            status?: string;
          };
        }
      >(
        config?: Config
      ): Alova2Method<unknown, 'pet.updatePetWithForm', Config>;
      /**
       * ---
       *
       * [DELETE]Deletes a pet
       *
       * **path:** /pet/{petId}
       *
       * ---
       *
       * **Path Parameters**
       * ```ts
       * interface PathParameters {
       *  // Pet id to delete
       *  // required: true
       *   petId: number;
       * }
       * ```
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = unknown
       type Response =unknown
       * ```
       *
       * ---
       */
      deletePet<
        Config extends Alova2MethodConfig<unknown> & {
          pathParams: {
            /**
             *Pet id to delete
             */
            petId: number;
          };
        }
      >(
        config?: Config
      ): Alova2Method<unknown, 'pet.deletePet', Config>;
    };
    store: {
      /**
       * ---
       *
       * [GET]Returns pet inventories by status
       *
       * **path:** /store/inventory
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = object
       type Response ={
      *}
       * ```
       *
       * ---
       */
      getInventory<Config extends Alova2MethodConfig<object> & {}>(
        config?: Config
      ): Alova2Method<object, 'store.getInventory', Config>;
      /**
       * ---
       *
       * [POST]Place an order for a pet
       *
       * **path:** /store/order
       *
       * ---
       *
       * **RequestBody**
       * ```ts
       * interface RequestBody {
       *  id?: number;
       *  petId?: number;
       *  quantity?: number;
       *  shipDate?: string;
       *  // Order Status
       *  status?: string;
       *  complete?: boolean;
       type RequestBody ={
      *  id?: number
      *  petId?: number
      *  quantity?: number
      *  shipDate?: string
      *  // Order Status
      *  status?: "placed" | "approved" | "delivered"
      *  complete?: boolean
      *}
       * ```
       *
       * ---
       *
       * **Response**
       * ```ts
       * interface Response {
       *  id?: number;
       *  petId?: number;
       *  quantity?: number;
       *  shipDate?: string;
       *  // Order Status
       *  status?: string;
       *  complete?: boolean;
       * }
       type Response ={
      *  id?: number
      *  petId?: number
      *  quantity?: number
      *  shipDate?: string
      *  // Order Status
      *  status?: "placed" | "approved" | "delivered"
      *  complete?: boolean
      *}
       * ```
       *
       * ---
       */
      placeOrder<
        Config extends Alova2MethodConfig<Order> & {
          data: {
            id?: number;
            petId?: number;
            quantity?: number;
            shipDate?: string;
            /**
             *Order Status
             */
            status?: string;
            complete?: boolean;
          };
        }
      >(
        config?: Config
      ): Alova2Method<Order, 'store.placeOrder', Config>;
      /**
       * ---
       *
       * [GET]Find purchase order by ID
       *
       * **path:** /store/order/{orderId}
       *
       * ---
       *
       * **Path Parameters**
       * ```ts
       * interface PathParameters {
       *  // ID of pet that needs to be fetched
       *  // required: true
       *   orderId: number;
       * }
       * ```
       *
       * ---
       *
       * **Response**
       * ```ts
       * interface Response {
       *  id?: number;
       *  petId?: number;
       *  quantity?: number;
       *  shipDate?: string;
       *  // Order Status
       *  status?: string;
       *  complete?: boolean;
       * }
       type Response ={
      *  id?: number
      *  petId?: number
      *  quantity?: number
      *  shipDate?: string
      *  // Order Status
      *  status?: "placed" | "approved" | "delivered"
      *  complete?: boolean
      *}
       * ```
       *
       * ---
       */
      getOrderById<
        Config extends Alova2MethodConfig<Order> & {
          pathParams: {
            /**
             *ID of pet that needs to be fetched
             */
            orderId: number;
          };
        }
      >(
        config?: Config
      ): Alova2Method<Order, 'store.getOrderById', Config>;
      /**
       * ---
       *
       * [DELETE]Delete purchase order by ID
       *
       * **path:** /store/order/{orderId}
       *
       * ---
       *
       * **Path Parameters**
       * ```ts
       * interface PathParameters {
       *  // ID of the order that needs to be deleted
       *  // required: true
       *   orderId: number;
       * }
       * ```
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = unknown
       type Response =unknown
       * ```
       *
       * ---
       */
      deleteOrder<
        Config extends Alova2MethodConfig<unknown> & {
          pathParams: {
            /**
             *ID of the order that needs to be deleted
             */
            orderId: number;
          };
        }
      >(
        config?: Config
      ): Alova2Method<unknown, 'store.deleteOrder', Config>;
    };
    user: {
      /**
       * ---
       *
       * [POST]Creates list of users with given input array
       *
       * **path:** /user/createWithList
       *
       * ---
       *
       * **RequestBody**
       * ```ts
       * type RequestBody = any[]
       type RequestBody =Array<{
      *  id?: number
      *  username?: string
      *  firstName?: string
      *  lastName?: string
      *  email?: string
      *  password?: string
      *  phone?: string
      *  // User Status
      *  userStatus?: number
      *}>
       * ```
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = unknown
       type Response =unknown
       * ```
       *
       * ---
       */
      createUsersWithListInput<
        Config extends Alova2MethodConfig<unknown> & {
          data: any[];
        }
      >(
        config?: Config
      ): Alova2Method<unknown, 'user.createUsersWithListInput', Config>;
      /**
       * ---
       *
       * [GET]Get user by user name
       *
       * **path:** /user/{username}
       *
       * ---
       *
       * **Path Parameters**
       * ```ts
       * interface PathParameters {
       *  // The name that needs to be fetched. Use user1 for testing. 
       *  // required: true
       *   username: string;
       * }
       * ```
       *
       * ---
       *
       * **Response**
       * ```ts
       * interface Response {
       *  id?: number;
       *  username?: string;
       *  firstName?: string;
       *  lastName?: string;
       *  email?: string;
       *  password?: string;
       *  phone?: string;
       *  // User Status
       *  userStatus?: number;
       * }
       type Response ={
      *  id?: number
      *  username?: string
      *  firstName?: string
      *  lastName?: string
      *  email?: string
      *  password?: string
      *  phone?: string
      *  // User Status
      *  userStatus?: number
      *}
       * ```
       *
       * ---
       */
      getUserByName<
        Config extends Alova2MethodConfig<User> & {
          pathParams: {
            /**
             *The name that needs to be fetched. Use user1 for testing.
             */
            username: string;
          };
        }
      >(
        config?: Config
      ): Alova2Method<User, 'user.getUserByName', Config>;
      /**
       * ---
       *
       * [PUT]Updated user
       *
       * **path:** /user/{username}
       *
       * ---
       *
       * **Path Parameters**
       * ```ts
       * interface PathParameters {
       *  // name that need to be updated
       *  // required: true
       *   username: string;
       * }
       * ```
       *
       * ---
       *
       * **RequestBody**
       * ```ts
       * interface RequestBody {
       *  id?: number;
       *  username?: string;
       *  firstName?: string;
       *  lastName?: string;
       *  email?: string;
       *  password?: string;
       *  phone?: string;
       *  // User Status
       *  userStatus?: number;
       type RequestBody ={
      *  id?: number
      *  username?: string
      *  firstName?: string
      *  lastName?: string
      *  email?: string
      *  password?: string
      *  phone?: string
      *  // User Status
      *  userStatus?: number
      *}
       * ```
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = unknown
       type Response =unknown
       * ```
       *
       * ---
       */
      updateUser<
        Config extends Alova2MethodConfig<unknown> & {
          pathParams: {
            /**
             *name that need to be updated
             */
            username: string;
          };
          data: {
            id?: number;
            username?: string;
            firstName?: string;
            lastName?: string;
            email?: string;
            password?: string;
            phone?: string;
            /**
             *User Status
             */
            userStatus?: number;
          };
        }
      >(
        config?: Config
      ): Alova2Method<unknown, 'user.updateUser', Config>;
      /**
       * ---
       *
       * [DELETE]Delete user
       *
       * **path:** /user/{username}
       *
       * ---
       *
       * **Path Parameters**
       * ```ts
       * interface PathParameters {
       *  // The name that needs to be deleted
       *  // required: true
       *   username: string;
       * }
       * ```
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = unknown
       type Response =unknown
       * ```
       *
       * ---
       */
      deleteUser<
        Config extends Alova2MethodConfig<unknown> & {
          pathParams: {
            /**
             *The name that needs to be deleted
             */
            username: string;
          };
        }
      >(
        config?: Config
      ): Alova2Method<unknown, 'user.deleteUser', Config>;
      /**
       * ---
       *
       * [GET]Logs user into the system
       *
       * **path:** /user/login
       *
       * ---
       *
       * **Query Parameters**
       * ```ts
       * interface QueryParameters {
       *  // The user name for login
       *  // required: true
       *  username: string;
       *  // The password for login in clear text
       *  // required: true
       *  password: string;
       * }
       * ```
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = string
       type Response =string
       * ```
       *
       * ---
       */
      loginUser<
        Config extends Alova2MethodConfig<string> & {
          params: {
            /**
             *The user name for login
             */
            username: string;
            /**
             *The password for login in clear text
             */
            password: string;
          };
        }
      >(
        config?: Config
      ): Alova2Method<string, 'user.loginUser', Config>;
      /**
       * ---
       *
       * [GET]Logs out current logged in user session
       *
       * **path:** /user/logout
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = unknown
       type Response =unknown
       * ```
       *
       * ---
       */
      logoutUser<Config extends Alova2MethodConfig<unknown> & {}>(
        config?: Config
      ): Alova2Method<unknown, 'user.logoutUser', Config>;
      /**
       * ---
       *
       * [POST]Creates list of users with given input array
       *
       * **path:** /user/createWithArray
       *
       * ---
       *
       * **RequestBody**
       * ```ts
       * type RequestBody = any[]
       type RequestBody =Array<{
      *  id?: number
      *  username?: string
      *  firstName?: string
      *  lastName?: string
      *  email?: string
      *  password?: string
      *  phone?: string
      *  // User Status
      *  userStatus?: number
      *}>
       * ```
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = unknown
       type Response =unknown
       * ```
       *
       * ---
       */
      createUsersWithArrayInput<
        Config extends Alova2MethodConfig<unknown> & {
          data: any[];
        }
      >(
        config?: Config
      ): Alova2Method<unknown, 'user.createUsersWithArrayInput', Config>;
      /**
       * ---
       *
       * [POST]Create user
       *
       * **path:** /user
       *
       * ---
       *
       * **RequestBody**
       * ```ts
       * interface RequestBody {
       *  id?: number;
       *  username?: string;
       *  firstName?: string;
       *  lastName?: string;
       *  email?: string;
       *  password?: string;
       *  phone?: string;
       *  // User Status
       *  userStatus?: number;
       type RequestBody ={
      *  id?: number
      *  username?: string
      *  firstName?: string
      *  lastName?: string
      *  email?: string
      *  password?: string
      *  phone?: string
      *  // User Status
      *  userStatus?: number
      *}
       * ```
       *
       * ---
       *
       * **Response**
       * ```ts
       * type Response = unknown
       type Response =unknown
       * ```
       *
       * ---
       */
      createUser<
        Config extends Alova2MethodConfig<unknown> & {
          data: {
            id?: number;
            username?: string;
            firstName?: string;
            lastName?: string;
            email?: string;
            password?: string;
            phone?: string;
            /**
             *User Status
             */
            userStatus?: number;
          };
        }
      >(
        config?: Config
      ): Alova2Method<unknown, 'user.createUser', Config>;
    };
  }

  var Apis: APIS;
}
