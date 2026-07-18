// wiki-plugin-livecode — Livecode wasm stacks as wiki widgets.
//
// Item text DSL (UPPERCASE commands, per the house fedwiki-dsl convention):
//
//   STACK wasm/Hexagon/Hexagon.html        relative to the item's origin site
//   STACK https://site/assets/.../x.html   or absolute
//   TITLE Hexagon                          poster label (default: file name)
//   HEIGHT 420                             iframe height in px (default 420)
//   BOOT auto                              auto (default) or click
//   FULLSCREEN fixed                       fixed (default), scale, or resize
//   NAME MyStack                           stack name for the JS bridge
//
// Design (door two of Three Livecode Doors): a livecode item loads and
// displays its stack by default. BOOT click opts a widget into a light
// collapsible poster that boots on demand. Every widget runs independently;
// a watchdog tears a frame down when its item leaves the lineup (fedwiki
// has no plugin dispose hook — the htv pattern), and the stop control
// collapses a running widget back to its poster.

const ENGINE_MB = 6.4

export const parse = (text) => {
  const spec = { stack: null, title: null, height: 420, boot: 'auto', fullscreen: 'fixed', name: null }
  for (const raw of (text || '').split('\n')) {
    const m = raw.trim().match(/^([A-Z]+):?\s+(.*)$/)
    if (!m) continue
    const [, cmd, restRaw] = m
    const rest = restRaw.trim()
    if (cmd === 'STACK') spec.stack = rest
    else if (cmd === 'TITLE') spec.title = rest
    else if (cmd === 'HEIGHT') spec.height = parseInt(rest, 10) || spec.height
    else if (cmd === 'BOOT') spec.boot = rest.toLowerCase() === 'click' ? 'click' : 'auto'
    else if (cmd === 'FULLSCREEN') {
      const mode = rest.toLowerCase()
      spec.fullscreen = ['fixed', 'scale', 'resize'].includes(mode) ? mode : 'fixed'
    } else if (cmd === 'NAME') spec.name = rest
  }
  if (!spec.title && spec.stack) {
    const leaf = spec.stack.split('/').pop() || ''
    spec.title = (leaf.split('?')[0] || '').replace(/\.html?$/i, '') || 'Livecode stack'
  }
  return spec
}

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const resolveUrl = (div, stack) => {
  if (/^https?:\/\//i.test(stack)) return stack
  const site = div.parents('.page').data('site') || window.location.host
  return `//${site}/${stack.replace(/^\//, '')}`
}

// ---- per-widget lifecycle ---------------------------------------------

const stopWidget = (widget) => {
  const inst = widget.__livecode
  if (!inst) return
  clearInterval(inst.watch)
  window.removeEventListener('message', inst.onMessage)
  document.removeEventListener('fullscreenchange', inst.onFsChange)
  inst.frame.remove()
  inst.bar.remove()
  inst.poster.style.display = ''
  widget.__livecode = null
}

const boot = (widget, poster, spec, url) => {
  if (widget.__livecode) return

  // arm the shell's fullscreen mode from load — deterministic, no message race
  url += (url.includes('?') ? '&' : '?') + 'fs=' + spec.fullscreen
  if (spec.name) {
    url += '&stack=' + encodeURIComponent(spec.name)
  }

  const bar = document.createElement('div')
  bar.className = 'livecode-bar'
  bar.style.cssText =
    'display:flex;justify-content:space-between;align-items:center;' +
    'font-size:12px;color:#666;padding:2px 4px 4px'
  bar.innerHTML =
    `<span>${escapeHtml(spec.title)}</span>` +
    '<span>' +
    `<span class="livecode-full" style="cursor:pointer;color:#666;margin-right:12px" ` +
    `title="fullscreen (${escapeHtml(spec.fullscreen)})">&#x26F6; full</span>` +
    `<span class="livecode-stop" style="cursor:pointer;color:#b5511d">&#9632; stop</span>` +
    '</span>'

  const frame = document.createElement('iframe')
  frame.className = 'livecode-frame'
  frame.src = url
  frame.setAttribute('allow', 'fullscreen')
  frame.setAttribute('allowfullscreen', '')
  frame.style.cssText =
    `width:100%;height:${spec.height}px;border:1px solid #e0e0e0;` +
    'border-radius:6px;background:#fff'

  const tell = (command) => {
    try {
      frame.contentWindow.postMessage({ livecode: { command, mode: spec.fullscreen } }, '*')
    } catch (e) { /* frame gone */ }
  }

  const onMessage = (event) => {
    if (!widget.__livecode || event.source !== frame.contentWindow) return
    widget.dataset.lastMessage = JSON.stringify(event.data)
    if (window.$) window.$(widget).trigger('livecodeMessage', [event.data])
  }
  window.addEventListener('message', onMessage)

  const onFsChange = () => {
    if (!widget.__livecode) return
    if (document.fullscreenElement === frame) tell('fullscreen')
    else if (!document.fullscreenElement) tell('fullscreenExit')
  }
  document.addEventListener('fullscreenchange', onFsChange)

  // watchdog: fedwiki never tells a plugin its item left the lineup
  const watch = setInterval(() => {
    if (!document.body.contains(widget)) stopWidget(widget)
  }, 4000)

  poster.style.display = 'none'
  widget.appendChild(bar)
  widget.appendChild(frame)
  bar.querySelector('.livecode-stop').addEventListener('click', () => stopWidget(widget))
  bar.querySelector('.livecode-full').addEventListener('click', () => {
    if (frame.requestFullscreen) frame.requestFullscreen()
  })
  widget.__livecode = { poster, frame, bar, watch, onMessage, onFsChange }
}

// ---- fedwiki plugin surface -------------------------------------------

export const emit = (div, item) => {
  const spec = parse(item.text || '')
  if (!spec.stack) {
    div.html(
      '<div class="livecode-widget" style="border:1px dashed #ccc;border-radius:6px;' +
      'padding:12px;color:#888;font-size:13px">livecode &mdash; no STACK given. ' +
      'Double click to edit, e.g.<br><code>STACK https://wasm.livecode.wiki/assets/wasm/shared/stack.html?zip=hexagon.zip</code></div>')
    return
  }
  div.html(
    '<div class="livecode-widget">' +
    '<div class="livecode-poster" style="cursor:pointer;border:1px solid #e0d5c5;' +
    'border-radius:6px;padding:14px 16px;background:linear-gradient(135deg,#fff7ee,#ffffff)">' +
    `<div style="font-weight:bold;font-size:15px">&#9654; ${escapeHtml(spec.title)}</div>` +
    `<div style="font-size:12px;color:#888;margin-top:4px">Livecode wasm &mdash; ` +
    `loads the ${ENGINE_MB} MB engine when run</div>` +
    '</div></div>')
}

export const bind = (div, item) => {
  div.on('dblclick', () => window.wiki.textEditor(div, item))
  const spec = parse(item.text || '')
  const widget = div.find('.livecode-widget')[0]
  const poster = div.find('.livecode-poster')[0]
  if (!spec.stack || !widget || !poster) return
  const url = resolveUrl(div, spec.stack)
  const start = (event) => {
    if (event) event.stopPropagation()
    boot(widget, poster, spec, url)
  }
  poster.addEventListener('click', start)
  if (spec.boot === 'auto') start()
}

if (typeof window !== 'undefined') {
  window.plugins = window.plugins || {}
  window.plugins['livecode'] = { emit, bind }
}
