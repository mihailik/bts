/// <reference path='typings/typescriptServices.d.ts' />
/// <reference path='typings/brackets.d.ts' />

/// <reference path='DocumentScriptSnapshot.ts' />

class DocumentState {

  private _version = 0;

  constructor(private _doc: brackets.Document) {
    $(this._doc).on('change', (change) => this._onChange(change));
  }

  getVersion(): number {
    return this._version;
  }

  getSnapshot(): TypeScript.IScriptSnapshot {
    return new DocumentScriptSnapshot(this._doc);
  }

  private _onChange(change): void {
    console.log(change);
    this._version++;
  }
}