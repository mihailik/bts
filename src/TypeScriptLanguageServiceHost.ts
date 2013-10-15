/// <reference path='typings/typescriptServices.d.ts' />
/// <reference path='typings/brackets.d.ts' />

class TypeScriptLanguageServiceHost
  implements Services.ILanguageServiceHost {
    
    private _compilationSettings = new TypeScript.CompilationSettings();
    
    private _scriptCache: { [file: string]: TypeScript.IScriptSnapshot; } = {};

  constructor(private _scriptLookup: (file: string) => TypeScript.IScriptSnapshot) {
  }

  getCompilationSettings(): TypeScript.CompilationSettings {
    return this._compilationSettings;
  }

  getScriptFileNames(): string[] {
    return Object.keys(this._scriptCache);
  }

  getScriptVersion(fileName: string): number {
    throw null;
  }

  getScriptIsOpen(fileName: string): boolean {
    throw null;
  }

  getScriptByteOrderMark(fileName: string): ByteOrderMark {
    throw null;
  }

  getScriptSnapshot(fileName: string): TypeScript.IScriptSnapshot {
    throw null;
  }

  getDiagnosticsObject(): Services.ILanguageServicesDiagnostics {
    throw null;
  }

  getLocalizedDiagnosticMessages(): any {
    throw null;
  }


  // TypeScript.ILogger
  information(): boolean {
    throw null;
  }

  debug(): boolean {
    throw null;
  }

  warning(): boolean {
    throw null;
  }

  error(): boolean {
    throw null;
  }

  fatal(): boolean {
    throw null;
  }

  log(s: string): void {
    throw null;
  }


  // TypeScript.IReferenceResolverHost
    
  // getScriptSnapshot overlaps between IReferenceResolverHost and ILanguageServiceHost
//  getScriptSnapshot(fileName: string): TypeScript.IScriptSnapshot {
//    throw null;
//  }

  resolveRelativePath(path: string, directory: string): string {
    throw null;
  }

  fileExists(path: string): boolean {
    throw null;
  }

  directoryExists(path: string): boolean {
    throw null;
  }

  getParentDirectory(path: string): string {
    throw null;
  }
}