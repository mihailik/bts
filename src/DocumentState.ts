/// <reference path='typings/typescriptServices.d.ts' />
/// <reference path='typings/brackets.d.ts' />
/// <reference path='typings/codemirror.d.ts' />

/// <reference path='DocumentScriptSnapshot.ts' />

class DocumentState {

  constructor(public _doc: CodeMirror.Doc) {
    
  }

  getVersion(): number {
    throw null;
  }

  getSnapshot(): TypeScript.IScriptSnapshot {
    throw null;
  }
}