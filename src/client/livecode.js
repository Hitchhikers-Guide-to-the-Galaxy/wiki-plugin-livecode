// wiki-plugin-livecode — Livecode wasm stacks as wiki widgets.
//
// Item text DSL (UPPERCASE commands, per the house fedwiki-dsl convention):
//
//   ENGINE wasm/v11/stack.html             relative to the item's origin site
//   ENGINE https://site/assets/.../x.html  or absolute. This URL is the SHELL
//                                          that hosts the LiveCode ENGINE — it
//                                          is not a stack. A stack is the
//                                          binary document the engine runs,
//                                          named by the shell's ?zip= today.
//   STACK <url>                            legacy alias for ENGINE, still
//                                          accepted: 36 items across six sites
//                                          were authored with it, including the
//                                          frozen v10 archive. Prefer ENGINE.
//   TITLE Hexagon                          poster label (default: file name)
//   HEIGHT 420                             iframe height in px (default 420)
//   BOOT auto                              auto (default) or click
//   FULLSCREEN fixed                       fixed (default), scale, or resize
//   NAME MyStack                           stack name for the JS bridge
//   WIDTH full                             break out of the column: full (page
//                                          width) or a pixel number (default:
//                                          column width). The stack reads its
//                                          real size from window.innerWidth.
//   ZONE <name>                            placeholder variant: renders a light
//                                          dashed box only — no iframe, no
//                                          engine — and publishes its rect as
//                                          data-zone / data-height attributes on
//                                          the item div (the frame plugin's
//                                          data-height precedent). A WIDTH full
//                                          engine item measures every zone in
//                                          the lineup and feeds them to its
//                                          stack as marks (name:x:y:w:h in
//                                          viewport coords) — the generic DOM
//                                          protocol any plugin may adopt.
//   TRIPTYCH a | b | c                     turnkey mode: one engine draws three
//                                          labelled columns (default Left |
//                                          Centre | Right), sized to the window.
//   COLUMNS a | b | c                      the three column labels for TRIPTYCH.
//   TRANSPARENT                            render the stack with a transparent
//                                          background (opt-in ?bg=transparent on
//                                          the shell) so the page behind shows
//                                          through. The stack must leave its
//                                          card background empty.
//   BEHIND <url>                           an HTML page drawn behind the (usually
//                                          TRANSPARENT) stack, inside the same
//                                          widget — the animation composites over
//                                          ordinary web content. Give a full URL.
//
// Design (door two of Three Livecode Doors): a livecode item loads and
// displays its stack by default. BOOT click opts a widget into a light
// collapsible poster that boots on demand. Every widget runs independently;
// a watchdog tears a frame down when its item leaves the lineup (fedwiki
// has no plugin dispose hook — the htv pattern), and the stop control
// collapses a running widget back to its poster.

const ENGINE_MB = 6.4
// The DEFAULT engine is v11. Pages that need the old 10.0.2-rc-4 engine
// name it in their own STACK line — see v10.demo.localhost, where every
// item is pinned to that site's own copy. Rolling back is this one line.
const SHARED_SHELL = 'https://wasm.livecode.wiki/assets/wasm/v11/stack.html'

