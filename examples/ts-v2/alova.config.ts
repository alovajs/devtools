import type { Config } from '@alova/wormhole'
// alova.config.js
export default <Config>{
  // api生成设置，为数组，每项代表一个自动生成的规则，包含生成的输入输出目录、规范文件地址等等
  // 目前只支持openapi规范，包括openapi的2.0和3.0格式，但目前只做3.0规范
  generator: [
    {
      // openapi的json文件url地址
      // input: 'https://petstore.swagger.io',
      // input: 'https://generator3.swagger.io',
      input: './openapi.json',
      // input: 'http://localhost:3000/openapi.json',
      // input: 'openapi/api.json' // 以当前项目为相对目录的本地地址
      // input: 'http://192.168.5.123:8080' // 没有指向openapi文件时，必须配合platform参数使用

      // 支持openapi的平台，目前先支持swagger、knife4j、yapi，默认为空
      // 当指定了此参数后，input字段只需要指定文档的地址而不需要指定到openapi文件，减小使用门槛
      // 不同平台，它的openapi文件地址不一样，根据平台标识去对应地址下读取文件即可。
      platform: 'swagger',

      // 接口文件和类型文件的输出路径，多个generator不能重复的地址，否则生成的代码会相互覆盖，无意义
      output: 'src/api',

      // （具体看下面）指定生成的响应数据的mediaType，指定后以此数据类型来生成200状态码的响应ts格式，默认application/json
      responseMediaType: 'application/json',

      // （具体看下面）指定生成的请求体数据的mediaType，指定后以此数据类型来生成请求体的ts格式，默认application/json
      bodyMediaType: 'application/json',
      globalHost: 'uni',

      // 生成代码的类型，可选值为auto/ts/typescript/module/commonjs，默认为auto，会通过一定规则判断当前项目的类型
      // ts/typescript：意思相同，表示生成ts类型文件
      // module：生成esModule规范文件
      // commonjs：表示生成commonjs规范文件
      // type: 'module',

      // （具体看下面）过滤或转换生成的api接口函数，返回一个新的apiDescriptor来生成api调用函数
      // 未指定此函数时则不转换apiDescripor对象
      // apiDescriptor的格式与openapi文件的接口对象格式相同
      // 对类型生成也同样适用123
      handleApi: (apiDescriptor) => {
        // const handleNullable=(schema)=>{
        //   if(schema?.nullable){
        //     const typeArr:string[]=[]
        //     schema.type=[...new Set(typeArr.concat(schema.type,'null'))]
        //   }
        //   return schema
        // }
        // const handleSchema=(schema)=>{
        //   const schemaObj=handleNullable(schema)
        //   if(schemaObj.properties){
        //     Object.keys(schemaObj.properties).forEach(key=>{
        //       schemaObj.properties[key]=handleSchema(schemaObj.properties[key])
        //     })
        //   }
        //   if(schemaObj.items){
        //     schemaObj.items=handleSchema(schemaObj.items)
        //   }
        //   if(schemaObj.allOf){
        //     schemaObj.allOf=schemaObj.allOf.map(item=>handleSchema(item))
        //   }
        //   if(schemaObj.anyOf){
        //     schemaObj.anyOf=schemaObj.anyOf.map(item=>handleSchema(item))
        //   }
        //   if(schemaObj.oneOf){
        //     schemaObj.oneOf=schemaObj.oneOf.map(item=>handleSchema(item))
        //   }
        //   return schemaObj
        // }
        // apiDescriptor.parameters=apiDescriptor.parameters?.map(p=> ({
        //   ...p,
        //   schema:handleSchema(p.schema)
        // }))
        // apiDescriptor.requestBody=handleSchema(apiDescriptor.requestBody)
        // apiDescriptor.responses=handleSchema(apiDescriptor.responses)
        return apiDescriptor
      },
    },
  ],

  // 是否自动更新接口，默认开启，每5分钟检查一次，false时关闭
  autoUpdate: false,
  // autoUpdate: {
  //   // 编辑器开启时更新，默认false
  //   launchEditor: true,
  //   // 自动更新间隔，单位秒
  //   interval: 10
  // }
}
