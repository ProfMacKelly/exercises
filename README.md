# Studies De Jure: browser decision-tree editor

For everyday use, read **START-HERE.md** and open **exercise-editor.html**. The standalone editor requires no installation, server, external scripts, or code editing. It includes the negligence example and exports each student exercise as a complete standalone HTML file.

## Included experiences

- `exercise-editor.html`: a self-contained copy of the browser editor. Upload this one file to GitHub Pages or open it locally.
- `editor.html`: the same editor using the separate assets in `assets/`.
- `index.html`: the default student negligence exercise using the separate assets.
- JSON project export/import for editing backups, browser draft saving, page and branch forms, Markdown explanations, automatic SVG diagram layout, and a student preview.

Edits do not publish automatically. Export student HTML and upload it to GitHub. New exercise files coexist under separate URLs. Existing sample repository files are retained.

## For maintainers

Content validation and layout are in `assets/model.js`, basic safe Markdown display in `assets/markdown.js`, student behavior in `assets/app.js`, export logic in `assets/export.js`, and editor behavior in `assets/editor.js`.

`assets/tree.js` supplies the default example. After changing student HTML, CSS, or runtime, regenerate the embedded export template and standalone editor:

```sh
python scripts/build-export-template.py
python scripts/build-editor.py
node --test tests/*.test.cjs
```

The editor exports JSON projects with format `decision-tree-project`, version `1`, and an `exercise` object. Page IDs remain stable when titles are edited. The shared validator checks text fields, IDs, destinations, outcome/choice consistency, and cycles. Unreachable pages produce warnings. The longest-path layout handles branches that rejoin; it does not minimize crossing lines.

The safe Markdown subset creates DOM nodes and never executes raw HTML. JSON embedded in HTML escapes `<` to prevent closing-script injection. Project imports parse JSON rather than executing JavaScript. The editor iframe allows scripts without same-origin access.

There are no server writes, accounts, secrets, or direct GitHub publishing. Browser draft storage is a convenience; project downloads are the durable editing backups. Limits: 100 pages, 12 choices per page, 5 MB imported project files. Unsupported Markdown includes tables, images, nested lists, raw HTML, and wiki links.

## Checks

Run `node --test tests/*.test.cjs`. Seventeen checks cover student navigation, missing-element outcomes, defenses, history, diagram jumps, views/zoom, editing, import/export, drafts, cycle/destination validation, unsafe input handling, and export-template consistency. These use a lightweight DOM/history harness; visual browser QA remains unverified.

The negligence material is a general teaching model and must be adapted to applicable jurisdictional rules. Source links are included in the default example. Fresh exercises begin with empty scenario/source fields.
