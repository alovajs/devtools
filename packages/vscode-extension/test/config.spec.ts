import * as wormhole from '@alova/wormhole';
import * as assert from 'assert';
import sinon from 'sinon';
import * as vscode from 'vscode';

suite('alova.create.config command', function () {
  this.timeout(1000000); // Set a timeout to avoid VSCode startup timeout
  vscode.window.showInformationMessage('Start all tests.');

  let mockCreateConfig: sinon.SinonStub;
  this.beforeEach(() => {
    // Create spies and stubs
    mockCreateConfig = sinon.stub(wormhole, 'createConfig');
  });

  this.afterEach(() => {
    // Restore all stubs
    sinon.restore();
  });

  test('should call generateConfig with workspace paths', async () => {
    // await new Promise(resolve => {
    //   setTimeout(resolve, 10000);
    // });
    // Mock the paths returned by getWorkspacePaths
    // const mockPaths = ['/path/to/project'];
    mockCreateConfig.returns(Promise.resolve(undefined));

    // execute command
    await vscode.commands.executeCommand('alova.create.config');

    // Verify that generateConfig is called correctly
    assert.ok(mockCreateConfig.calledOnce);
  });

  // test('should handle empty workspace paths gracefully', async () => {
  //   //Mock getWorkspacePaths to return an empty array
  //   mockReadConfig.returns([]);

  //   await vscode.commands.executeCommand('alova.create.config');

  //   assert(mockReadConfig.calledOnce, 'getWorkspacePaths should be called once');
  //   assert(mockCreateConfig.calledOnceWith([]), 'generateConfig should be called with an empty array');
  // });
});
