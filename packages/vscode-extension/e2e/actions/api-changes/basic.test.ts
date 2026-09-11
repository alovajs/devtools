import sinon from 'sinon'
import { window, workspace } from 'vscode'
import {
  ChangesView,
  Commands,
  executeCommand,
  expect,
  getUpdateCount,
  Global,
  MockWorma,
  setupTest,
  timeout,
  UpdateChecker,
} from '../../ctx.js'

const PROJECT = '/workspace/fixture'

/** Current (v1) record shape: flat source-document rows. */
function makeRecord(id: string, createdAt: number) {
  return {
    schemaVersion: 1,
    id,
    createdAt,
    projectPath: PROJECT,
    generators: [
      {
        output: 'src/api',
        serverName: 'Demo',
        resolvedInput: 'api.json',
        changes: [
          { op: '+', kind: 'api', target: 'GET /pets', detail: 'listPets', level: 'additive' },
          { op: '-', kind: 'api', target: 'GET /legacy', detail: 'legacyApi', level: 'breaking' },
          { op: '~', kind: 'param', target: 'POST /pets', item: 'query.status.required', detail: 'false -> true', level: 'breaking' },
          // component rows carry their affected operations in `affects`
          { op: '~', kind: 'comp', target: '#/components/schemas/Pet', item: 'properties.status.enum', detail: '+"sold"', level: 'additive', affects: ['GET /pets', 'POST /pets'] },
        ],
      },
    ],
  }
}

function makeSummary(id: string, createdAt: number) {
  return {
    id,
    createdAt,
    outputs: ['src/api'],
    summary: { generators: 1, added: 1, removed: 1, modified: 1 },
  }
}

/**
 * `MockWorma` starts as an empty object, and the extension resolves worma lazily
 * through a Proxy that prefers any *defined* `MockWorma` key — so the property
 * must be defined before `sinon.stub` can take it over (same convention as the
 * create-config / generate-api suites). `sinon.restore()` deletes it again.
 */
function mockWorma(name: string) {
  sinon.define(MockWorma as any, name, () => {})
  return sinon.stub(MockWorma as any, name)
}

setupTest('api-changes (requirement B)', () => {
  it('opens the API Changes webview and renders the latest record', async () => {
    const createdAt = Date.now()
    mockWorma('listChanges').returns(Promise.resolve([makeSummary('0001', createdAt)]))
    mockWorma('getChange').returns(Promise.resolve(makeRecord('0001', createdAt)))

    await executeCommand(Commands.open_changes, 'latest', PROJECT)

    const panel = ChangesView.current
    expect(panel).to.not.equals(undefined)
    // html is a getter on the real Webview; fall back to the property if needed
    const html: string = (panel as any).webview?.html ?? (panel as any).html
    expect(html).to.contain('0001')
    expect(html).to.contain('GET /pets')
    expect(html).to.contain('GET /legacy')
    expect(html).to.contain('query.status.required')
    expect(html).to.contain('Level')
    // a component change keeps the component as its target and lists the APIs
    expect(html).to.contain('#/components/schemas/Pet')
    expect(html).to.contain('properties.status.enum')
    expect(html).to.contain('affects')
    // full grid borders, and the severity colour lives on the level cell only
    expect(html).to.contain('border-collapse')
    expect(html).to.contain('.level.breaking')
    expect(html).to.contain('level breaking')
    expect(html).to.not.contain('.row.add td')
    // column headers, and no divider line between the group title and the table
    expect(html).to.contain('<th>Type</th>')
    expect(html).to.not.contain('border-bottom')
  })

  it('renders a specific change record by id', async () => {
    const createdAt = Date.now()
    mockWorma('listChanges').returns(Promise.resolve([makeSummary('0001', createdAt)]))
    mockWorma('getChange').returns(Promise.resolve(makeRecord('0001', createdAt)))

    await executeCommand(Commands.open_changes, '0001', PROJECT)

    const panel = ChangesView.current
    const html: string = (panel as any).webview?.html ?? (panel as any).html
    expect(html).to.contain('0001')
  })
})

