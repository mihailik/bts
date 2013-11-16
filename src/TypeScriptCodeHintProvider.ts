/// <reference path='typings/typescriptServices.d.ts' />
/// <reference path='typings/jquery.d.ts' />
/// <reference path='typings/brackets.d.ts' />

/// <reference path='TypeScriptService.ts' />
/// <reference path='DocumentManagerScriptLoader.ts' />


class TypeScriptCodeHintProvider {
  private _editor: any;
  private _service = new TypeScriptService();
  private _scriptLoader;
  private _hintRequest = 0;

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
    this._hintRequest++;

    return !implicitChar; // for now avoid hints except on ctrl+Space
  }

  getHints(
    implicitChar: string): any {

    this._hintRequest++;

    var doc = this._documentManager.getCurrentDocument();
    var path = ''+(<any>doc.file).fullPath;
    var result = $.Deferred();

    var cursorPos = this._editor.getCursorPos();
    var index = this._editor['_codeMirror'].indexFromPos(cursorPos);

    var logStr = 'getCompletionsAtPosition('+index+','+path+')...';
    if (cursorPos.ch>0) {
      logStr += ' // '+doc.getRange({line:cursorPos.line,ch:0},cursorPos)+'|';
    }
    console.log(logStr);

    var rememberHintRequest = this._hintRequest;

    var completionPromise = this._service.getCompletionsAtPosition(path, index, false);
    completionPromise.done((x: TypeScript.Services.CompletionInfo) => {

      if (rememberHintRequest != this._hintRequest) {
        console.log('completionPromise.done out of time:',x);
        result.reject();
        return;
      }

      if (!x) {
        console.log('completionPromise.done: null');
        result.reject();
        return;
      }
    
      console.log('completionPromise.done:',x);

      var filteredEntries = x.entries.filter((e) => e.kind!=='keyword' && e.kind!=='primitive type');
      var convertedEntries = filteredEntries.map((e) => e.name + ' /*'+e.kindModifiers+'*'+e.kind+'*/');

      result.resolve({
        hints: convertedEntries
      });
    });

    return result;
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