const esbuild = require('esbuild');

const watch = process.argv.includes('--watch');

async function run() {
  const context = await esbuild.context({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    mainFields: ['module', 'main'],
    outfile: 'out/extension.js',
    sourcemap: true,
    external: ['vscode'],
    logLevel: 'info',
    target: 'node20'
  });

  if (watch) {
    await context.watch();
    return;
  }

  await context.rebuild();
  await context.dispose();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