setupTest('generate → View Changes toast (requirement B)', () => {
  it('surfaces the change id and a "View Changes" action when a change is recorded', async () => {
    // `generate()` reports the record it persisted through `onChangeRecorded`.
    mockWorma('generate').callsFake(async (_config: any, options: any) => {
      options?.onChangeRecorded?.({ id: '0007', added: 1, removed: 1, modified: 1 })
      return [true]
    })

    const spy = sinon.stub(window, 'showInformationMessage').resolves(undefined)

    await executeCommand(Commands.refresh)

    // One of the information messages must show the record id and offer to review it.
    const offered = spy.getCalls().some(call =>
      typeof call.args[0] === 'string'
      && call.args[0].includes('Changes 0007')
      && (call.args[1] as unknown as string) === 'View Changes',
    )
    expect(offered).to.equals(true)
  })
})

setupTest('update detection dot (requirement A)', () => {
  it('lights the status-bar dot when a source changed', async () => {
    // `init()` already ran one silent check on activation, which filled the
    // throttle window (`minInterval` defaults to 5 min). Force this one so the
    // assertion does not depend on wall-clock timing; throttling itself is
    // covered by the debounce test below.
    UpdateChecker.clear()
    ;(UpdateChecker as any).inFlight = false

    sinon.stub(Global as any, 'getConfigs').returns([[PROJECT, { generator: [] } as any]])
    mockWorma('checkUpdates').returns(Promise.resolve({
      projectPath: PROJECT,
      updates: [{ status: 'changed', output: 'src/api', resolvedInput: 'api.json', hash: 'abc' }],
      hasGenerationBaseline: false,
    }))

    // Freeze the confirmation prompt so `check()` pauses with the dot lit.
    const pending = sinon.stub(window, 'showInformationMessage').returns(new Promise(() => {}))

    // Intentionally not awaited — the prompt never resolves in this test.
    void UpdateChecker.check({ force: true, silent: true })

    await timeout(200)

    expect(getUpdateCount()).to.be.greaterThan(0)
    pending.restore()
  })

  it('updateChecker.clear() resets the pending-dot indicator', async () => {
    // precondition: dot is lit
    expect(getUpdateCount()).to.be.greaterThan(0)
    UpdateChecker.clear()
    expect(getUpdateCount()).to.equals(0)
  })
})

setupTest('edge cases (requirement A/B)', () => {
  it('does NOT offer a "View Changes" toast when no API changed', async () => {
    mockWorma('generate').returns(Promise.resolve([true]))
    // empty change history → no change summary → no toast
    mockWorma('listChanges').returns(Promise.resolve([]))

    const spy = sinon.stub(window, 'showInformationMessage').resolves(undefined)
    await executeCommand(Commands.refresh)

    const offered = spy.getCalls().some(call =>
      (call.args[1] as unknown as string) === 'View Changes',
    )
    expect(offered).to.equals(false)
  })

  it('openChanges renders an empty state when there are no records', async () => {
    mockWorma('listChanges').returns(Promise.resolve([]))
    mockWorma('getChange').returns(Promise.resolve(undefined))

    await executeCommand(Commands.open_changes, 'latest', PROJECT)

    const panel = ChangesView.current
    expect(panel).to.not.equals(undefined)
    const html: string = (panel as any).webview?.html ?? (panel as any).html
    expect(html).to.contain('No change records yet')
  })

  it('debounces a rapid repeat check (forced then unforced)', async () => {
    sinon.stub(Global as any, 'getConfigs').returns([[PROJECT, { generator: [] } as any]])
    mockWorma('checkUpdates').returns(Promise.resolve({
      projectPath: PROJECT,
      updates: [{ status: 'changed', output: 'src/api', resolvedInput: 'api.json', hash: 'abc' }],
      hasGenerationBaseline: false,
    }))
    // auto-resolve the confirmation so the forced check can complete
    sinon.stub(window, 'showInformationMessage').resolves('Ignore' as any)

    const first = await UpdateChecker.check({ force: true, silent: true })
    expect(first.length).to.be.greaterThan(0)

    const second = await UpdateChecker.check({ silent: true })
    expect(second).to.deep.equal([])
  })

  it('does not run any check when every autoUpdate trigger is disabled', async () => {
    UpdateChecker.clear()
    ;(UpdateChecker as any).inFlight = false

    // Both triggers off: `init()` must neither register the focus listener nor
    // schedule the deferred activation check.
    const onFocusStub = sinon.stub(window, 'onDidChangeWindowState').returns({ dispose() {} } as any)
    const cfgStub = sinon.stub(workspace, 'getConfiguration').returns({
      get: (key: string, def?: any) => {
        if (key === 'checkOnActivation' || key === 'checkOnWindowFocus')
          return false
        if (key === 'minInterval')
          return 0
        return def
      },
    } as any)
    const checkUpdates = mockWorma('checkUpdates').returns(Promise.resolve({
      projectPath: PROJECT,
      updates: [{ status: 'changed', output: 'src/api', resolvedInput: 'api.json', hash: 'abc' }],
      hasGenerationBaseline: false,
    }))
    const prompt = sinon.stub(window, 'showInformationMessage').resolves(undefined)

    const disposables = UpdateChecker.init() as { dispose: () => void }[]
    // Long enough to outlive the deferred (~1500ms) activation check.
    await timeout(1800)

    expect(onFocusStub.called).to.equals(false)
    expect(checkUpdates.called).to.equals(false)
    expect(prompt.called).to.equals(false)
    expect(getUpdateCount()).to.equals(0)

    UpdateChecker.clear()
    disposables.forEach(d => d.dispose())
    cfgStub.restore()
    onFocusStub.restore()
    prompt.restore()
  })
})

