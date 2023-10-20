"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate
});
module.exports = __toCommonJS(extension_exports);
var import_vscode3 = require("vscode");

// src/panels/DataGridPanel.ts
var import_vscode2 = require("vscode");

// src/utilities/getUri.ts
var import_vscode = require("vscode");
function getUri(webview, extensionUri, pathList) {
  return webview.asWebviewUri(import_vscode.Uri.joinPath(extensionUri, ...pathList));
}

// src/utilities/getNonce.ts
function getNonce() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// src/panels/DataGridPanel.ts
var DataGridPanel = class {
  constructor(panel, extensionUri) {
    this._disposables = [];
    this._panel = panel;
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
  }
  static render(extensionUri) {
    if (DataGridPanel.currentPanel) {
      DataGridPanel.currentPanel._panel.reveal(import_vscode2.ViewColumn.One);
    } else {
      const panel = import_vscode2.window.createWebviewPanel(
        "showDataGrid",
        "Editable Data Grid",
        import_vscode2.ViewColumn.One,
        {
          enableScripts: true,
          localResourceRoots: [import_vscode2.Uri.joinPath(extensionUri, "out")]
        }
      );
      DataGridPanel.currentPanel = new DataGridPanel(panel, extensionUri);
    }
  }
  dispose() {
    DataGridPanel.currentPanel = void 0;
    this._panel.dispose();
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
  _getWebviewContent(webview, extensionUri) {
    const webviewUri = getUri(webview, extensionUri, ["out", "webview.js"]);
    const nonce = getNonce();
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
					<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}';">
          <title>Editable Data Grid</title>
        </head>
        <body>
          <h1>Editable Data Grid</h1>
					<vscode-data-grid id="basic-grid"></vscode-data-grid>
					<script type="module" nonce="${nonce}" src="${webviewUri}"></script>
        </body>
      </html>
    `;
  }
};

// src/extension.ts
function activate(context) {
  const showDataGrid = import_vscode3.commands.registerCommand(
    "data-grid-cell-newlines.showDataGrid",
    () => {
      DataGridPanel.render(context.extensionUri);
    }
  );
  context.subscriptions.push(showDataGrid);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate
});
//# sourceMappingURL=extension.js.map
