/// <reference path='typings/typescriptServices.d.ts' />
/// <reference path='typings/brackets.d.ts' />

class DocumentScriptSnapshot implements TypeScript.IScriptSnapshot {
  static empty = {
    getText: (start, end) => '',
    getLength: () => 0,
    getLineStartPositions: () => [],
    getTextChangeRangeSinceVersion: (scriptVersion) => TypeScript.TextChangeRange.unchanged
  };

  constructor(
    private _docState: {
      changes: { offset: number; oldLength: number; newLength: number; }[];
      doc: brackets.Document;
      posFromIndex(index: number): {line:number;ch:number;};
      indexFromPos(pos: {line:number;ch:number;}): number;
      lineCount(): number;
      getLine(n:number): string;
    }) {
  }

  getText(start: number, end: number): string {
    var startPos = this._docState.posFromIndex(start);
    var endPos = this._docState.posFromIndex(end);
    var text = this._docState.doc.getRange(startPos, endPos);
    return text;
  }

  getLength(): number {
    var lineCount = this._docState.lineCount();
    if (lineCount===0)
      return 0;

    var lastLineStart = this._docState.indexFromPos({line:lineCount-1,ch:0});
    var lastLine = this._docState.getLine(lineCount-1);
    return lastLineStart + lastLine.length;
  }

  getLineStartPositions(): number[] {
    var lineCount = this._docState.lineCount();
    var result: number[] = [];
    for (var i = 0; i < lineCount; i++) {
      
    }
    return result;
  }

  getTextChangeRangeSinceVersion(scriptVersion: number): TypeScript.TextChangeRange {
    var changeRanges = this._docState.changes.map(change =>
      new TypeScript.TextChangeRange(
        TypeScript.TextSpan.fromBounds(change.offset, change.offset+change.oldLength),
        change.newLength));
    
    return TypeScript.TextChangeRange.collapseChangesAcrossMultipleVersions(changeRanges);
  }
}