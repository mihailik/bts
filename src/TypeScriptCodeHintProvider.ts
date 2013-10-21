/// <reference path='typings/typescriptServices.d.ts' />
/// <reference path='typings/brackets.d.ts' />

/// <reference path='TypeScriptService.ts' />
/// <reference path='DocumentManagerScriptLoader.ts' />


class TypeScriptCodeHintProvider {
  private _editor: any;
  private _service = new TypeScriptService();
  private _scriptLoader;

  constructor (private _documentManager: brackets.DocumentManager) {
    this._service.resolveScript = (file:string) => this._resolveScript(file);
    this._scriptLoader = new DocumentManagerScriptLoader(this._documentManager);
  }

  hasHints(
    editor,
    implicitChar: string): boolean {
    if (this._editor !== editor) {
      this._editor = editor;
    }

    return !implicitChar; // for now avoid hints except on ctrl+Space
  }

  getHints(
    implicitChar: string): any {
    var doc = this._documentManager.getCurrentDocument();
    var path = doc.file.fullPath;
    var result = $.Deferred();

    var cursorPos = this._editor.getCursorPos();
    var index = this._editor['_codeMirror'].indexFromPos(cursorPos);
    console.log('getCompletionsAtPosition...');
    var completionPromise = this._service.getCompletionsAtPosition(path, index, false);
    completionPromise.done((x,y) => {
      console.log('completionPromise.done',x,y,'...');
    });
  }

  insertHint(
    hint: string): boolean {
    return false;
  }

  private _resolveScript(file:string): any {
    var load = this._scriptLoader.loadScript(file);
    return load;
  }
}