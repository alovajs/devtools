import * as fs from 'node:fs'
import * as path from 'node:path'
import * as vscode from 'vscode'

export default class TemplateEngine {
  /**
   * 渲染模板文件
   * @param context 扩展上下文
   * @param templatePath 模板文件相对路径
   * @param variables 模板变量
   * @returns 渲染后的HTML字符串
   */
  static renderTemplate(
    context: vscode.ExtensionContext,
    templatePath: string,
    variables: Record<string, any>,
  ): string {
    // 获取模板文件绝对路径
    const templateFilePath = path.join(context.extensionPath, templatePath)

    // 读取模板内容
    let templateContent = fs.readFileSync(templateFilePath, 'utf-8')

    // 处理资源路径变量
    if (variables.resourceUri) {
      for (const [key, value] of Object.entries(variables.resourceUri)) {
        variables[key] = value
      }
    }

    // 替换模板变量
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`{{ ${key} }}`, 'g')
      templateContent = templateContent.replace(placeholder, value)
    }

    return templateContent
  }

  /**
   * 获取Webview可访问的资源URI
   * @param webview Webview实例
   * @param context 扩展上下文
   * @param relativePath 资源相对路径
   * @returns Webview可访问的URI
   */
  static getWebviewResourceUri(
    webview: vscode.Webview,
    context: vscode.ExtensionContext,
    relativePath: string,
  ): vscode.Uri {
    return webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, ...relativePath.split('/')))
  }
}
