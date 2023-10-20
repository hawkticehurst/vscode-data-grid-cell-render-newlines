import { commands, ExtensionContext } from "vscode";
import { DataGridPanel } from "./panels/DataGridPanel";

export function activate(context: ExtensionContext) {
  // Create the show editable data grid command
  const showDataGrid = commands.registerCommand(
    "data-grid-cell-newlines.showDataGrid",
    () => {
      DataGridPanel.render(context.extensionUri);
    }
  );

  // Add command to the extension context
  context.subscriptions.push(showDataGrid);
}
