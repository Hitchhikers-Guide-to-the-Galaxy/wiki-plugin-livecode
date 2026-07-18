import esbuild from 'esbuild'
import fs from 'node:fs'

esbuild.build({
  entryPoints: ['src/client/livecode.js'],
  bundle: true,
  format: 'iife',
  outfile: 'client/livecode.js',
  sourcemap: true,
  minify: true,
  metafile: true,
}).then(result => {
  fs.writeFileSync('meta-client.json', JSON.stringify(result.metafile))
  console.log('built client/livecode.js')
})
