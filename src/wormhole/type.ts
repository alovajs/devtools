export type Config = {
  // api生成设置，为数组，每项代表一个自动生成的规则，包含生成的输入输出目录、规范文件地址等等
  // 目前只支持openapi规范，包括openapi的2.0和3.0格式，但目前只做3.0规范
  generator: GeneratorConfig[];

  // 是否自动更新接口，默认开启，每5分钟检查一次，false时关闭
  autoUpdate:
    | boolean
    | {
        // 编辑器开启时更新，默认false
        launchEditor: boolean;
        // 自动更新间隔，单位毫秒
        interval: number;
      };
};
