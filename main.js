define(function(require,exports,module){define(function(require,exports,module){define(function(require,exports,module){define(["require", "exports"], function(require, exports) {
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
    var DocumentStateOld = (function () {
        function DocumentStateOld(doc) {
            this.doc = doc;
        }
        return DocumentStateOld;
    })();

    var TypeScriptCodeHintProvider = (function () {
        function TypeScriptCodeHintProvider() {
            this._log = ['init'];
            this._docCache = {};
            this._log.push('constructor -- ' + llang.constructor.name);
        }
        TypeScriptCodeHintProvider.prototype.hasHints = function (editor, implicitChar) {
            if (this._editor !== editor) {
                this._editor = editor;
                if (this._editor) {
                    for (var k in this._editor)
                        if (this._editor.hasOwnProperty(k)) {
                            this._log.push(' ' + k + '=' + editor[k]);
                        }
                }
            }

            //var doc = this.getDocument(
            return !implicitChar;
        };

        TypeScriptCodeHintProvider.prototype.getHints = function (implicitChar) {
            var _this = this;
            var result = $.Deferred();
            setTimeout(function () {
                var reverseLog = [];
                for (var i = 0; i < _this._log.length; i++) {
                    reverseLog[i] = _this._log[i];
                }

                result.resolve({
                    hints: reverseLog,
                    match: 'wo',
                    selectInitial: true
                });
            }, 500);

            return result;
        };

        TypeScriptCodeHintProvider.prototype.insertHint = function (hint) {
            this._log.push('insertHint:' + hint);
            return false;
        };

        TypeScriptCodeHintProvider.prototype.getDocument = function (path) {
            var result = this._docCache[path];
            if (!result) {
                var doc = DocumentManager.getDocumentForPath(path);
                this._docCache[path] = result = new DocumentStateOld(doc);
            }
            return result;
        };
        return TypeScriptCodeHintProvider;
    })();
    var sn = DocumentScriptSnapshot;

    CodeHintManager.registerHintProvider(new TypeScriptCodeHintProvider(), ['typescript'], 0);

    //  AppInit.appReady(function () {
    //    CodeHintManager.registerHintProvider(
    //      new TypeScriptCodeHintProvider(),
    //      ['TypeScript'],
    //      0);
    //	});
    var none = {};

    
    return none;
});
//# sourceMappingURL=main.js.map
})})})