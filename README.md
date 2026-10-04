# Studies De Jure: decision-tree exercises

A buildless browser app for GitHub Pages. The first exercise analyzes negligence through text choices and a clickable SVG decision tree. No Node installation, server, account, external script, or build step is required to use it.

## Publish on GitHub Pages

1. Extract `negligence-decision-app.zip`. Upload its contents to the repository’s `main` branch, keeping `assets/` and `tests/` as folders. Put `index.html` directly at the repository root, not inside an extra enclosing folder.
2. In this repository, open **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Select **main** and **/(root)**, then **Save**.
5. Once GitHub finishes publishing, open https://profmackelly.github.io/exercises/.

The root `index.html` is the app. Existing sample files are retained. `.nojekyll` tells Pages to serve the static files without Jekyll processing.

## Use the app

- **Both** shows the question page alongside the diagram.
- **Questions** and **Diagram** show either view by itself.
- Text choices follow an answer branch and record the route.
- Clicking a diagram node opens its page and starts a fresh exploration route. It does not assume earlier questions have been answered.
- **Back** retraces navigation, including diagram jumps. Browser Back/Forward work too.
- **Restart** starts a fresh analysis. Previous browser-history entries remain available.
- Diagram nodes and buttons support keyboard access. Zoom controls change diagram size; scroll the diagram to navigate it.
- Each page has a bookmarkable hash URL, for example `https://profmackelly.github.io/exercises/#/breach`. Refreshing preserves the page. A newly opened bookmark starts without an earlier answer route.
- This is an exploratory teaching exercise, not an automatically graded quiz. Answers are not submitted or stored on a server.

## Edit questions, explanations, and branches

Open `assets/tree.js`. The exercise is a JavaScript object containing plain text:

```js
{
  id: 'duty',                     // unique lowercase id
  label: 'Duty?',                  // diagram label; \n gives a line break
  row: 0, column: 0,               // diagram position, starting at zero
  title: 'Does a duty exist?',     // page heading
  category: '01 · DUTY',
  body: 'Explain the rule here.',
  prompt: 'Ask for reasoning.',    // optional
  example: 'Discuss a fact.',      // optional
  choices: [
    { label: 'Yes', to: 'damages', edge: 'Yes' },
    { label: 'No', to: 'no-duty', edge: 'No' }
  ]
}
```

Each `to` must match another node's `id`. An outcome has `choices: []` and may have `type: 'success'` or `type: 'failure'`. Use distinct row/column positions; the diagram draws its arrows directly from the choices. Change `start` to choose the first page. The app validates duplicate IDs, positions, and missing destinations.

Change visual styling in `assets/styles.css` and behavior in `assets/app.js`. The diagram is generated from the same data as the text; you do not need to maintain separate Mermaid syntax. Importing an existing Mermaid diagram or parsing prose into a tree is not included in this prototype.

## Local use and checks

Open `index.html` directly in a browser, or run `python -m http.server 8000` in the repository and visit http://localhost:8000/.

For automated checks, run `node --test tests/app.test.cjs`. These checks use a lightweight DOM harness and verify branch paths, routing, browser history, exploration, and display controls. They do not replace visual browser testing.

## Legal content

This general teaching model follows Duty → Harm → Breach → Factual cause → Proximate cause → Defenses. A defense can reduce or bar recovery. Adapt the content to the relevant jurisdiction and course. Cornell LII source links are included in the app footer; no particular state's fault threshold is assumed.