// TRIPTYCH mode — generate the LiveCode scaffold for one engine drawing three
// positioned, labelled columns. It clears the donor capsule's leftover controls
// (8 hexagon parts on the boot card), reads its real size from the browser
// window, and lays the columns out proportionally. Authors get three columns
// with no hand-written LiveCode; behaviour can be layered on later.
const triptychScript = (columns) => {
  const cols = (Array.isArray(columns) && columns.length === 3) ? columns : ['Left', 'Centre', 'Right']
  const lab = (s) => String(s).replace(/"/g, "'").replace(/[\r\n]/g, ' ')
  return [
    'script "Triptych"',
    '',
    'on preOpenStack',
    '   buildTriptych',
    'end preOpenStack',
    'on startup',
    '   buildTriptych',
    'end startup',
    'on openStack',
    '   buildTriptych',
    'end openStack',
    '',
    'local sBuilt',
    '',
    'command buildTriptych',
    '   if sBuilt is true then exit buildTriptych',
    '   put true into sBuilt',
    '   repeat the number of controls of this card',
    '      delete last control',
    '   end repeat',
    '   local tW, tH, p, zw',
    '   put winWidth() into tW',
    '   put winHeight() into tH',
    '   set the rect of this stack to 0, 0, tW, tH',
    '   set the resizable of this stack to true',
    '   set the backgroundColor of this card to "248,249,251"',
    '   put 14 into p',
    '   put trunc((tW - 4 * p) / 3) into zw',
    `   makeColumn "col1", p, zw, tH, "${lab(cols[0])}", "225,235,252"`,
    `   makeColumn "col2", p + zw + p, zw, tH, "${lab(cols[1])}", "255,248,232"`,
    `   makeColumn "col3", p + 2 * (zw + p), zw, tH, "${lab(cols[2])}", "228,244,230"`,
    'end buildTriptych',
    '',
    'on resizeStack pW, pH',
    '   if sBuilt is true then',
    '      layoutTriptych pW, pH',
    '   end if',
    'end resizeStack',
    '',
    'command layoutTriptych tW, tH',
    '   local p, zw',
    '   put 14 into p',
    '   put trunc((tW - 4 * p) / 3) into zw',
    '   layoutColumn "col1", p, zw, tH',
    '   layoutColumn "col2", p + zw + p, zw, tH',
    '   layoutColumn "col3", p + 2 * (zw + p), zw, tH',
    'end layoutTriptych',
    '',
    'command layoutColumn pName, pX, pW, pH',
    '   set the rect of graphic pName to pX, 14, pX + pW, pH - 14',
    '   set the rect of field (pName & "L") to pX, 22, pX + pW, 48',
    'end layoutColumn',
    '',
    'command makeColumn pName, pX, pW, pH, pLabel, pColor',
    '   create graphic pName',
    '   set the style of graphic pName to "roundrect"',
    '   set the rect of graphic pName to pX, 14, pX + pW, pH - 14',
    '   set the opaque of graphic pName to true',
    '   set the backgroundColor of graphic pName to pColor',
    '   set the lineColor of graphic pName to "205,210,220"',
    '   create field (pName & "L")',
    '   set the rect of field (pName & "L") to pX, 22, pX + pW, 48',
    '   set the textAlign of field (pName & "L") to "center"',
    '   set the textSize of field (pName & "L") to 15',
    '   set the borderWidth of field (pName & "L") to 0',
    '   set the opaque of field (pName & "L") to false',
    '   set the lockText of field (pName & "L") to true',
    '   put pLabel into field (pName & "L")',
    'end makeColumn',
    '',
    'function winWidth',
    '   local w',
    '   do "window.innerWidth" as "javascript"',
    '   put the result into w',
    '   if w is not a number or w < 200 then put 700 into w',
    '   return w',
    'end winWidth',
    '',
    'function winHeight',
    '   local h',
    '   do "window.innerHeight" as "javascript"',
    '   put the result into h',
    '   if h is not a number or h < 120 then put 340 into h',
    '   return h',
    'end winHeight'
  ].join('\n')
}

export const parse = (text) => {
  const spec = { engine: null, title: null, height: 420, width: null, triptych: false, columns: null, boot: 'auto', fullscreen: 'fixed', name: null, script: null, transparent: false, behind: null, zone: null }
  let fsExplicit = false
  let heightExplicit = false
  const lines = (text || '').split('\n')
  for (let i = 0; i < lines.length; i++) {
    // a script-only stack begins `script "Name"` — everything from that
    // line on is the stack's script, booted directly by the shared shell
    const sm = lines[i].match(/^\s*script\s+"([^"]+)"/)
    if (sm) {
      spec.script = lines.slice(i).join('\n')
      if (!spec.name) spec.name = sm[1]
      if (!spec.title) spec.title = sm[1]
      break
    }
    // a bare TRIPTYCH line (no args) turns on turnkey mode with default labels
    if (/^\s*TRIPTYCH\s*$/i.test(lines[i])) { spec.triptych = true; continue }
    // a bare TRANSPARENT line renders the stack with a transparent background
    // (opt-in ?bg=transparent on the shell) so anything behind shows through
    if (/^\s*TRANSPARENT\s*$/i.test(lines[i])) { spec.transparent = true; continue }
    const m = lines[i].trim().match(/^([A-Z]+):?\s+(.*)$/)
    if (!m) continue
    const [, cmd, restRaw] = m
    const rest = restRaw.trim()
    // ENGINE is the directive; STACK is the legacy alias for it
    if (cmd === 'ENGINE' || cmd === 'STACK') spec.engine = rest
    else if (cmd === 'TITLE') spec.title = rest
    else if (cmd === 'HEIGHT') {
      const h = parseInt(rest, 10)
      if (h) { spec.height = h; heightExplicit = true }
    }
    else if (cmd === 'ZONE') {
      // the wire format is colon-and-comma delimited, so the name can't be
      const clean = rest.replace(/[:,]/g, '').trim()
      spec.zone = clean || 'zone'
    }
    else if (cmd === 'BOOT') spec.boot = rest.toLowerCase() === 'click' ? 'click' : 'auto'
    else if (cmd === 'FULLSCREEN') {
      const mode = rest.toLowerCase()
      spec.fullscreen = ['fixed', 'scale', 'resize'].includes(mode) ? mode : 'fixed'
      fsExplicit = true
    } else if (cmd === 'NAME') spec.name = rest
    else if (cmd === 'WIDTH') {
      const v = rest.toLowerCase()
      spec.width = (v === 'full' || v === 'page' || v === 'lineup') ? 'full' : (parseInt(rest, 10) || null)
    }
    else if (cmd === 'TRIPTYCH') {
      spec.triptych = true
      if (rest) spec.columns = rest.split('|').map((s) => s.trim()).filter(Boolean)
    }
    else if (cmd === 'COLUMNS') spec.columns = rest.split('|').map((s) => s.trim()).filter(Boolean)
    else if (cmd === 'BEHIND') spec.behind = rest
  }
  // TRIPTYCH mode generates its own script-only stack from the column labels;
  // it lays out on resizeStack, so default the shell to resize mode (the
  // fixed default would swallow the window resizes that drive it)
  if (spec.triptych && !spec.script) {
    spec.script = triptychScript(spec.columns)
    if (!spec.name) spec.name = 'Triptych'
    if (!spec.title) spec.title = 'Triptych'
    if (!fsExplicit) spec.fullscreen = 'resize'
  }
  // ZONE is a placeholder: it beats STACK/script/TRIPTYCH, boots nothing,
  // and defaults to a shallower box than a running widget
  if (spec.zone) {
    spec.engine = null
    spec.script = null
    spec.triptych = false
    if (!heightExplicit) spec.height = 200
    if (!spec.title) spec.title = spec.zone
    return spec
  }
  if (spec.script && !spec.engine) spec.engine = SHARED_SHELL
  if (!spec.title && spec.engine) {
    const leaf = spec.engine.split('/').pop() || ''
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

// ---- lineup geometry ---------------------------------------------------
// Everything here is viewport coords, and the whole contract rests on the
// WIDTH full mount being pinned to the viewport (pullToViewport) — iframe
// coords equal viewport coords only while that holds.

// zones: one x:width pair per lineup column ('' when not a lineup)
const collectZones = () => {
  const pages = [...document.querySelectorAll('.page')]
  if (pages.length < 2) return ''
  return pages.map((p) => {
    const r = p.getBoundingClientRect()
    return Math.round(r.left) + ':' + Math.round(r.width)
  }).join(',')
}

// marks: one name:x:y:w:h per ZONE item anywhere in the lineup, translated
// into the ENGINE FRAME's coordinate space (the stack draws in iframe
// coords, and a cross-origin stack cannot read frameElement to translate
// for itself). Duplicate names (same page open twice) dedupe by suffix:
// left, left2, ...
const collectMarks = (offsetLeft, offsetTop) => {
  const seen = {}
  return [...document.querySelectorAll('.item[data-zone]')].map((el) => {
    let name = el.dataset.zone || 'zone'
    seen[name] = (seen[name] || 0) + 1
    if (seen[name] > 1) name += seen[name]
    const r = el.getBoundingClientRect()
    return [name, Math.round(r.left - (offsetLeft || 0)),
            Math.round(r.top - (offsetTop || 0)),
            Math.round(r.width), Math.round(r.height)].join(':')
  }).join(',')
}

// Pin a WIDTH full mount across the viewport. A negative margin is NOT
// enough: `.page` is overflow:auto, so a 100vw child is CLIPPED to its
// column and anything drawn beyond the column edge silently disappears —
// which is what hid every zone window while the DOM insisted they were
// visible and correctly placed. Fixed positioning escapes ancestor overflow
// (no transformed ancestors in the fedwiki chain), so the overlay survives.
// The widget keeps a spacer of the same height so the column still flows.
// Runs at boot AND on every scroll/resize — the anchor moves constantly.
const pullToViewport = (mount, widget, height) => {
  const bar = widget.querySelector('.livecode-bar')
  const barH = bar ? bar.offsetHeight : 0
  widget.style.minHeight = (height + barH) + 'px'
  const anchor = widget.getBoundingClientRect()
  mount.style.setProperty('position', 'fixed', 'important')
  mount.style.setProperty('left', '0px', 'important')
  mount.style.setProperty('width', '100vw', 'important')
  mount.style.setProperty('max-width', '100vw', 'important')
  mount.style.setProperty('top', Math.round(anchor.top + barH) + 'px', 'important')
  mount.style.marginLeft = '0px'
  return Math.abs(mount.getBoundingClientRect().left) <= 2
}

// ---- per-widget lifecycle ---------------------------------------------

const stopWidget = (widget) => {
  const inst = widget.__livecode
  if (!inst) return
  clearInterval(inst.watch)
  window.removeEventListener('message', inst.onMessage)
  document.removeEventListener('fullscreenchange', inst.onFsChange)
  if (inst.onResize) window.removeEventListener('resize', inst.onResize)
  if (inst.onScroll) {
    window.removeEventListener('scroll', inst.onScroll, true)
    if (inst.scroller) inst.scroller.removeEventListener('scroll', inst.onScroll)
  }
  if (inst.observer) inst.observer.disconnect()
  ;(inst.mount || inst.frame).remove()
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
  if (spec.script) {
    url += '&boot=script'
  }
  if (spec.transparent) {
    url += '&bg=transparent'
  }
  // WIDTH full pulls the iframe to the viewport's left edge, so iframe x-coords
  // equal viewport x-coords. Hand the stack the REAL lineup geometry: zones
  // (one x:width per column) and marks (one name:x:y:w:h per ZONE item).
  if (spec.width === 'full') {
    const zones = collectZones()
    if (zones) url += '&zones=' + encodeURIComponent(zones)
    // marks are NOT sent on the url: they are frame-relative, and the frame
    // has no geometry until it has mounted — the load listener below sends
    // the first translated set
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
  if (spec.transparent) frame.setAttribute('allowtransparency', 'true')
  frame.style.cssText =
    `width:100%;height:${spec.height}px;border-radius:6px;` +
    (spec.transparent
      ? 'border:0;background:transparent'
      : 'border:1px solid #e0e0e0;background:#fff')

  // BEHIND: render an HTML page behind a (usually transparent) stack, both
  // inside one positioned stage, so the livecode animation composites over
  // ordinary web content. Without BEHIND the frame mounts directly as before.
  let mount = frame
  if (spec.behind) {
    const stage = document.createElement('div')
    stage.className = 'livecode-stage'
    stage.style.cssText =
      `position:relative;width:100%;height:${spec.height}px;` +
      'border-radius:6px;overflow:hidden'
    const back = document.createElement('iframe')
    back.className = 'livecode-behind'
    back.src = spec.behind
    back.setAttribute('scrolling', 'no')
    back.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;border:0;z-index:0'
    frame.style.position = 'absolute'
    frame.style.inset = '0'
    frame.style.width = '100%'
    frame.style.height = '100%'
    frame.style.borderRadius = '0'
    frame.style.zIndex = '1'
    stage.appendChild(back)
    stage.appendChild(frame)
    mount = stage
  }

  // WIDTH: break the widget out of its fedwiki column so a triptych can span
  // the page. 'full' is the classic full-bleed (100vw pulled to the viewport
  // edge); a number widens to that many px. The stack sizes itself to the
  // resulting window.innerWidth.
  if (spec.width === 'full') {
    // pull the mount to the viewport's LEFT EDGE exactly. The classic
    // calc(50% - 50vw) only works when the parent is viewport-centred — inside
    // a fedwiki column it is not, so measure and pull by the real offset. The
    // zones/marks params are viewport coords, so iframe x MUST equal viewport
    // x. Double-rAF so the first layout has settled; postcondition + one
    // retry, stamped for observability.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const ok = pullToViewport(mount, widget, spec.height)
      widget.dataset.fullWidth = ok ? 'ok' : 'retrying'
      if (!ok) setTimeout(() => {
        widget.dataset.fullWidth = pullToViewport(mount, widget, spec.height) ? 'ok' : 'failed'
      }, 250)
    }))
    // the full-bleed frame belongs to ITS page's DOM, and later .page
    // columns otherwise paint over its overflow — the engine renders fine
    // and the columns quietly bury it. Raising the mount alone is not
    // enough: z-index competes only within the ancestor page's stacking
    // context, so the page itself must rise above its later siblings.
    // (Pair with TRANSPARENT or the frame's own background hides the wiki;
    // clicks over other columns now land on the frame - the overlay price.)
    mount.style.position = 'relative'
    mount.style.zIndex = '30'
    widget.style.overflow = 'visible'
  } else if (typeof spec.width === 'number') {
    mount.style.width = spec.width + 'px'
    mount.style.maxWidth = 'none'
    widget.style.overflow = 'visible'
  }

  const tell = (command) => {
    try {
      frame.contentWindow.postMessage({ livecode: { command, mode: spec.fullscreen } }, '*')
    } catch (e) { /* frame gone */ }
  }

  const onMessage = (event) => {
    if (!widget.__livecode || event.source !== frame.contentWindow) return
    const d = event.data && event.data.livecode
    if (d && d.ready === 'script' && spec.script) {
      frame.contentWindow.postMessage({ livecode: { bootScript: spec.script } }, '*')
    }
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

  // parent-side geometry refresh: the WIDTH full margin-pull and the zones
  // and marks strings are all viewport-relative, so scroll, resize and
  // lineup changes all go stale without this. The shell mirrors both into
  // window.__wikiZones / window.__wikiMarks; the stack pulls them fresh.
  let lastZones = null
  let lastMarks = null
  const sendGeometry = () => {
    if (!widget.__livecode) return
    if (spec.width === 'full') pullToViewport(mount, widget, spec.height)
    const zones = collectZones()
    if (zones !== lastZones) {
      lastZones = zones
      try { frame.contentWindow.postMessage({ livecode: { command: 'zones', zones } }, '*') } catch (e) { /* frame gone */ }
    }
    const fr = frame.getBoundingClientRect()
    const marks = collectMarks(fr.left, fr.top)
    if (marks !== lastMarks) {
      lastMarks = marks
      try { frame.contentWindow.postMessage({ livecode: { command: 'marks', marks } }, '*') } catch (e) { /* frame gone */ }
    }
  }
  // first translated marks once the frame exists and has laid out
  frame.addEventListener('load', () => setTimeout(sendGeometry, 400))

  let resizeTimer = null
  const onResize = () => {
    if (!widget.__livecode) return
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(sendGeometry, 150)
  }
  window.addEventListener('resize', onResize)

  // scroll must track live (windows are seated at mark rects), so rAF-throttle
  // rather than debounce. Capture-phase on window catches the .main horizontal
  // scroller and any inner vertical scroll in one registration.
  let scrollQueued = false
  let onScroll = null
  let scroller = null
  let observer = null
  if (spec.width === 'full') {
    onScroll = () => {
      if (scrollQueued || !widget.__livecode) return
      scrollQueued = true
      requestAnimationFrame(() => { scrollQueued = false; sendGeometry() })
    }
    window.addEventListener('scroll', onScroll, true)
    scroller = document.querySelector('.main')
    if (scroller) scroller.addEventListener('scroll', onScroll)
    // pages joining or leaving the lineup move every zone
    if (scroller && typeof MutationObserver !== 'undefined') {
      let mutTimer = null
      observer = new MutationObserver(() => {
        clearTimeout(mutTimer)
        mutTimer = setTimeout(sendGeometry, 200)
      })
      observer.observe(scroller, { childList: true })
    }
  }

  // watchdog: fedwiki never tells a plugin its item left the lineup
  const watch = setInterval(() => {
    if (!document.body.contains(widget)) stopWidget(widget)
  }, 4000)

  poster.style.display = 'none'
  widget.appendChild(bar)
  widget.appendChild(mount)
  bar.querySelector('.livecode-stop').addEventListener('click', () => stopWidget(widget))
  bar.querySelector('.livecode-full').addEventListener('click', () => {
    if (frame.requestFullscreen) frame.requestFullscreen()
  })
  widget.__livecode = { poster, frame, mount, bar, watch, onMessage, onFsChange, onResize, onScroll, scroller, observer }
}

// ---- fedwiki plugin surface -------------------------------------------

export const emit = (div, item) => {
  const spec = parse(item.text || '')
  if (spec.zone) {
    // a placeholder, not a widget: no iframe, no engine. The data attributes
    // on the ITEM div are the whole cross-plugin protocol — anything can
    // measure .item[data-zone] without depending on this plugin.
    div.html(
      `<div class="livecode-zone" style="height:${spec.height}px;` +
      'border:2px dashed #b8c4d8;border-radius:8px;background:#f8fafd;' +
      'display:flex;align-items:center;justify-content:center;color:#8a97ad;' +
      `font-size:14px">&#9634; zone: ${escapeHtml(spec.zone)}</div>`)
    div[0].dataset.zone = spec.zone
    div[0].dataset.height = spec.height
    return
  }
  delete div[0].dataset.zone
  delete div[0].dataset.height
  if (!spec.engine) {
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
    `${spec.script ? "runs this item's script with" : 'loads'} the ${ENGINE_MB} MB engine</div>` +
    '</div></div>')
}

export const bind = (div, item) => {
  div.on('dblclick', () => window.wiki.textEditor(div, item))
  const spec = parse(item.text || '')
  if (spec.zone) return
  const widget = div.find('.livecode-widget')[0]
  const poster = div.find('.livecode-poster')[0]
  if (!spec.engine || !widget || !poster) return
  if (spec.behind) spec.behind = resolveUrl(div, spec.behind)
  const url = resolveUrl(div, spec.engine)
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
