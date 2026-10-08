# Main — design reference

This is a design mockup created in a visual design tool, exported as a
standalone page. Treat it as a REFERENCE MOCKUP, not production code:
the markup and inline styles carry the design's precise values — colors,
font sizes, spacing, radii, shadows, layout — which an implementation
should replicate faithfully in its own components and styling system
rather than copy wholesale.

## Contents

- `Main.dc.html` — the artboard (a Design Component: an `<x-dc>`
  template + a small logic class). The values to replicate live in its
  inline `style="…"` attributes and the `<helmet><style>` block.
- `support.js`, `vendor/react*.js` — the runtime that renders the
  component in a browser; not part of the design.

## Uploaded files

Images, fonts and media uploaded to the design are written once each under
`assets/` — 0 in this export — and the exported files refer to them there. A
reference a script puts together while the page runs (for example
`"/_blob/" + id`) is not rewritten and does not load from this folder.

### Missing from this export

These uploaded files could not be included, so wherever the design uses
them they do not load. Exporting again may pick them up.

- `_blob/efd98e43361c2ad8a1cfb96bfa2298c3` (used in `Main.dc.html`) — the server answered 404
- `_blob/d1331d08f76642d24167c465b9ea70e3` (used in `Main.dc.html`) — the server answered 404
- `_blob/89e25797b18786af136dafc502f45b13` (used in `Main.dc.html`) — the server answered 404

## Viewing

Serve the folder (e.g. `python3 -m http.server`) and open `Main.dc.html`;
some browsers block the scripts over file://.
