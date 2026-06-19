import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CORE_PROGRESS_SOURCE, noopReportProgress, ProgressTracker } from '@/helper/progress'

describe('progressTracker', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('does nothing when no listener is provided', () => {
    const tracker = new ProgressTracker()
    expect(() => {
      tracker.start()
      tracker.update('core', 50, 'noop')
      tracker.flush()
      tracker.stop()
    }).not.toThrow()
  })

  it('throttles updates to the configured interval and emits on stop', () => {
    const listener = vi.fn()
    const tracker = new ProgressTracker(listener, 500)
    tracker.start()
    tracker.update('core', 10, 'first')
    tracker.update('core', 20)
    expect(listener).not.toHaveBeenCalled()

    vi.advanceTimersByTime(500)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenLastCalledWith({
      core: { source: 'core', progress: 20, message: undefined },
    })

    tracker.stop()
    expect(listener).toHaveBeenCalledTimes(1) // no further dirty updates
  })

  it('flushes pending updates on stop', () => {
    const listener = vi.fn()
    const tracker = new ProgressTracker(listener, 500)
    tracker.start()
    tracker.update('core', 30, 'pending')
    tracker.stop()

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenLastCalledWith({
      core: { source: 'core', progress: 30, message: 'pending' },
    })
  })

  it('emits immediately when interval <= 0', () => {
    const listener = vi.fn()
    const tracker = new ProgressTracker(listener, 0)
    tracker.start()
    tracker.update('plugin-a', 25, 'tick')
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenLastCalledWith({
      'plugin-a': { source: 'plugin-a', progress: 25, message: 'tick' },
    })
    tracker.stop()
  })

  it('clamps progress into the [0, 100] range', () => {
    const listener = vi.fn()
    const tracker = new ProgressTracker(listener, 0)
    tracker.start()
    tracker.update('core', -10)
    tracker.update('plugin', 250, 'overflow')
    tracker.stop()
    expect(listener).toHaveBeenLastCalledWith({
      core: { source: 'core', progress: 0, message: undefined },
      plugin: { source: 'plugin', progress: 100, message: 'overflow' },
    })
  })

  it('reporterFor binds the source name', () => {
    const listener = vi.fn()
    const tracker = new ProgressTracker(listener, 0)
    tracker.start()
    const report = tracker.reporterFor('apifox')
    report(40, 'fetch')
    tracker.stop()
    expect(listener).toHaveBeenLastCalledWith({
      apifox: { source: 'apifox', progress: 40, message: 'fetch' },
    })
  })

  it('does not emit when there are no dirty updates between intervals', () => {
    const listener = vi.fn()
    const tracker = new ProgressTracker(listener, 100)
    tracker.start()
    vi.advanceTimersByTime(300)
    tracker.stop()
    expect(listener).not.toHaveBeenCalled()
  })

  it('exports the core source constant and a noop reporter', () => {
    expect(CORE_PROGRESS_SOURCE).toBe('core')
    expect(() => noopReportProgress(50, 'ignored')).not.toThrow()
  })
})
