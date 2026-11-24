import * as esbuild from 'esbuild';

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