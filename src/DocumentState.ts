/// <reference path='typings/typescriptServices.d.ts' />
/// <reference path='typings/brackets.d.ts' />

/// <reference path='DocumentScriptSnapshot.ts' />

class DocumentState {

  private _version = 0;
  private _changes: { offset: number; oldLength: number; newLength: number; }[] = [];

  constructor(private _doc: brackets.Document) {
    $(this._doc).on('change', (e,doc,change) => this._onChange(change));
  }

  getVersion(): number {
    return this._changes.length;
  }

  getSnapshot(): TypeScript.IScriptSnapshot {
    return new DocumentScriptSnapshot(this._doc, this._changes);
  }

  private _onChange(change): void {
    var ch = {
      offset: this._indexFromPos(change.from),
      oldLength: this._linesLength(change.removed),
      newLength: this._linesLength(change.text)
    };
    this._changes.push(ch) ;
  }
                        
  private _linesLength(lines: string[]): number {
    var length = 0;
    for (var i = 0; i < lines.length; i++) {
      if (i>0)
        length++; // '\n'

      length += lines[i].length;
    }
    return length;
  }
  
  private _indexFromPos(pos) {
    return 0;
  }
}