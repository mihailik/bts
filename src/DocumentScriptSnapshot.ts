/// <reference path='typings/typescriptServices.d.ts' />
/// <reference path='typings/brackets.d.ts' />

class DocumentScriptSnapshot implements TypeScript.IScriptSnapshot {
  static empty = {
    getText: (start, end) => '',
    getLength: () => 0,
    getLineStartPositions: () => [],
    getTextChangeRangeSinceVersion: (scriptVersion) => TypeScript.TextChangeRange.unchanged
  };

  constructor(private _doc: brackets.Document) {
  }

  getText(start: number, end: number): string {
    return '';
  }

  getLength(): number {
    return 0;
  }

  getLineStartPositions(): number[] {
    return [];
  }

  getTextChangeRangeSinceVersion(scriptVersion: number): TypeScript.TextChangeRange {
    return TypeScript.TextChangeRange.unchanged;
  }
}