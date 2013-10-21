/// <reference path='typings/typescriptServices.d.ts' />
/// <reference path='typings/brackets.d.ts' />

/// <reference path='TypeScriptCodeHintProvider.ts' />

var AppInit = brackets.getModule('utils/AppInit');
var CodeHintManager = brackets.getModule('editor/CodeHintManager');
var Async = brackets.getModule('utils/Async');
var StringUtils = brackets.getModule('utils/StringUtils');
var LanguageManager = brackets.getModule('language/LanguageManager');
var DocumentManager = brackets.getModule('document/DocumentManager');

declare var require;
console.log("require('src/imports/typescript/typescriptServices');...");
require('src/imports/typescript/typescriptServices');

var llang = LanguageManager.defineLanguage("typescript", {
    name: "TypeScript",
    mode: ["javascript", "text/typescript"],
    fileExtensions: ["ts"],
    blockComment: ["/*", "*/"],
    lineComment: "//"
});

CodeHintManager.registerHintProvider(
  new TypeScriptCodeHintProvider(DocumentManager),
  ['typescript'],
  0);