setupTest('update detection triggers (requirement A)', () => {
  it('runs a silent check when the window gains focus', async () => {
    // Isolate static state from the dot tests above.
    UpdateChecker.clear()
    ;(UpdateChecker as any).inFlight = false

    const focusHandlers: Array<(s: { focused: boolean }) => void> = []
    const onFocusStub = sinon.stub(window, 'onDidChangeWindowState').callsFake((cb: any) => {
      focusHandlers.push(cb)
      return { dispose() {} } as any
    })
    // Focus-driven check only: disable the activation timer and the debounce interval.
    const cfgStub = sinon.stub(workspace, 'getConfiguration').returns({
      get: (key: string, def?: any) => {
        if (key === 'minInterval')
          return 0
        if (key === 'checkOnActivation')
          return false
        if (key === 'checkOnWindowFocus')
          return true
        return def
      },
    } as any)

    sinon.stub(Global as any, 'getConfigs').returns([[PROJECT, { generator: [] } as any]])
    mockWorma('checkUpdates').returns(Promise.resolve({
      projectPath: PROJECT,
      updates: [{ status: 'changed', output: 'src/api', resolvedInput: 'api.json', hash: 'abc' }],
      hasGenerationBaseline: false,
    }))
    // Resolve with no action so the check completes and resets `inFlight`.
    const prompt = sinon.stub(window, 'showInformationMessage').resolves(undefined)

    const disposables = UpdateChecker.init() as { dispose: () => void }[]
    expect(focusHandlers.length).to.be.greaterThan(0)

    // Simulate VS Code reporting the window became focused.
    focusHandlers[0]({ focused: true })
    await timeout(200)

    expect(getUpdateCount()).to.be.greaterThan(0)

    UpdateChecker.clear()
    disposables.forEach(d => d.dispose())
    cfgStub.restore()
    onFocusStub.restore()
    prompt.restore()
  })

  it('runs a silent check shortly after activation', async () => {
    UpdateChecker.clear()
    ;(UpdateChecker as any).inFlight = false

    // Activation-driven check only: disable the focus listener and the debounce interval.
    const onFocusStub = sinon.stub(window, 'onDidChangeWindowState').returns({ dispose() {} } as any)
    const cfgStub = sinon.stub(workspace, 'getConfiguration').returns({
      get: (key: string, def?: any) => {
        if (key === 'minInterval')
          return 0
        if (key === 'checkOnActivation')
          return true
        if (key === 'checkOnWindowFocus')
          return false
        return def
      },
    } as any)

    sinon.stub(Global as any, 'getConfigs').returns([[PROJECT, { generator: [] } as any]])
    mockWorma('checkUpdates').returns(Promise.resolve({
      projectPath: PROJECT,
      updates: [{ status: 'changed', output: 'src/api', resolvedInput: 'api.json', hash: 'abc' }],
      hasGenerationBaseline: false,
    }))
    const prompt = sinon.stub(window, 'showInformationMessage').resolves(undefined)

    const disposables = UpdateChecker.init() as { dispose: () => void }[]
    // The activation check is deferred ~1500ms; wait it out.
    await timeout(1800)

    expect(getUpdateCount()).to.be.greaterThan(0)

    UpdateChecker.clear()
    disposables.forEach(d => d.dispose())
    cfgStub.restore()
    onFocusStub.restore()
    prompt.restore()
  })
})

