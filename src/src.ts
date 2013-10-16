/// <reference path='typings/typescriptServices.d.ts' />
/// <reference path='typings/brackets.d.ts' />

/// <reference path='TypeScriptCodeHintProvider.ts' />
/// <reference path='DocumentScriptSnapshot.ts' />
/// <reference path='TypeScriptLanguageServiceHost.ts' />

var AppInit = brackets.getModule("utils/AppInit");
var CodeHintManager = brackets.getModule("editor/CodeHintManager");
var Async = brackets.getModule("utils/Async");
var StringUtils = brackets.getModule("utils/StringUtils");
var LanguageManager = brackets.getModule("language/LanguageManager");
var DocumentManager = brackets.getModule("document/DocumentManager");

var llang = LanguageManager.defineLanguage("typescript", {
    name: "TypeScript",
    mode: ["javascript", "text/typescript"],
    fileExtensions: ["ts"],
    blockComment: ["/*", "*/"],
    lineComment: "//"
});

// TODO: remove this
class DocumentStateOld {
  constructor(public doc) {
  }
}

class TypeScriptCodeHintProvider {
  private _editor: any;
  private _log: string[] = ['init'];
  private _docCache: any = {};

  constructor () {
    this._log.push('constructor -- '+llang.constructor.name);
  }

  hasHints(
    editor,
    implicitChar: string): boolean {
    if (this._editor !== editor) {
      this._editor = editor;
      if (this._editor) {
        for (var k in this._editor) if (this._editor.hasOwnProperty(k)) {
          this._log.push(' '+k+'='+editor[k]);
        }
      }
    }

    //var doc = this.getDocument(
    return !implicitChar; // for now avoid hints except on ctrl+Space
  }

  getHints(
    implicitChar: string): any {
    var result = $.Deferred();
    setTimeout(() => {
      var reverseLog: string[] = [];
      for (var i = 0; i < this._log.length; i++) {
        reverseLog[i] = this._log[i];
      }
  
      result.resolve({
        hints: reverseLog,
        match: 'wo',
        selectInitial: true
      });
    }, 500);

    return result;
  }

  insertHint(
    hint: string): boolean {
    this._log.push('insertHint:'+hint);
    return false;
  }

  getDocument(path: string): DocumentStateOld {
    var result: DocumentStateOld = this._docCache[path];
    if (!result) {
      var doc = DocumentManager.getDocumentForPath(path);
      this._docCache[path] = result = new DocumentStateOld(doc);
    }
    return result;
  }
}
var sn = DocumentScriptSnapshot;

CodeHintManager.registerHintProvider(
  new TypeScriptCodeHintProvider(),
  ['typescript'],
  0);

//  AppInit.appReady(function () {
//    CodeHintManager.registerHintProvider(
//      new TypeScriptCodeHintProvider(),
//      ['TypeScript'],
//      0);
//	});

// var none = {};

// export = none;