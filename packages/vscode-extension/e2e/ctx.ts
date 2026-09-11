import { deepStrictEqual as is, notStrictEqual as not } from 'node:assert'
import { join } from 'node:path'
import Chai from 'chai'
import Snapshot from 'chai-jest-snapshot'
import sinon from 'sinon'
import { commands, extensions, Uri, window, workspace } from 'vscode'
import { projectRoot } from './path.js'
import { Meta } from './test.js'

Chai.use(Snapshot)
export * from './test.js'
export const expect = Chai.expect
export { is, not }
export function timeout(ms = 1000) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function getExt() {
  // The extension under development is identified by its path: `Meta.extensionId`
  // is generated from `package.json` and can go stale (it is only refreshed by
  // `pnpm run update`), which makes `getExtension(extensionId)` return
  // `undefined`.
  return extensions.all.find(ext => ext.extensionUri.fsPath === projectRoot)
    ?? extensions.getExtension(Meta.extensionId)!
}

export async function openFile(name: string) {
  const doc = await workspace.openTextDocument(Uri.file(join(workspace.workspaceFolders![0]!.uri.fsPath, name)))
  await window.showTextDocument(doc)
  return doc.getText()
}
export async function executeCommand<T>(id: string, ...args: any[]) {
  return commands.executeCommand<T>(id, ...args)
}

export function setupTest(name: string, fn: () => void) {
  describe(name, () => {
    before(() => {
      Snapshot.resetSnapshotRegistry()
    })

    beforeEach(function () {
      const { currentTest } = this
      Snapshot.setFilename(`${currentTest!.file!.replace('e2e-out', 'e2e')}.snap`)
      Snapshot.setTestName(currentTest!.fullTitle())
    })

    afterEach(() => {
    // Restore all stubs
      sinon.restore()
    })
    fn()
  })
}
