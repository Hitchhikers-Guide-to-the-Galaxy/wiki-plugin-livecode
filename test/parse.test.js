import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parse } from '../src/client/livecode.js'

test('full DSL parses', () => {
  const spec = parse('STACK wasm/Hexagon/Hexagon.html\nTITLE Hexagon\nHEIGHT 640\nBOOT auto\nFULLSCREEN scale\nNAME Hexagon')
  assert.deepEqual(spec, {
    stack: 'wasm/Hexagon/Hexagon.html',
    title: 'Hexagon',
    height: 640,
    width: null,
    triptych: false,
    columns: null,
    boot: 'auto',
    fullscreen: 'scale',
    name: 'Hexagon',
    script: null,
    transparent: false,
    behind: null,
  })
})

test('TRANSPARENT and BEHIND parse', () => {
  const spec = parse('HEIGHT 360\nTRANSPARENT\nBEHIND https://x/reef.html\nscript "Fish"\non openStack\nend openStack')
  assert.equal(spec.transparent, true)
  assert.equal(spec.behind, 'https://x/reef.html')
  assert.equal(spec.name, 'Fish')
  assert.ok(spec.script.startsWith('script "Fish"'))
})

test('transparent defaults off, behind defaults null', () => {
  const spec = parse('STACK a.html')
  assert.equal(spec.transparent, false)
  assert.equal(spec.behind, null)
})

test('WIDTH parses full and pixel values', () => {
  assert.equal(parse('STACK a.html\nWIDTH full').width, 'full')
  assert.equal(parse('STACK a.html\nWIDTH 840').width, 840)
  assert.equal(parse('STACK a.html').width, null)
})

test('TRIPTYCH mode generates a three-column script', () => {
  const spec = parse('TRIPTYCH Strengths | Proposal | Weaknesses')
  assert.equal(spec.triptych, true)
  assert.deepEqual(spec.columns, ['Strengths', 'Proposal', 'Weaknesses'])
  assert.equal(spec.name, 'Triptych')
  assert.equal(spec.stack, 'https://wasm.livecode.wiki/assets/wasm/shared/stack.html')
  assert.ok(spec.script.startsWith('script "Triptych"'))
  assert.ok(spec.script.includes('"Strengths"'))
  assert.ok(spec.script.includes('buildTriptych'))
})

test('bare TRIPTYCH uses default column labels', () => {
  const spec = parse('TRIPTYCH')
  assert.equal(spec.triptych, true)
  assert.ok(spec.script.includes('"Left"'))
  assert.ok(spec.script.includes('"Centre"'))
  assert.ok(spec.script.includes('"Right"'))
})

test('COLUMNS sets the labels for TRIPTYCH', () => {
  const spec = parse('TRIPTYCH\nCOLUMNS Before | Now | After')
  assert.deepEqual(spec.columns, ['Before', 'Now', 'After'])
  assert.ok(spec.script.includes('"Before"'))
})

test('fullscreen defaults to fixed and rejects junk modes', () => {
  assert.equal(parse('STACK a.html').fullscreen, 'fixed')
  assert.equal(parse('STACK a.html\nFULLSCREEN sideways').fullscreen, 'fixed')
  assert.equal(parse('STACK a.html\nFULLSCREEN resize').fullscreen, 'resize')
})

test('title default strips query strings', () => {
  const spec = parse('STACK https://x/shared/stack.html?zip=panel.zip')
  assert.equal(spec.title, 'stack')
})

test('title defaults to the file name and widgets load by default', () => {
  const spec = parse('STACK https://wasm.livecode.wiki/assets/wasm/Wasm/Wasm.html')
  assert.equal(spec.title, 'Wasm')
  assert.equal(spec.height, 420)
  assert.equal(spec.boot, 'auto')
})

test('BOOT click opts into the collapsible poster', () => {
  assert.equal(parse('STACK a.html\nBOOT click').boot, 'click')
  assert.equal(parse('STACK a.html\nBOOT nonsense').boot, 'auto')
})

test('optional colon and junk lines tolerated', () => {
  const spec = parse('STACK: wasm/Panel/Panel.html\nnot a command\nHEIGHT: abc')
  assert.equal(spec.stack, 'wasm/Panel/Panel.html')
  assert.equal(spec.height, 420)
})

test('empty text yields no stack', () => {
  assert.equal(parse('').stack, null)
  assert.equal(parse(undefined).stack, null)
})

test('script only stack text is detected', () => {
  const spec = parse('script "Simple Test"\non openstack\n   create button "Hello World"\nend openstack')
  assert.equal(spec.name, 'Simple Test')
  assert.equal(spec.title, 'Simple Test')
  assert.ok(spec.script.startsWith('script "Simple Test"'))
  assert.equal(spec.stack, 'https://wasm.livecode.wiki/assets/wasm/shared/stack.html')
})

test('commands before the script line still apply', () => {
  const spec = parse('HEIGHT 500\nTITLE My Demo\nscript "X"\non openstack\nend openstack')
  assert.equal(spec.height, 500)
  assert.equal(spec.title, 'My Demo')
  assert.equal(spec.name, 'X')
  assert.ok(spec.script.startsWith('script "X"'))
})

test('TRIPTYCH defaults the shell to resize mode', () => {
  const spec = parse('TRIPTYCH a | b | c')
  assert.equal(spec.fullscreen, 'resize')
  assert.ok(spec.script.includes('on resizeStack'))
  assert.ok(spec.script.includes('set the resizable of this stack to true'))
})

test('explicit FULLSCREEN wins over the TRIPTYCH resize default', () => {
  const spec = parse('FULLSCREEN fixed\nTRIPTYCH a | b | c')
  assert.equal(spec.fullscreen, 'fixed')
})
