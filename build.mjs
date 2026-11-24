import * as esbuild from 'esbuild';

const production = process.argv.includes('--production');

// Browser bundle for webview
await esbuild.build({
    entryPoints: ['src/webview/index.tsx'],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    outfile: 'dist/webview.js',
    minify: production,
    loader: {
        '.css': 'empty',
        '.tsx': 'tsx'
    },
    jsx: 'automatic',
    jsxImportSource: 'preact',
});

console.log(`built dist/webview.js${production ? ' (minified)' : ''}`);