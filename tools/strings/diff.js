#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

const args = process.argv.slice(2)
const getArg = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i>=0 ? args[i+1] : fallback
}

const from = getArg('from','tools/strings/dev.en.json')
const to = getArg('to','tools/strings/test.en.json')

const A = JSON.parse(fs.readFileSync(path.resolve(from),'utf-8'))
const B = JSON.parse(fs.readFileSync(path.resolve(to),'utf-8'))

const added = []
const removed = []
const changed = []

const keys = new Set([...Object.keys(A), ...Object.keys(B)])
for (const k of keys){
  if (!(k in A) && (k in B)) added.push([k, B[k]])
  else if ((k in A) && !(k in B)) removed.push([k, A[k]])
  else if (A[k] !== B[k]) changed.push([k, A[k], B[k]])
}

const report = [
  `KDIFF REPORT`,
  `From: ${from}`,
  `To:   ${to}`,
  ``,
  `Added (${added.length}):`,
  ...added.map(([k,v]) => `+ ${k} = ${JSON.stringify(v)}`),
  ``,
  `Removed (${removed.length}):`,
  ...removed.map(([k,v]) => `- ${k} = ${JSON.stringify(v)}`),
  ``,
  `Changed (${changed.length}):`,
  ...changed.map(([k,a,b]) => `~ ${k}: ${JSON.stringify(a)} -> ${JSON.stringify(b)}`)
].join('\n')

console.log(report)
