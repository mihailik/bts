/// <reference path='typings/typescriptServices.d.ts' />
/// <reference path='typings/brackets.d.ts' />
/// <reference path='typings/codemirror.d.ts' />
var DocumentScriptSnapshot = (function () {
    function DocumentScriptSnapshot(_doc) {
        this._doc = _doc;
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
var TypeScriptLanguageServiceHost = (function () {
    function TypeScriptLanguageServiceHost(_scriptLookup) {
        this._scriptLookup = _scriptLookup;
        this._compilationSettings = new TypeScript.CompilationSettings();
        this._scriptCache = {};
    }
    TypeScriptLanguageServiceHost.prototype.getCompilationSettings = function () {
        return this._compilationSettings;
    };

    TypeScriptLanguageServiceHost.prototype.getScriptFileNames = function () {
        return Object.keys(this._scriptCache);
    };

    TypeScriptLanguageServiceHost.prototype.getScriptVersion = function (fileName) {
        throw null;
    };

    TypeScriptLanguageServiceHost.prototype.getScriptIsOpen = function (fileName) {
        throw null;
    };

    TypeScriptLanguageServiceHost.prototype.getScriptByteOrderMark = function (fileName) {
        throw null;
    };

    TypeScriptLanguageServiceHost.prototype.getScriptSnapshot = function (fileName) {
        throw null;
    };

    TypeScriptLanguageServiceHost.prototype.getDiagnosticsObject = function () {
        throw null;
    };

    TypeScriptLanguageServiceHost.prototype.getLocalizedDiagnosticMessages = function () {
        throw null;
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
//# sourceMappingURL=main.js.map
