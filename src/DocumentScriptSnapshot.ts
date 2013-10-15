/// <reference path='typings/typescriptServices.d.ts' />
/// <reference path='typings/brackets.d.ts' />
/// <reference path='typings/codemirror.d.ts' />

class DocumentScriptSnapshot implements TypeScript.IScriptSnapshot {
  
  constructor(private _doc: CodeMirror.Doc) {
  }

  getText(start: number, end: number): string {
    throw null;
  }

  getLength(): number {
    throw null;
  }

  getLineStartPositions(): number[] {
    throw null;
  }

  getTextChangeRangeSinceVersion(scriptVersion: number): TypeScript.TextChangeRange {
    throw null;
  }
}