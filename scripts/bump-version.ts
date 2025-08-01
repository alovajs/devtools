import { exec, spawn } from 'node:child_process'
import readline from 'node:readline'

// Create readline interface instance
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// Ask the user whether to execute changeset
function askConfirmation(query: string) {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      answer = answer || 'y'
      resolve(answer.toLowerCase() === 'y')
    })
  })
}

// Run the specified shell command
function runCommand(command: string) {
  return new Promise((resolve, reject) => {
    const childProcess = exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error)
      }
      resolve(stdout || stderr)
    })
    childProcess.stdout?.pipe(process.stdout)
    childProcess.stderr?.pipe(process.stderr)
  })
}

async function main() {
  // Ask questions and process answers
  const confirm = await askConfirmation('❓Do you need to bump a version?(Y/n)').finally(() => {
    rl.close()
  })
  if (confirm) {
    // Run the pnpm changeset command
    const changesetProcess = spawn('pnpm', ['changeset'], { stdio: 'inherit', shell: true })
    await new Promise((resolve) => {
      changesetProcess.on('close', async (code) => {
        resolve(code)
      })
    })
    const changesetPath = '.changeset'
    await runCommand(`git add ${changesetPath}`)
  }
}

main()
