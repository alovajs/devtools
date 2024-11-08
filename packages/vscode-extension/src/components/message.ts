/* eslint-disable no-console */
import util from 'node:util';
import * as vscode from 'vscode';
// Create an output channel
export const outputChannel = vscode.window.createOutputChannel('Alova');
export function info(message: string, duration?: number) {
  if (!duration) {
    return vscode.window.showInformationMessage(message);
  }
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: message,
      cancellable: true
    },
    (progress, token) =>
      new Promise(resolve => {
        const timeout = setTimeout(() => {
          resolve(message);
        }, duration); // Automatic shutdown time (milliseconds)
        token.onCancellationRequested(() => {
          clearTimeout(timeout);
          resolve(message);
        });
      })
  );
}
export function error(message: string) {
  return vscode.window.showErrorMessage(message);
}
export function warning(message: string) {
  return vscode.window.showWarningMessage(message);
}

export function output(type: 'log' | 'warn' | 'error', ...messageArr: any[]) {
  switch (type) {
    case 'log':
      outputChannel.append(`🟢 [LOG] `);
      break;
    case 'warn':
      outputChannel.append(`🟡 [WARN] `);
      break;
    case 'error':
      outputChannel.append(`🔴 [ERROR] `);
      break;
    default:
      break;
  }
  messageArr.forEach(message => {
    if (typeof message === 'object') {
      message = util.inspect(message, { showHidden: true, depth: null, colors: false });
    }
    outputChannel.append(`${message} `);
  });
  outputChannel.append('\n');
}

export function log(...messageArr: any[]) {
  output('log', ...messageArr);
}

export function logError(...messageArr: any[]) {
  output('error', ...messageArr);
}
export function logWarn(...messageArr: any[]) {
  output('warn', ...messageArr);
}

const consoleLog = console.log;
const consoleWarn = console.warn;
const consoleError = console.error;

Object.defineProperties(console, {
  log: {
    value: (...messageArr: any[]) => {
      log(...messageArr);
      consoleLog(...messageArr);
    }
  },
  warn: {
    value: (...messageArr: any[]) => {
      logWarn(...messageArr);
      consoleWarn(...messageArr);
    }
  },
  error: {
    value: (...messageArr: any[]) => {
      logError(...messageArr);
      consoleError(...messageArr);
    }
  }
});

export default {
  info,
  error,
  output,
  warning,
  log,
  logError,
  logWarn,
  outputChannel
};
