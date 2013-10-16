/// <reference path='typings/typescriptServices.d.ts' />
/// <reference path='typings/brackets.d.ts' />
/// <reference path='typings/codemirror.d.ts' />
var DocumentScriptSnapshot = (function () {
    function DocumentScriptSnapshot() {
    }
    DocumentScriptSnapshot.prototype.getText = function (start, end) {
        throw null;
    };

    DocumentScriptSnapshot.prototype.getLength = function () {
        throw null;
    };

    DocumentScriptSnapshot.prototype.getLineStartPositions = function () {
        throw null;
    };

    DocumentScriptSnapshot.prototype.getTextChangeRangeSinceVersion = function (scriptVersion) {
        throw null;
    };
    return DocumentScriptSnapshot;
})();
/// <reference path='typings/typescriptServices.d.ts' />
/// <reference path='typings/brackets.d.ts' />
/// <reference path='typings/codemirror.d.ts' />
/// <reference path='DocumentScriptSnapshot.ts' />
var DocumentState = (function () {
    function DocumentState(_doc) {
        this._doc = _doc;
    }
    DocumentState.prototype.getVersion = function () {
        throw null;
    };

    DocumentState.prototype.getSnapshot = function () {
        throw null;
    };
    return DocumentState;
})();
/// <reference path='typings/typescriptServices.d.ts' />
/// <reference path='typings/brackets.d.ts' />
/// <reference path='DocumentState.ts' />
var TypeScriptLanguageServiceHost = (function () {
    function TypeScriptLanguageServiceHost(_scriptLookup) {
        this._scriptLookup = _scriptLookup;
        this._compilationSettings = new TypeScript.CompilationSettings();
        this._scriptCache = {};
    }
    TypeScriptLanguageServiceHost.prototype._getScript = function (file) {
        var result = this._scriptCache[file];
        if (result)
            return result;

        result = this._scriptLookup(file);
        if (result)
            this._scriptCache[file] = result;

        return result;
    };

    TypeScriptLanguageServiceHost.prototype.getCompilationSettings = function () {
        return this._compilationSettings;
    };

    TypeScriptLanguageServiceHost.prototype.getScriptFileNames = function () {
        return Object.keys(this._scriptCache);
    };

    TypeScriptLanguageServiceHost.prototype.getScriptVersion = function (fileName) {
        var script = this._getScript(fileName);
        return script.getVersion();
    };

    TypeScriptLanguageServiceHost.prototype.getScriptIsOpen = function (fileName) {
        return this._getScript(fileName) !== null;
    };

    TypeScriptLanguageServiceHost.prototype.getScriptByteOrderMark = function (fileName) {
        return 0 /* None */;
    };

    TypeScriptLanguageServiceHost.prototype.getScriptSnapshot = function (fileName) {
        var script = this._getScript(fileName);
        if (script)
            return script.getSnapshot();
        else
            return null;
    };

    TypeScriptLanguageServiceHost.prototype.getDiagnosticsObject = function () {
        // TODO: differention ILogger.log from ILanguageServiceDiagnostics.log
        return this;
    };

    TypeScriptLanguageServiceHost.prototype.getLocalizedDiagnosticMessages = function () {
        return null;
    };

    // TypeScript.ILogger
    TypeScriptLanguageServiceHost.prototype.information = function () {
        throw null;
    };

    TypeScriptLanguageServiceHost.prototype.debug = function () {
        throw null;
    };

    TypeScriptLanguageServiceHost.prototype.warning = function () {
        throw null;
    };

    TypeScriptLanguageServiceHost.prototype.error = function () {
        throw null;
    };

    TypeScriptLanguageServiceHost.prototype.fatal = function () {
        throw null;
    };

    TypeScriptLanguageServiceHost.prototype.log = function (s) {
        throw null;
    };

    // TypeScript.IReferenceResolverHost
    // getScriptSnapshot overlaps between IReferenceResolverHost and ILanguageServiceHost
    //  getScriptSnapshot(fileName: string): TypeScript.IScriptSnapshot {
    //    throw null;
    //  }
    TypeScriptLanguageServiceHost.prototype.resolveRelativePath = function (path, directory) {
        throw null;
    };

    TypeScriptLanguageServiceHost.prototype.fileExists = function (path) {
        throw null;
    };

    TypeScriptLanguageServiceHost.prototype.directoryExists = function (path) {
        throw null;
    };

    TypeScriptLanguageServiceHost.prototype.getParentDirectory = function (path) {
        throw null;
    };
    return TypeScriptLanguageServiceHost;
})();
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