setupTest('update detection: new sources & resilience', () => {
  it('lights the dot for a `new` source of an already-generated project (no toast)', async () => {
    UpdateChecker.clear()
    ;(UpdateChecker as any).inFlight = false

    sinon.stub(Global as any, 'getConfigs').returns([[PROJECT, { generator: [] } as any]])
    mockWorma('checkUpdates').returns(Promise.resolve({
      projectPath: PROJECT,
      updates: [{ status: 'new', output: 'src/api', resolvedInput: 'api.json', hash: 'abc' }],
      hasGenerationBaseline: true,
    }))

    const prompt = sinon.stub(window, 'showInformationMessage').resolves(undefined)

    await UpdateChecker.check({ force: true, silent: true })

    expect(getUpdateCount()).to.be.greaterThan(0)
    // `new` must never pop a confirmation toast.
    expect(prompt.called).to.equals(false)

    UpdateChecker.clear()
    prompt.restore()
  })

  it('keeps the status bar silent for `new` sources of a brand-new project', async () => {
    UpdateChecker.clear()
    ;(UpdateChecker as any).inFlight = false

    sinon.stub(Global as any, 'getConfigs').returns([[PROJECT, { generator: [] } as any]])
    mockWorma('checkUpdates').returns(Promise.resolve({
      projectPath: PROJECT,
      updates: [{ status: 'new', output: 'src/api', resolvedInput: 'api.json', hash: 'abc' }],
      hasGenerationBaseline: false,
    }))
    const prompt = sinon.stub(window, 'showInformationMessage').resolves(undefined)

    await UpdateChecker.check({ force: true, silent: true })

    expect(getUpdateCount()).to.equals(0)
    expect(prompt.called).to.equals(false)

    prompt.restore()
  })

  it('keeps the dot lit after the user ignores a change (no repeat toast)', async () => {
    UpdateChecker.clear()
    ;(UpdateChecker as any).inFlight = false

    sinon.stub(Global as any, 'getConfigs').returns([[PROJECT, { generator: [] } as any]])
    mockWorma('checkUpdates').returns(Promise.resolve({
      projectPath: PROJECT,
      updates: [{ status: 'changed', output: 'src/api', resolvedInput: 'api.json', hash: 'abc' }],
      hasGenerationBaseline: true,
    }))
    const prompt = sinon.stub(window, 'showInformationMessage').resolves('Ignore' as any)

    await UpdateChecker.check({ force: true, silent: true })
    expect(getUpdateCount()).to.be.greaterThan(0)

    // Ignoring must neither clear the dot nor nag again for the same hash.
    await UpdateChecker.check({ force: true, silent: true })
    expect(getUpdateCount()).to.be.greaterThan(0)
    expect(prompt.callCount).to.equals(1)

    UpdateChecker.clear()
    prompt.restore()
  })

  it('releases the in-flight lock so an unanswered prompt cannot block later checks', async () => {
    UpdateChecker.clear()
    ;(UpdateChecker as any).inFlight = false

    let calls = 0
    sinon.stub(Global as any, 'getConfigs').returns([[PROJECT, { generator: [] } as any]])
    mockWorma('checkUpdates').callsFake(() => {
      calls++
      return Promise.resolve({
        projectPath: PROJECT,
        updates: [{ status: 'changed', output: 'src/api', resolvedInput: 'api.json', hash: `h${calls}` }],
        hasGenerationBaseline: true,
      } as any)
    })
    // The prompt never resolves — the previous implementation held `inFlight`
    // forever and silently swallowed every later check.
    const prompt = sinon.stub(window, 'showInformationMessage').returns(new Promise(() => {}) as any)

    await UpdateChecker.check({ force: true, silent: true })
    await UpdateChecker.check({ force: true, silent: true })

    expect(calls).to.equals(2)
    expect(getUpdateCount()).to.be.greaterThan(0)

    UpdateChecker.clear()
    prompt.restore()
  })
})
