import type { TemplateType } from '@/type/lib'
import ora from 'ora'
import { createConfig, generate, readConfig, resolveWorkspaces } from '@/index'

export async function actionInit({ type, cwd }: { type?: TemplateType, cwd?: string }) {
  const spinner = ora('Initializing configuration file...').start()
  await createConfig({ type, projectPath: cwd })
  spinner.succeed('alova configuration file is initialized!')
}

export async function actionGen({
  workspace = true,
  cwd,
  force,
}: {
  workspace?: boolean
  cwd?: string
  force?: boolean
}) {
  let workspacePaths: (string | undefined)[] = [undefined]
  if (workspace) {
    workspacePaths = await resolveWorkspaces(cwd)
  }
  for (const dir of workspacePaths) {
    const spinner = ora(`Generating...`).start()
    const config = await readConfig(dir)
    const results = await generate(config, {
      force,
      projectPath: cwd,
    })
    results.forEach((result) => {
      if (result) {
        spinner.succeed(`workspace \`${dir}\` is generated!`)
      }
      else {
        spinner.fail(`workspace \`${dir}\` is failed, try to force generate with \`alova gen -f\`!`)
      }
    })
  }
}
