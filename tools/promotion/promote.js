#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

const args = process.argv.slice(2)
const getArg = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i>=0 ? args[i+1] : fallback
}

const env = getArg('env','dev')
const to = getArg('to','test')
const manifestPath = 'tools/promotion/manifest.json'
const manifest = JSON.parse(fs.readFileSync(manifestPath,'utf-8'))

console.log(`KUIPER SIMULATION: promoting from ${env} -> ${to}`)

for (const item of manifest.content){
  if (item.type === 'strings'){
    // naive mapping just copies the file indicated by path to dest
    const src = path.resolve(item.path)
    const dest = path.resolve(item.dest)
    if (!fs.existsSync(src)) { console.error('Missing', src); process.exit(1) }
    fs.copyFileSync(src, dest)
    console.log(`Promoted strings: ${src} -> ${dest}`)
  }
}

console.log('Promotion complete.')
