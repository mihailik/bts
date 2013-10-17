/// <reference path='typings/typescriptServices.d.ts' />
/// <reference path='typings/brackets.d.ts' />
/// <reference path='typings/codemirror.d.ts' />

/// <reference path='DocumentScriptSnapshot.ts' />

class DocumentState {

  private _version = 0;

  constructor(public _doc: CodeMirror.Doc) {
    CodeMirror.on(_doc, 'change', (instance: CodeMirror.Doc, change: CodeMirror.EditorChange) => this._onChange(change));
  }

  getVersion(): number {
    return this._version;
  }

  getSnapshot(): TypeScript.IScriptSnapshot {
    throw null;
  }

  private _onChange(change: CodeMirror.EditorChange): void {
    this._version++;
  }
}