/// <reference path='typings/typescriptServices.d.ts' />
/// <reference path='typings/brackets.d.ts' />

/// <reference path='DocumentState.ts' />

class TypeScriptLanguageServiceHost
  implements Services.ILanguageServiceHost {
    
    private _compilationSettings = new TypeScript.CompilationSettings();
    
    private _scriptCache: any = {};

  constructor(private _scriptLookup: (file: string) => DocumentScriptSnapshot) {
  }

  private _getScript(file: string): DocumentState {
    var result = this._scriptCache[file];
    if (result)
      return result;

    result = this._scriptLookup(file);
    if (result)
      this._scriptCache[file] = result;

    return result;
  }

  getCompilationSettings(): TypeScript.CompilationSettings {
    return this._compilationSettings;
  }

  getScriptFileNames(): string[] {
    return Object.keys(this._scriptCache);
  }

  getScriptVersion(fileName: string): number {
    var script = this._getScript(fileName);
    return script.getVersion();
  }

  getScriptIsOpen(fileName: string): boolean {
    return this._getScript(fileName) !== null;
  }

  getScriptByteOrderMark(fileName: string): ByteOrderMark {
    return ByteOrderMark.None;
  }

  getScriptSnapshot(fileName: string): TypeScript.IScriptSnapshot {
    var script = this._getScript(fileName);
    if (script)
      return script.getSnapshot();
    else
      return null;
  }

  getDiagnosticsObject(): Services.ILanguageServicesDiagnostics {
    // TODO: differention ILogger.log from ILanguageServiceDiagnostics.log
    return this;
  }

  getLocalizedDiagnosticMessages(): any {
    return null;
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