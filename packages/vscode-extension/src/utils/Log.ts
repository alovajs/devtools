import { EXT_NAME, IGNORE_ERROR } from '@/meta';
import util from 'node:util';
import { OutputChannel, window } from 'vscode';

export type LogOptions = {
  prompt?: boolean;
  indent?: number;
};
export class Log {
  private static _channel: OutputChannel;

  static get outputChannel(): OutputChannel {
    if (!this._channel) this._channel = window.createOutputChannel(EXT_NAME);
    return this._channel;
  }

  static raw(...values: any[]) {
    this.outputChannel.appendLine(values.map(i => i.toString()).join(' '));
  }

  static info(message: string, options?: LogOptions) {
    const { prompt = false, indent = 0 } = options ?? {};
    if (prompt) window.showInformationMessage(message);
    this.outputChannel.appendLine(`${'\t'.repeat(indent)}${message}`);
  }
  static warn(message: string, options?: LogOptions) {
    if (options?.prompt) window.showWarningMessage(message);
    Log.info(`⚠ WARN: ${message}`, { ...options, prompt: false });
  }

  static async error(err: Error | string | any = {}, options?: LogOptions) {
    if (IGNORE_ERROR.includes(err?.name)) {
      return;
    }
    if (typeof err !== 'string') {
      const messages = [err.message, err.response?.data, err.stack, err.toJSON?.()].filter(Boolean).join('\n');
      Log.info(`🐛 ERROR: ${err.name}: ${messages}`, { ...options, prompt: false });
    }

    if (options?.prompt) {
      const openOutputButton = '显示日志';
      const message = typeof err === 'string' ? err : `${EXT_NAME} Error: ${err.toString()}`;
      const result = await window.showErrorMessage(message, openOutputButton);
      if (result === openOutputButton) {
        this.show();
      }
    }
  }

  static show() {
    this._channel.show();
  }

  static divider() {
    this.outputChannel.appendLine('\n――――――\n');
  }
  static output(type: 'log' | 'warn' | 'error', ...messageArr: any[]) {
    if (messageArr.some(item => IGNORE_ERROR.some(error => `${item}`.includes(error)))) {
      return;
    }
    switch (type) {
      case 'log':
        this.outputChannel.append(`🟢 [LOG] `);
        break;
      case 'warn':
        this.outputChannel.append(`🟡 [WARN] `);
        break;
      case 'error':
        this.outputChannel.append(`🔴 [ERROR] `);
        break;
      default:
        break;
    }
    messageArr.forEach(message => {
      if (typeof message === 'object') {
        message = util.inspect(message, { showHidden: true, depth: null, colors: false });
      }
      this.outputChannel.append(`${message} `);
    });
    this.outputChannel.append('\n');
  }
}
export default Log;
