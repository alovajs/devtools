export * from '@/helper/config/type';
export { Api, ApiDescriptor, ApiDoc, TemplateData } from './api';
export type GenerateApiOptions = {
  force?: boolean;
  projectPath?: string;
};
