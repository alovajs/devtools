import { createConfig, generate, readConfig, resolveWorkspaces } from '@/index';
import { TemplateType } from '@/interface.type';
import ora from 'ora';

export const actionInit = async ({ type, path: projectPath }: { type?: TemplateType; path?: string }) => {
  const spinner = ora('Initializing configuration file...').start();
  await createConfig({ type, projectPath });
  spinner.succeed('alova configuration file is initialized!');
};

export const actionGen = async ({
  workspace = true,
  path: projectPath,
  force
}: {
  workspace?: boolean;
  path?: string;
  force?: boolean;
}) => {
  let workspacePaths: (string | undefined)[] = [undefined];
  if (workspace) {
    workspacePaths = await resolveWorkspaces(projectPath);
  }
  for (const dir of workspacePaths) {
    const spinner = ora(`Generating...`).start();
    const config = await readConfig(dir);
    const results = await generate(config, {
      force,
      projectPath
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
