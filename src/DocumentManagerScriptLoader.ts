/// <reference path='typings/brackets.d.ts' />
/// <reference path='typings/typescriptServices.d.ts' />

/// <reference path='DocumentState.ts' />

class DocumentManagerScriptLoader {
  constructor (private _documentManager: brackets.DocumentManager) {
  }

  loadScript(file: string): JQueryPromiseTyped<DocumentState> {
    var getDocument = this._documentManager.getDocumentForPath(file);
    var  createDocumentState = (<any>getDocument).then(doc => this._loadDocumentState(doc));
    return createDocumentState;
  }

  private _loadDocumentState(document: brackets.Document): DocumentState {
    return new DocumentState(document);
  }
}