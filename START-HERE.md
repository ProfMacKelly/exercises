# Start here: edit exercises without editing code

## Try the editor on your computer

1. Extract this ZIP into a folder.
2. Double-click **exercise-editor.html** to open it in your browser. This single file contains everything the editor needs.
3. The negligence exercise is loaded for you. Select a page on the left.
4. Change its **Page title**, **Explanation**, **Reasoning prompt**, or **Application / example**.
5. Under **Answer choices**, type the answer text and choose its **Destination page** from the dropdown.
6. Click **Refresh preview**. Try the answers and diagram in the student preview.
7. Click **Save project**. Keep the downloaded JSON file; it is your editable backup. You do not need to read or edit it.
8. Click **Export student HTML**. This downloads the complete student exercise as one HTML file.

Your edits are saved as a browser draft when storage is available. That draft is local to the browser/device/site you are using. Keep downloaded project backups, especially before clearing browser data or switching devices.

## Make the editor available on your GitHub Pages site

Upload only **exercise-editor.html** to the main level of your `ProfMacKelly/exercises` repository, using **Add file → Upload files**, and commit the upload. No new folders or additional assets are needed for this single-file editor.

With your existing Pages publishing configuration, the editor will be available at:

https://profmackelly.github.io/exercises/exercise-editor.html

It is an editor that runs in each visitor's browser. Visitors cannot change your published site by using it.

## Publish the exercise you edited

1. In **Exercise settings**, set **Export filename** to `negligence.html` or another simple filename.
2. Click **Export student HTML**.
3. Upload that downloaded HTML file to the main level of the repository and commit it.
4. For `negligence.html`, give students this link:

   https://profmackelly.github.io/exercises/negligence.html

To replace the exercise at the site's main address, set the export filename to **index.html**, export it, and upload it over the current `index.html`.

Saving a browser draft or a project backup does not update GitHub. Only uploading and committing the exported HTML publishes your changes. Replacing an existing exercise with the same filename preserves its page URL.

## Continue editing later

Open the editor and click **Open project**. Select the JSON backup previously downloaded using **Save project**. The pages and connections will be restored. You never need to edit the JSON text.

The HTML export is for students; the JSON project file is for future editing. Keep both. The editor opens JSON projects, not exported HTML files.

## Create a different exercise

1. Save a project backup of your current exercise.
2. Click **New exercise**. A generic question with two neutral outcomes replaces the draft.
3. Open **Exercise settings** to set its title, subject, introduction, scenario, starting page, and source notes.
4. Use **Add page** to add another page. New pages start as neutral outcomes. Change **Page type** to **Question / decision** if it needs answer choices.
5. Add choices and select their destinations. Start at the chosen starting page when previewing to verify the route.
6. Save a project backup and export with a different filename, such as `contract-formation.html`.

New exercises do not inherit the negligence scenario or source notes. Add sources appropriate to your exercise. A page that is not connected from the starting page triggers a warning; it remains accessible from the diagram. Missing destinations and loops prevent preview/export. Use Back/Restart rather than making a branch loop back to an earlier page.

## Formatting explanations

Plain text is fine. Basic Markdown also works:

- `**bold text**`
- `*italic text*`
- `# Section heading`
- `- List item`
- `1. Numbered item`
- `[Source](https://example.com)`
- `> Quotation`
- Backticks for inline code and triple backticks for code blocks

Use blank lines between paragraphs. This lightweight Markdown support does not include tables, images, nested lists, raw HTML, or Obsidian wiki links. Diagram labels and answer choices use plain text.

## What the other files are for

You can use only `exercise-editor.html` for all routine editing. The remaining source files are provided for maintenance or a future developer. You do not need to edit `.js` or `.cjs` files.

The editor supports up to 100 pages and 12 answer choices per page. It creates exploratory exercises, not graded quizzes or student submissions. Diagram layout is automatic; complex branches may produce crossing lines.

## Verification

Seventeen automated checks cover student routes, browser-history logic, editing, project saving/reopening, draft recovery, validation, Markdown safety, and exported student runtime. They use a DOM/history harness. Visual browser testing has not been performed in this environment; try the included preview in your browser before publishing for class.
