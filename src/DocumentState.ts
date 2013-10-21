/// <reference path='typings/typescriptServices.d.ts' />
/// <reference path='typings/brackets.d.ts' />

class DocumentState implements TypeScript.IScriptSnapshot {

  private _version = 0;
  private _changes: TypeScript.TextChangeRange[] = [];

  constructor(private _doc: brackets.Document) {
    $(this._doc).on('change', (e,doc,change) => this._onChange(change));
  }

  /**
   * Not a part of IScriptSnapshot, unlike other public methods here.
   * Need to find out who's calling into this (and kill them, naturally).
   */
  getVersion(): number {
    return this._version;
  }

  getText(start: number, end: number): string {
    var startPos = this._posFromIndex(start);
    var endPos = this._posFromIndex(end);
    var text = this._doc.getRange(startPos, endPos);
    return text;
  }

  getLength(): number {
    var lineCount = this._lineCount();
    if (lineCount===0)
      return 0;

    var lastLineStart = this._indexFromPos({line:lineCount-1,ch:0});
    var lastLine = this._getLine(lineCount-1);
    return lastLineStart + lastLine.length;
  }

  getLineStartPositions(): number[] {
    var result: number[] = [];
    var current = 0;
    this._doc['_masterEditor']._codeMirror.eachLine((lineHandle) => {
      result.push(current);
      current += lineHandle.length+1; // plus EOL character
    });
    return result;
  }

  getTextChangeRangeSinceVersion(scriptVersion: number): TypeScript.TextChangeRange {
    var startVersion = this._version - this._changes.length;
    if (scriptVersion < startVersion) {
      var wholeText = this._doc.getText();
      return new TypeScript.TextChangeRange(
        TypeScript.TextSpan.fromBounds(0,0),
        wholeText.length);
    }

    var chunk: TypeScript.TextChangeRange[];

     if (scriptVersion = startVersion)
      chunk = this._changes;
    else
      chunk = this._changes.slice(scriptVersion - startVersion);
    this._changes.length = 0;
    return TypeScript.TextChangeRange.collapseChangesAcrossMultipleVersions(this._changes);
  }


  private _onChange(change): void {
    var offset = this._indexFromPos(change.from);
    var oldLength = this._totalLengthOfLines(change.removed);
    var newLength = this._totalLengthOfLines(change.text);

    var ch = new TypeScript.TextChangeRange(
        TypeScript.TextSpan.fromBounds(offset, offset+oldLength),
        newLength);

    this._changes.push(ch) ;

    this._version++;
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

  private _indexFromPos(pos: {line:number;ch:number;}): number {
    var index = this._doc['_masterEditor']._codeMirror.indexFromPos(pos);
    return index;
  }

  private _posFromIndex(index: number): {line:number;ch:number;} {
    var pos = this._doc['_masterEditor']._codeMirror.posFromIndex(index);
    return pos;
  }

  private _lineCount(): number {
    var lineCount = this._doc['_masterEditor']._codeMirror.lineCount();
    return lineCount;
  }

  private _getLine(n: number): string {
    var line = this._doc['_masterEditor']._codeMirror.getLine(n);
    return line;
  }
}