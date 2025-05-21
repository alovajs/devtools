import { createConfig, generate, readConfig, resolveWorkspaces } from '@/index';
import { TemplateType } from '@/type/base';
import ora from 'ora';

export const actionInit = async ({ type, cwd }: { type?: TemplateType; cwd?: string }) => {
  const spinner = ora('Initializing configuration file...').start();
  await createConfig({ type, projectPath: cwd });
  spinner.succeed('alova configuration file is initialized!');
};

export const actionGen = async ({
  workspace = true,
  cwd,
  force
}: {
  workspace?: boolean;
  cwd?: string;
  force?: boolean;
}) => {
  let workspacePaths: (string | undefined)[] = [undefined];
  if (workspace) {
    workspacePaths = await resolveWorkspaces(cwd);
  }
  for (const dir of workspacePaths) {
    const spinner = ora(`Generating...`).start();
    const config = await readConfig(dir);
    const results = await generate(config, {
      force,
      projectPath: cwd
    });
    results.forEach(result => {
      if (result) {
        spinner.succeed(`workspace \`${dir}\` is generated!`);
      } else {
        spinner.fail(`workspace \`${dir}\` is failed, try to force generate with \`alova gen -f\`!`);
      }
    });
  }
};
