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

var TypeScriptCodeHintProvider = (function () {
    function TypeScriptCodeHintProvider() {
    }
    TypeScriptCodeHintProvider.prototype.hasHints = function (editor, implicitChar) {
        return false;
    };

    TypeScriptCodeHintProvider.prototype.getHints = function (implicitChar) {
        return null;
    };

    TypeScriptCodeHintProvider.prototype.insertHint = function (hint) {
        return false;
    };
    return TypeScriptCodeHintProvider;
})();
//# sourceMappingURL=main.js.map
