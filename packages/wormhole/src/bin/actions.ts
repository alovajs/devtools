import type { TemplatePreset } from '@/createConfig'
import type { TemplateType } from '@/type/lib'
import ora from 'ora'
import { createConfig, generate, readConfig, resolveWorkspaces } from '@/index'
import { createProgressRenderer } from './progressRenderer'

export async function actionInit({ type, template, project }: { type?: TemplateType, template?: TemplatePreset, project?: string }) {
  const spinner = ora('Initializing configuration file...').start()
  try {
    await createConfig({ type, template, projectPath: project })
    spinner.succeed('alova configuration file is initialized!')
  }
  catch (error: any) {
    spinner.fail(`Initialization failed: ${error.message}`)
    process.exit(1)
  }
}

export async function actionGen({
  project,
  force,
}: {
  project?: string
  force?: boolean
}) {
  if (project) {
    await generateForProject(project, force)
  }
  else {
    const workspacePaths = await resolveWorkspaces()
    if (workspacePaths.length === 0) {
      console.error('No workspaces found.')
      process.exit(1)
    }
    for (const dir of workspacePaths) {
      await generateForProject(dir, force)
    }
  }
}

async function generateForProject(projectPath: string, force?: boolean) {
  const header = `Generating \`${projectPath}\`...`
  const renderProgress = createProgressRenderer(header)
  const spinner = ora({ text: header }).start()
  try {
    const config = await readConfig(projectPath)
    const results = await generate(config, {
      force,
      projectPath,
      onProgress: (snapshot) => {
        spinner.text = renderProgress(snapshot)
      },
    })
    const failed = results.some(r => !r)
    if (failed) {
      spinner.fail(`\`${projectPath}\` generation failed, try \`alova gen -f\``)
    }
    else {
      spinner.succeed(`\`${projectPath}\` generated successfully!`)
    }
  }
  catch (error: any) {
    spinner.fail(`\`${projectPath}\` error: ${error.message}`)
    process.exit(1)
  }
}
