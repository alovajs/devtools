import { execSync } from 'child_process';

// Update all snapshots
console.log('=== Updating snapshots ===');
try {
  const result = execSync('npx vitest run --update 2>&1', {
    cwd: '.',
    encoding: 'utf-8',
    timeout: 120000,
    env: { ...process.env, CI: 'true', NO_COLOR: '1' }
  });
  console.log(result.slice(-3000));
} catch (e) {
  console.log('Exit code:', e.status);
  console.log('STDOUT (last 3000 chars):');
  console.log(e.stdout?.slice(-3000));
  console.log('STDERR:');
  console.log(e.stderr?.slice(-1000));
}
