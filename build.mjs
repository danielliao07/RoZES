import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/test/chyp2RenderTest.mts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: 'dist/chyp2RenderTest.cjs',
  loader: { '.css': 'empty' }, // strip CSS imports, no need for styling for a static SVG
});

// Browser bundle for the webview
await esbuild.build({
    entryPoints: ['src/webview/index.tsx'],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    outfile: 'dist/webview.js',
    loader: { 
        '.css': 'empty',
        '.tsx': 'tsx'
    },
    jsx: 'automatic',
    jsxImportSource: 'preact',
});

console.log('built dist/chyp2RenderTest.cjs');