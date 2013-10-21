define(function(require,exports,module){/// <reference path='typings/typescriptServices.d.ts' />
var TypeScriptService = (function () {
    function TypeScriptService() {
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
        this._service = factory.createPullLanguageService(this._createLanguageServiceHost());
    }
    TypeScriptService.prototype.getCompletionsAtPosition = function (file, position, isMemberCompletion) {
        var _this = this;
        // make sure temporary empty scripts don't screw on a long position
        var existingScript = this._getScript(file);
        if (existingScript && existingScript.getSnapshot) {
            var snapshot = existingScript.getSnapshot();
            if (position >= snapshot.getLength())
                position = 0;
        } else {
            position = 0;
        }

        var promise = $.Deferred();

        var attempt = function () {
            var result = _this._service.getCompletionsAtPosition(file, position, isMemberCompletion);

            if (_this._requestedFiles.length == 0) {
                promise.resolve(result);
            } else {
                _this._requestContinuations.push(attempt);
            }
        };

        attempt();

        return promise;
    };

    TypeScriptService.prototype._log = function (text) {
        console.log(text);
    };

    TypeScriptService.prototype._getScript = function (fileName) {
        var _this = this;
        var script = this._scriptCache[fileName];
        if (script)
            return script;

        this._scriptCache[fileName] = null;
        var resolveResult = this.resolveScript ? this.resolveScript(fileName) : null;
        if (!resolveResult)
            return null;

        if (resolveResult.getSnapshot) {
            this._scriptCache[fileName] = resolveResult;
            return resolveResult;
        } else {
            this._requestedFiles[fileName] = true;
            resolveResult.done(function (script) {
                _this._scriptCache[fileName] = script;
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
            return null;
        }
    };

    TypeScriptService.prototype._createLanguageServiceHost = function () {
        var _this = this;
        return {
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
                _this._scriptCache[fileName] = null;
                return DocumentScriptSnapshot.empty;
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
        };
    };
    return TypeScriptService;
})();
/// <reference path='typings/typescriptServices.d.ts' />
/// <reference path='typings/brackets.d.ts' />
var DocumentScriptSnapshot = (function () {
    function DocumentScriptSnapshot(_doc, _changes) {
        this._doc = _doc;
        this._changes = _changes;
    }
    DocumentScriptSnapshot.prototype.getText = function (start, end) {
        //this._doc.
        return '';
    };

    DocumentScriptSnapshot.prototype.getLength = function () {
        return 0;
    };

    DocumentScriptSnapshot.prototype.getLineStartPositions = function () {
        return [];
    };

    DocumentScriptSnapshot.prototype.getTextChangeRangeSinceVersion = function (scriptVersion) {
        return TypeScript.TextChangeRange.unchanged;
    };
    DocumentScriptSnapshot.empty = {
        getText: function (start, end) {
            return '';
        },
        getLength: function () {
            return 0;
        },
        getLineStartPositions: function () {
            return [];
        },
        getTextChangeRangeSinceVersion: function (scriptVersion) {
            return TypeScript.TextChangeRange.unchanged;
        }
    };
    return DocumentScriptSnapshot;
})();
/// <reference path='typings/typescriptServices.d.ts' />
/// <reference path='typings/brackets.d.ts' />
/// <reference path='DocumentScriptSnapshot.ts' />
var DocumentState = (function () {
    function DocumentState(_doc) {
        var _this = this;
        this._doc = _doc;
        this._version = 0;
        this._changes = [];
        $(this._doc).on('change', function (e, doc, change) {
            return _this._onChange(change);
        });
    }
    DocumentState.prototype.getVersion = function () {
        return this._changes.length;
    };

    DocumentState.prototype.getSnapshot = function () {
        return new DocumentScriptSnapshot(this._doc, this._changes);
    };

    DocumentState.prototype._onChange = function (change) {
        var ch = {
            offset: this._indexFromPos(change.from),
            oldLength: this._linesLength(change.removed),
            newLength: this._linesLength(change.text)
        };
        this._changes.push(ch);
    };

    DocumentState.prototype._linesLength = function (lines) {
        var length = 0;
        for (var i = 0; i < lines.length; i++) {
            if (i > 0)
                length++; // '\n'

            length += lines[i].length;
        }
        return length;
    };

    DocumentState.prototype._indexFromPos = function (pos) {
        return 0;
    };
    return DocumentState;
})();
/// <reference path='typings/brackets.d.ts' />
/// <reference path='typings/typescriptServices.d.ts' />
/// <reference path='DocumentState.ts' />
var DocumentManagerScriptLoader = (function () {
    function DocumentManagerScriptLoader(_documentManager) {
        this._documentManager = _documentManager;
    }
    DocumentManagerScriptLoader.prototype.loadScript = function (file) {
        var _this = this;
        var getDocument = this._documentManager.getDocumentForPath(file);
        var createDocumentState = getDocument.then(function (doc) {
            return _this._loadDocumentState(doc);
        });
        return createDocumentState;
    };

    DocumentManagerScriptLoader.prototype._loadDocumentState = function (document) {
        return new DocumentState(document);
    };
    return DocumentManagerScriptLoader;
})();
/// <reference path='typings/typescriptServices.d.ts' />
/// <reference path='typings/brackets.d.ts' />
/// <reference path='TypeScriptService.ts' />
/// <reference path='DocumentManagerScriptLoader.ts' />
var TypeScriptCodeHintProvider = (function () {
    function TypeScriptCodeHintProvider(_documentManager) {
        var _this = this;
        this._documentManager = _documentManager;
        this._service = new TypeScriptService();
        this._service.resolveScript = function (file) {
            return _this._resolveScript(file);
        };
        this._scriptLoader = new DocumentManagerScriptLoader(this._documentManager);
    }
    TypeScriptCodeHintProvider.prototype.hasHints = function (editor, implicitChar) {
        if (this._editor !== editor) {
            this._editor = editor;
        }

        return !implicitChar;
    };

    TypeScriptCodeHintProvider.prototype.getHints = function (implicitChar) {
        console.log('getCurrentDocument...');
        var doc = this._documentManager.getCurrentDocument();
        var path = doc.file.fullPath;
        var result = $.Deferred();
        console.log('getCompletionsAtPosition...');
        var completionPromise = this._service.getCompletionsAtPosition(path, 2, false);
        completionPromise.done(function (x, y) {
            console.log('completionPromise.done' + x + y + '...');
        });
    };

    TypeScriptCodeHintProvider.prototype.insertHint = function (hint) {
        return false;
    };

    TypeScriptCodeHintProvider.prototype._resolveScript = function (file) {
        var load = this._scriptLoader.loadScript(file);
        return load;
    };
    return TypeScriptCodeHintProvider;
})();
/// <reference path='typings/typescriptServices.d.ts' />
/// <reference path='typings/brackets.d.ts' />
/// <reference path='TypeScriptCodeHintProvider.ts' />
/// <reference path='DocumentScriptSnapshot.ts' />
var AppInit = brackets.getModule('utils/AppInit');
var CodeHintManager = brackets.getModule('editor/CodeHintManager');
var Async = brackets.getModule('utils/Async');
var StringUtils = brackets.getModule('utils/StringUtils');
var LanguageManager = brackets.getModule('language/LanguageManager');
var DocumentManager = brackets.getModule('document/DocumentManager');

console.log("require('src/imports/typescript/typescriptServices');...");
require('src/imports/typescript/typescriptServices');

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