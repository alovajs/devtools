import chalk from 'chalk'

export const theme = {
  header: chalk.bold,
  version: chalk.dim,
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  label: chalk.bold,
  path: chalk.reset,
  stage: chalk.reset,
  dim: chalk.dim,
}

export const icons = {
  pending: chalk.dim('○'),
  active: chalk.bold('◉'),
  done: chalk.green('✔'),
  failed: chalk.red('✖'),
  skipped: chalk.yellow('⊗'),
  arrow: chalk.dim('→'),
}
