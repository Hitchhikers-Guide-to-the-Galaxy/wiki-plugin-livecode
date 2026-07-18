# wiki-plugin-livecode

Run a Livecode wasm stack as a lazy federated-wiki widget.

A `livecode` item renders a light poster card; clicking it boots the stack's
HTML5 standalone in an iframe. Because each standalone carries a ~6.4 MB
Emscripten engine plus real runtime memory, at most one widget is live at a
time, and a watchdog tears the frame down when the item leaves the lineup.

Item text (UPPERCASE commands, optional colon):

    STACK https://wasm.livecode.wiki/assets/wasm/Hexagon/Hexagon.html
    TITLE Hexagon
    HEIGHT 420
    BOOT click

`STACK` may be absolute or relative to the item's origin site. `BOOT auto`
boots on render — use sparingly. Messages posted by the stack surface as a
`livecodeMessage` jQuery event on the widget (the grounding for the WikiScript
stage dialect).

Design context: door two of Three Livecode Doors on
https://language.ide.earth — see also the Livecode Wasm page on
https://wasm.livecode.wiki.
