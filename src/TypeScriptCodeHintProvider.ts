/// <reference path='typings/typescriptServices.d.ts' />
/// <reference path='typings/brackets.d.ts' />

/// <reference path='TypeScriptService.ts' />

class TypeScriptCodeHintProvider {
  private _editor: any;
  private _service = new TypeScriptService();

  constructor (private _documentManager: brackets.DocumentManager) {
    this._service.resolveScript = (file:string) => this._resolveScript(file);
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
    console.log('getCurrentDocument...');
    var doc = this._documentManager.getCurrentDocument();
    var path = doc.file.fullPath;
    var result = $.Deferred();
    console.log('getCompletionsAtPosition...');
    var completionPromise = this._service.getCompletionsAtPosition(path, 2, false);
    completionPromise.done((x,y) => {
      console.log('completionPromise.done'+x+y+'...');
    });
  }

  insertHint(
    hint: string): boolean {
    return false;
  }

  private _resolveScript(file:string): any {
  }
}