/// <reference path='typings/typescriptServices.d.ts' />

class TypeScriptService {

  logLevels = {
    information: true,
    debug: true,
    warning: true,
    error: true,
    fatal: true
  };
  
  compilationSettings = new TypeScript.CompilationSettings();

  resolveScript: (file: string) => any = null;

  private _scriptCache: any = {};
  private _requestedFiles: any = {};
  private _requestContinuations: { (): void; }[] = [];
  
  private _service: Services.ILanguageService;

  constructor() {
    var factory = new Services.TypeScriptServicesFactory();
    this._service = factory.createPullLanguageService(this._createLanguageServiceHost());
  }

  getCompletionsAtPosition(
    file: string,
    position: number,
    isMemberCompletion: boolean): JQueryPromise {
        
    var promise = $.Deferred(); 
    
    var attempt = () => {
      var result = this._service.getCompletionsAtPosition(
        file, position, isMemberCompletion);

      if (this._requestedFiles.length==0) {
        promise.resolve(result);
      }
      else {
        this._requestContinuations.push(attempt);
      }
    }

    attempt();

    return promise;
  }

  private _log(text: string): void {
    console.log(text);
  }

  private _getScript(fileName: string): TypeScriptService.ScriptState {
    var script = this._scriptCache[fileName];
    var resolveResult = this.resolveScript ? this.resolveScript(fileName) : null;
    if (!resolveResult)
      return null;
    if (resolveResult.getSnapshot) {
      this._scriptCache[fileName] = resolveResult;
      return resolveResult;
    }
    else {
      this._requestedFiles[fileName] = true;
      resolveResult.done((script: TypeScriptService.ScriptState) => {
        delete this._requestedFiles[fileName];
        if (Object.keys(this._requestedFiles).length==0) {
          if (this._requestContinuations.length) {
            var continuations = this._requestContinuations;
            this._requestContinuations = [];
            for (var i=0; i<continuations.length; i++) {
              var co = continuations[i];
              co();
            }
          }        
        }
      });
    }

    if (script)
      return script;

    return null;
  }
  
  private _createLanguageServiceHost() {
    return {
      getCompilationSettings: () => this.compilationSettings,
      getScriptFileNames: () => Object.keys(this._scriptCache),
      getScriptVersion: (fileName: string) => {
        var script = this._getScript(fileName);
        if (script && script.getVersion)
          return script.getVersion();
        else
          return -1;
      },
      getScriptIsOpen: (fileName: string) => this._scriptCache[fileName] ? true : false,
      getScriptByteOrderMark: (fileName: string) => ByteOrderMark.None,
      getScriptSnapshot: (fileName: string) => {
        var script = this._getScript(fileName);
        if (script && script.getSnapshot)
          return script.getSnapshot();
        else
          return null;
      },
      getDiagnosticsObject: () => {
        return { log: (text:string) => this._log(text) };
      },
      getLocalizedDiagnosticMessages: () => null,
      information: () => this.logLevels.information,
      debug: () => this.logLevels.debug,
      warning: () => this.logLevels.warning,
      error: () => this.logLevels.error,
      fatal: () => this.logLevels.fatal,
      log: (text: string) => this._log(text),
      resolveRelativePath: (path: string) => path,
      fileExists: (path: string) => {
        // don't issue a full resolve,
        // this might be a mere probe for a file
        return this._scriptCache[path] ? true : false;
      },
      directoryExists: (path: string) => true,
      getParentDirectory: (path: string) => {
        path = TypeScript.switchToForwardSlashes(path);
        var slashPos = path.lastIndexOf('/');
        if (slashPos===path.length-1)
          slashPos = path.lastIndexOf('/', path.length-2);
        if (slashPos>0)
          return path.slice(0,slashPos);
        else
          return '/';
      }
    }
  }
}
                                              
module TypeScriptService {
  export interface ScriptState {
    getVersion(): number;
    getSnapshot(): TypeScript.IScriptSnapshot;
  }
}