import { test, expect } from '@playwright/test';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';

const execAsync = util.promisify(exec);

test.describe('CLI Wrapper', () => {
  const cliPath = path.resolve(__dirname, '../src/cli.ts');

  test('should fail and show usage if --url is missing', async () => {
    try {
      await execAsync(`npx ts-node ${cliPath}`);
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.code).toBe(1);
      expect(error.stdout).toContain('Usage:');
      expect(error.stdout).toContain('--url');
    }
  });

  test('should run successfully in READ_ONLY mode given a valid url', async () => {
    // We can point it to a simple site like example.com
    const { stdout, stderr } = await execAsync(`npx ts-node ${cliPath} --url https://example.com --mode READ_ONLY`);

    // It should exit with code 0 (success)
    expect(stdout).toContain('Primal Check completed successfully');
    expect(stderr).not.toContain('Error');
  });

  test('should run successfully in default mode if only --url is provided', async () => {
    const { stdout } = await execAsync(`npx ts-node ${cliPath} --url https://example.com`);

    expect(stdout).toContain('Primal Check completed successfully');
  });
});
