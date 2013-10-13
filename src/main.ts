/// <reference path='typings/typescriptServices.d.ts' />
/// <reference path='typings/brackets.d.ts' />

var AppInit = brackets.getModule("utils/AppInit");
var CodeHintManager = brackets.getModule("editor/CodeHintManager");
var Async = brackets.getModule("utils/Async");
var StringUtils = brackets.getModule("utils/StringUtils");
var LanguageManager = brackets.getModule("language/LanguageManager");

LanguageManager.defineLanguage("typescript", {
    name: "TypeScript",
    mode: ["javascript", "text/typescript"],
    fileExtensions: ["ts"],
    blockComment: ["/*", "*/"],
    lineComment: "//"
});

class TypeScriptCodeHintProvider {
  hasHints(
    editor,
    implicitChar: string): boolean {
    return false;
  }

  getHints(
    implicitChar: string): brackets.CodeHintProvider.Results {
    return null;
  }

  insertHint(
    hint: string): boolean {
    return false;
  }
}

//export = More;