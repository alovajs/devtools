import { deepStrictEqual as is, notStrictEqual as not } from 'node:assert'
import { join } from 'node:path'
import Chai from 'chai'
import Snapshot from 'chai-jest-snapshot'
import { extensions, Uri, window, workspace } from 'vscode'

Chai.use(Snapshot)

export const expect = Chai.expect
export { is, not }
// @ts-expect-error export from dist/extension
export { Commands, Global, Log } from '../dist/extension'

export function timeout(ms = 1000) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function getExt() {
  return extensions.getExtension('Alova.alova-vscode-extension')!
}

export async function openFile(name: string) {
  const doc = await workspace.openTextDocument(Uri.file(join(workspace.workspaceFolders![0]!.uri.fsPath, name)))
  await window.showTextDocument(doc)
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

    fn()
  })
}
