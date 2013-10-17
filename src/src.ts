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


CodeHintManager.registerHintProvider(
  new TypeScriptCodeHintProvider(DocumentManager),
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