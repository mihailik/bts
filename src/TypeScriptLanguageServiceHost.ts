/// <reference path='typings/typescriptServices.d.ts' />
/// <reference path='typings/brackets.d.ts' />

/// <reference path='DocumentState.ts' />

class TypeScriptLanguageServiceHost
  implements Services.ILanguageServiceHost {
    
  logLevels: any = {
    information: true,
    debug: true,
    warning: true,
    error: true,
    fatal: true
  };
  
  private _compilationSettings = new TypeScript.CompilationSettings();
  
  private _scriptCache: any = {};
  private _logLines: string[] = [];

  constructor(private _scriptLookup: (file: string) => DocumentState) {
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
    return this.logLevels.information;
  }

  debug(): boolean {
    return this.logLevels.debug;
  }

  warning(): boolean {
    return this.logLevels.warning;
  }

  error(): boolean {
    return this.logLevels.error;
  }

  fatal(): boolean {
    return this.logLevels.fatal;
  }

  log(s: string): void {
    this._logLines.push(s);
  }


  // TypeScript.IReferenceResolverHost
    
  // getScriptSnapshot overlaps between IReferenceResolverHost and ILanguageServiceHost
//  getScriptSnapshot(fileName: string): TypeScript.IScriptSnapshot {
//    throw null;
//  }

  resolveRelativePath(path: string, directory: string): string {
    var unQuotedPath = TypeScript.stripStartAndEndQuotes(path);
    var normalizedPath;

    if (TypeScript.isRooted(unQuotedPath) || !directory) {
        normalizedPath = unQuotedPath;
    } else {
        normalizedPath = directory + '/' + unQuotedPath;
    }

    normalizedPath = TypeScript.switchToForwardSlashes(normalizedPath);

    return normalizedPath;
  }

  fileExists(path: string): boolean {
    var script = this._getScript(path);
    return script ? true : false;
  }

  directoryExists(path: string): boolean {
    return true;
  }

  getParentDirectory(path: string): string {
    var normalizedPath = TypeScript.stripStartAndEndQuotes(path);
    normalizedPath = TypeScript.switchToForwardSlashes(normalizedPath);

    var lastSlash = normalizedPath[normalizedPath.length-1] ?
        normalizedPath.lastIndexOf('/', normalizedPath.length-2) :
        normalizedPath.lastIndexOf('/');

    if (lastSlash>1)
      return normalizedPath.slice(0,lastSlash-1);
    else
      return '/';
  }
}