import * as wormhole from '@alova/wormhole';
import * as assert from 'assert';
import sinon from 'sinon';
import * as vscode from 'vscode';

suite('alova.create.config command', function () {
  this.timeout(1000000); // 设置超时时间，避免 VSCode 启动超时
  vscode.window.showInformationMessage('Start all tests.');

  let mockCreateConfig: sinon.SinonStub;
  this.beforeEach(() => {
    // 创建 spy 和 stub
    mockCreateConfig = sinon.stub(wormhole, 'createConfig');
  });

  this.afterEach(() => {
    // 恢复所有 stub
    sinon.restore();
  });

  test('should call generateConfig with workspace paths', async () => {
    // await new Promise(resolve => {
    //   setTimeout(resolve, 10000);
    // });
    // 模拟 getWorkspacePaths 返回的路径
    // const mockPaths = ['/path/to/project'];
    mockCreateConfig.returns(Promise.resolve(undefined));

    // 执行命令
    await vscode.commands.executeCommand('alova.create.config');

    // 验证 generateConfig 是否被正确调用
    assert.ok(mockCreateConfig.calledOnce);
  });

  // test('should handle empty workspace paths gracefully', async () => {
  //   // 模拟 getWorkspacePaths 返回空数组
  //   mockReadConfig.returns([]);

  //   await vscode.commands.executeCommand('alova.create.config');

  //   assert(mockReadConfig.calledOnce, 'getWorkspacePaths should be called once');
  //   assert(mockCreateConfig.calledOnceWith([]), 'generateConfig should be called with an empty array');
  // });
});
