const originalCwd = process.cwd.bind(process)

/**
 * Stack of project roots pushed by {@link withProjectCwd}.
 *
 * The innermost (most recently started) entry wins, so nested / interleaved calls
 * always observe their own project root.
 */
const cwdStack: Array<{ path: string }> = []
let installed = false

/**
 * Replace `process.cwd()` with a stack-aware version.
 *
 * When the stack is empty the original behaviour is fully restored, so nothing
 * outside a {@link withProjectCwd} window ever sees a different cwd.
 */
function installCwdOverride() {
  if (installed) {
    return
  }
  installed = true
  process.cwd = () => cwdStack[cwdStack.length - 1]?.path ?? originalCwd()
}

/**
 * Run `fn` with `process.cwd()` temporarily reporting `projectPath`.
 *
 * The VS Code extension host is spawned from the VS Code installation directory,
 * so `process.cwd()` returns something like
 * `C:\Program Files (x86)\Microsoft VS Code` instead of the project root. Anything
 * resolving a relative path from it — worma's `parseAgentFile()`, a user's
 * `worma.config.ts`, or a custom plugin — would then look in the wrong directory.
 *
 * The override only lives for the duration of the call and is always removed in
 * `finally` (by identity, so out-of-order completion cannot leak it).
 *
 * Note: start calls sequentially — for parallel calls the last started project
 * would win for all of them.
 *
 * @param projectPath project root `process.cwd()` should report, skipped when empty
 * @param fn the worma call to run inside the project context
 */
export async function withProjectCwd<T>(
  projectPath: string | undefined,
  fn: () => T | Promise<T>,
): Promise<Awaited<T>> {
  if (!projectPath) {
    return await fn()
  }

  installCwdOverride()
  const token = { path: projectPath }
  cwdStack.push(token)
  try {
    return await fn()
  }
  finally {
    const index = cwdStack.indexOf(token)
    if (index !== -1) {
      cwdStack.splice(index, 1)
    }
  }
}
