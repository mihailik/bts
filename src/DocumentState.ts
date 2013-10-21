/// <reference path='typings/typescriptServices.d.ts' />
/// <reference path='typings/brackets.d.ts' />

/// <reference path='DocumentScriptSnapshot.ts' />

class DocumentState {

  changes: { offset: number; oldLength: number; newLength: number; }[] = [];

  constructor(public doc: brackets.Document) {
    $(this.doc).on('change', (e,doc,change) => this._onChange(change));
  }

  getVersion(): number {
    return this.changes.length;
  }

  getSnapshot(): TypeScript.IScriptSnapshot {
    return new DocumentScriptSnapshot(this);
  }

  private _onChange(change): void {
    var ch = {
      offset: this.indexFromPos(change.from),
      oldLength: this._totalLengthOfLines(change.removed),
      newLength: this._totalLengthOfLines(change.text)
    };
    this.changes.push(ch) ;
  }
                        
  private _totalLengthOfLines(lines: string[]): number {
    var length = 0;
    for (var i = 0; i < lines.length; i++) {
      if (i>0)
        length++; // '\n'

      length += lines[i].length;
    }
    return length;
  }
  
  indexFromPos(pos: {line:number;ch:number;}): number {
    var index = this.doc['_masterEditor']._codeMirror.indexFromPos(pos);
    return index;
  }

  posFromIndex(index: number): {line:number;ch:number;} {
    var pos = this.doc['_masterEditor']._codeMirror.posFromIndex(index);
    return pos;
  }

  lineCount(): number {
    var lineCount = this.doc['_masterEditor']._codeMirror.lineCount();
    return lineCount;
  }

  getLine(n: number): string {
    var line = this.doc['_masterEditor']._codeMirror.getLine(n);
    return line;
  }
}