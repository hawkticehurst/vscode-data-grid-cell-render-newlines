# Data Grid Cell: Render Newlines Demo

This is a demonstration of a potential feature change for the `@vscode/webview-ui-toolkit` that will enable newlines to be rendered in `vscode-data-grid-cell` components. Currently any whitespaces and newlines in data grid cell content are collapsed.

This demo is built on top of the [editable-data-grid sample extension](https://github.com/microsoft/vscode-webview-ui-toolkit-samples/tree/main/default/editable-data-grid) and has been made to explicitly test this new feature against a data grid that implements interactivity/editability via the `contenteditable` attribute.

## Run The Sample

1. Clone the repo locally
2. Navigate into the demo directory (`cd vscode-data-grid-cell-render-newlines`)
3. DO NOT RUN NPM INSTALL!*
4. Open demo in VS Code (`code .`)

*_The `node_modules` directory has been intentionally included in this repo and contains an altered version/build of the `@vscode/webview-ui-toolkit` package with the new feature changes._

Once the sample is open inside VS Code you can run the extension by doing the following:

1. Press `F5` to open a new Extension Development Host window
2. Inside the host window, open the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac) and type `Data Grid Cell Newlines: Show`
