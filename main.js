define(function(require,exports,module){/// <reference path='typings/typescriptServices.d.ts' />
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
        var _this = this;
        this._doc = _doc;
        this._version = 0;
        CodeMirror.on(_doc, 'change', function (instance, change) {
            return _this._onChange(change);
        });
    }
    DocumentState.prototype.getVersion = function () {
        return this._version;
    };

    DocumentState.prototype.getSnapshot = function () {
        throw null;
    };

    DocumentState.prototype._onChange = function (change) {
        this._version++;
    };
    return DocumentState;
})();
/// <reference path='typings/typescriptServices.d.ts' />
/// <reference path='typings/brackets.d.ts' />
/// <reference path='DocumentState.ts' />
var TypeScriptLanguageServiceHost = (function () {
    function TypeScriptLanguageServiceHost(_scriptLookup) {
        this._scriptLookup = _scriptLookup;
        this.logLevels = {
            information: true,
            debug: true,
            warning: true,
            error: true,
            fatal: true
        };
        this._compilationSettings = new TypeScript.CompilationSettings();
        this._scriptCache = {};
        this._logLines = [];
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
        return this.logLevels.information;
    };

    TypeScriptLanguageServiceHost.prototype.debug = function () {
        return this.logLevels.debug;
    };

    TypeScriptLanguageServiceHost.prototype.warning = function () {
        return this.logLevels.warning;
    };

    TypeScriptLanguageServiceHost.prototype.error = function () {
        return this.logLevels.error;
    };

    TypeScriptLanguageServiceHost.prototype.fatal = function () {
        return this.logLevels.fatal;
    };

    TypeScriptLanguageServiceHost.prototype.log = function (s) {
        this._logLines.push(s);
    };

    // TypeScript.IReferenceResolverHost
    // getScriptSnapshot overlaps between IReferenceResolverHost and ILanguageServiceHost
    //  getScriptSnapshot(fileName: string): TypeScript.IScriptSnapshot {
    //    throw null;
    //  }
    TypeScriptLanguageServiceHost.prototype.resolveRelativePath = function (path, directory) {
        var unQuotedPath = TypeScript.stripStartAndEndQuotes(path);
        var normalizedPath;

        if (TypeScript.isRooted(unQuotedPath) || !directory) {
            normalizedPath = unQuotedPath;
        } else {
            normalizedPath = directory + '/' + unQuotedPath;
        }

        normalizedPath = TypeScript.switchToForwardSlashes(normalizedPath);

        return normalizedPath;
    };

    TypeScriptLanguageServiceHost.prototype.fileExists = function (path) {
        var script = this._getScript(path);
        return script ? true : false;
    };

    TypeScriptLanguageServiceHost.prototype.directoryExists = function (path) {
        return true;
    };

    TypeScriptLanguageServiceHost.prototype.getParentDirectory = function (path) {
        var normalizedPath = TypeScript.stripStartAndEndQuotes(path);
        normalizedPath = TypeScript.switchToForwardSlashes(normalizedPath);

        var lastSlash = normalizedPath[normalizedPath.length - 1] ? normalizedPath.lastIndexOf('/', normalizedPath.length - 2) : normalizedPath.lastIndexOf('/');

        if (lastSlash > 1)
            return normalizedPath.slice(0, lastSlash - 1);
        else
            return '/';
    };
    return TypeScriptLanguageServiceHost;
})();
/// <reference path='typings/typescriptServices.d.ts' />
var TypeScriptService = (function () {
    function TypeScriptService() {
        var _this = this;
        this.logLevels = {
            information: true,
            debug: true,
            warning: true,
            error: true,
            fatal: true
        };
        this.compilationSettings = new TypeScript.CompilationSettings();
        this.resolveScript = null;
        this._scriptCache = {};
        this._requestedFiles = {};
        this._requestContinuations = [];
        var factory = new Services.TypeScriptServicesFactory();
        this._service = factory.createPullLanguageService({
            getCompilationSettings: function () {
                return _this.compilationSettings;
            },
            getScriptFileNames: function () {
                return Object.keys(_this._scriptCache);
            },
            getScriptVersion: function (fileName) {
                var script = _this._getScript(fileName);
                if (script && script.getVersion)
                    return script.getVersion();
                else
                    return -1;
            },
            getScriptIsOpen: function (fileName) {
                return _this._scriptCache[fileName] ? true : false;
            },
            getScriptByteOrderMark: function (fileName) {
                return 0 /* None */;
            },
            getScriptSnapshot: function (fileName) {
                var script = _this._getScript(fileName);
                if (script && script.getSnapshot)
                    return script.getSnapshot();
                else
                    return null;
            },
            getDiagnosticsObject: function () {
                return { log: function (text) {
                        return _this._log(text);
                    } };
            },
            getLocalizedDiagnosticMessages: function () {
                return null;
            },
            information: function () {
                return _this.logLevels.information;
            },
            debug: function () {
                return _this.logLevels.debug;
            },
            warning: function () {
                return _this.logLevels.warning;
            },
            error: function () {
                return _this.logLevels.error;
            },
            fatal: function () {
                return _this.logLevels.fatal;
            },
            log: function (text) {
                return _this._log(text);
            },
            resolveRelativePath: function (path) {
                return path;
            },
            fileExists: function (path) {
                // don't issue a full resolve,
                // this might be a mere probe for a file
                return _this._scriptCache[path] ? true : false;
            },
            directoryExists: function (path) {
                return true;
            },
            getParentDirectory: function (path) {
                path = TypeScript.switchToForwardSlashes(path);
                var slashPos = path.lastIndexOf('/');
                if (slashPos === path.length - 1)
                    slashPos = path.lastIndexOf('/', path.length - 2);
                if (slashPos > 0)
                    return path.slice(0, slashPos);
                else
                    return '/';
            }
        });
    }
    TypeScriptService.prototype.getCompletionsAtPosition = function (file, position, isMemberCompletion) {
        var promise = $.Deferred();

        function attempt() {
            var result = this._service.getCompletionsAtPosition(file, position, isMemberCompletion);

            if (this._requestedFiles.length == 0) {
                promise.resolve(result);
            } else {
                this._requestContinuations.push(attempt);
            }
        }

        attempt();

        return promise;
    };

    TypeScriptService.prototype._log = function (text) {
        console.log(text);
    };

    TypeScriptService.prototype._getScript = function (fileName) {
        var _this = this;
        var script = this._scriptCache[fileName];
        var resolveResult = this.resolveScript ? this.resolveScript(fileName) : null;
        if (!resolveResult)
            return null;
        if (resolveResult.getSnapshot) {
            this._scriptCache[fileName] = resolveResult;
            return resolveResult;
        } else {
            this._requestedFiles[fileName] = true;
            resolveResult.done(function (script) {
                delete _this._requestedFiles[fileName];
                if (Object.keys(_this._requestedFiles).length == 0) {
                    if (_this._requestContinuations.length) {
                        var continuations = _this._requestContinuations;
                        _this._requestContinuations = [];
                        for (var i = 0; i < continuations.length; i++) {
                            var co = continuations[i];
                            co();
                        }
                    }
                }
            });
        }

        if (script)
            return script;

        return null;
    };
    return TypeScriptService;
})();
/// <reference path='typings/typescriptServices.d.ts' />
/// <reference path='typings/brackets.d.ts' />
/// <reference path='TypeScriptLanguageServiceHost.ts' />
/// <reference path='TypeScriptService.ts' />
var TypeScriptCodeHintProvider = (function () {
    function TypeScriptCodeHintProvider(_documentManager) {
        this._documentManager = _documentManager;
        this._languageHost = new TypeScriptLanguageServiceHost(function (file) {
            return null;
        }); //this._createDocumentState(file));

        var factory = new Services.TypeScriptServicesFactory();

        this._languageService = factory.createPullLanguageService(this._languageHost);
    }
    TypeScriptCodeHintProvider.prototype.hasHints = function (editor, implicitChar) {
        if (this._editor !== editor) {
            this._editor = editor;
        }

        return !implicitChar;
    };

    TypeScriptCodeHintProvider.prototype.getHints = function (implicitChar) {
        return null;
    };

    TypeScriptCodeHintProvider.prototype.insertHint = function (hint) {
        return false;
    };

    TypeScriptCodeHintProvider.prototype._createDocumentState = function (file) {
        return null;
    };
    return TypeScriptCodeHintProvider;
})();
/// <reference path='typings/typescriptServices.d.ts' />
/// <reference path='typings/brackets.d.ts' />
/// <reference path='TypeScriptCodeHintProvider.ts' />
/// <reference path='DocumentScriptSnapshot.ts' />
/// <reference path='TypeScriptLanguageServiceHost.ts' />
var AppInit = brackets.getModule('utils/AppInit');
var CodeHintManager = brackets.getModule('editor/CodeHintManager');
var Async = brackets.getModule('utils/Async');
var StringUtils = brackets.getModule('utils/StringUtils');
var LanguageManager = brackets.getModule('language/LanguageManager');
var DocumentManager = brackets.getModule('document/DocumentManager');

console.log("require('imports/typescript/typescriptServices');...");
require('imports/typescript/typescriptServices');

var llang = LanguageManager.defineLanguage("typescript", {
    name: "TypeScript",
    mode: ["javascript", "text/typescript"],
    fileExtensions: ["ts"],
    blockComment: ["/*", "*/"],
    lineComment: "//"
});

CodeHintManager.registerHintProvider(new TypeScriptCodeHintProvider(DocumentManager), ['typescript'], 0);
//# sourceMappingURL=main.js.map
})