/// <reference path='typings/typescriptServices.d.ts' />
/// <reference path='typings/brackets.d.ts' />
/// <reference path='TypeScriptLanguageServiceHost.ts' />

/// <reference path='TypeScriptService.ts' />

class TypeScriptCodeHintProvider {
  private _editor: any;
  private _languageService: Services.ILanguageService;
  private _languageHost: TypeScriptLanguageServiceHost;

  constructor (private _documentManager: brackets.DocumentManager) {
    
    this._languageHost = new TypeScriptLanguageServiceHost(
      (file: string) => null);//this._createDocumentState(file));
    
    var factory = new Services.TypeScriptServicesFactory();
    
    this._languageService = factory.createPullLanguageService(this._languageHost);
  }

  hasHints(
    editor,
    implicitChar: string): boolean {
    if (this._editor !== editor) {
      this._editor = editor;
    }

    return !implicitChar; // for now avoid hints except on ctrl+Space
  }

  getHints(
    implicitChar: string): any {

    return null;
  }

  insertHint(
    hint: string): boolean {
    return false;
  }

  private _createDocumentState(file: string): Document {
    return null;
  }
}