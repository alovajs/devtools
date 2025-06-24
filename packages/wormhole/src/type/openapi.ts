import { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';

export type OpenAPIDocument = OpenAPIV3_1.Document;
export type OpenAPIV3Document = OpenAPIV3.Document;
export type OpenAPIV2Document = OpenAPIV2.Document;
export type SchemaObject = OpenAPIV3_1.SchemaObject;
export type SchemaObjectV3 = OpenAPIV3.SchemaObject;
export type Parameter = OpenAPIV3_1.ParameterObject;
export type OperationObject = OpenAPIV3_1.OperationObject;
export type ReferenceObject = OpenAPIV3_1.ReferenceObject;
export type ResponseObject = OpenAPIV3_1.ResponseObject;
export type ResponsesObject = OpenAPIV3_1.ResponsesObject;
export type RequestBodyObject = OpenAPIV3_1.RequestBodyObject;
export type ParameterObject = OpenAPIV3_1.ParameterObject;
export type ArraySchemaObject = OpenAPIV3_1.ArraySchemaObject;
export type TupleSchemaObject = Omit<ArraySchemaObject, 'items'> & { items: MaybeSchemaObject[] };
export type SchemaType = OpenAPIV3_1.NonArraySchemaObjectType | OpenAPIV3_1.ArraySchemaObjectType;
export type MaybeSchemaObject = SchemaObject | ReferenceObject;
export type MaybeArraySchemaObject = Exclude<SchemaObject, OpenAPIV3_1.NonArraySchemaObject> & {
  items: ArraySchemaObject['items'];
};
export type SimpleSchemaObject = Omit<OpenAPIV3_1.NonArraySchemaObject | ArraySchemaObject, 'type'> & {
  type?: SchemaType;
};
