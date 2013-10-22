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
        this._requestedFileCount = 0;
        this._requestContinuations = [];
        var factory = new Services.TypeScriptServicesFactory();
        this._service = factory.createPullLanguageService(this._createLanguageServiceHost());
    }
    TypeScriptService.prototype.getCompletionsAtPosition = function (file, position, isMemberCompletion) {
        var _this = this;
        // make sure temporary empty scripts don't screw on a long position
        var existingScript = this._getScript(file);
        if (existingScript && existingScript.getVersion) {
            var snapshot = existingScript;
            if (position >= snapshot.getLength())
                position = 0;
        } else {
            position = 0;
        }

        var promise = $.Deferred();

        var attempt = function () {
            var result = _this._service.getCompletionsAtPosition(file, position, isMemberCompletion);

            if (_this._requestedFileCount === 0) {
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

        if (resolveResult.getVersion) {
            this._scriptCache[fileName] = resolveResult;
            return resolveResult;
        } else {
            if (!this._requestedFiles[fileName]) {
                this._requestedFiles[fileName] = true;
                this._requestedFileCount++;
            }
            resolveResult.done(function (script) {
                _this._scriptCache[fileName] = script;
                if (_this._requestedFiles[fileName]) {
                    delete _this._requestedFiles[fileName];
                    _this._requestedFileCount--;
                }
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
                if (script && script.getVersion)
                    return script;
                _this._scriptCache[fileName] = null;
                return TypeScriptService._emptySnapshot;
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
    TypeScriptService._emptySnapshot = {
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
    return TypeScriptService;
})();
/// <reference path='typings/typescriptServices.d.ts' />
/// <reference path='typings/brackets.d.ts' />
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
    /**
    * Not a part of IScriptSnapshot, unlike other public methods here.
    * Need to find out who's calling into this (and kill them, naturally).
    */
    DocumentState.prototype.getVersion = function () {
        return this._version;
    };

    DocumentState.prototype.getText = function (start, end) {
        var startPos = this._posFromIndex(start);
        var endPos = this._posFromIndex(end);
        var text = this._doc.getRange(startPos, endPos);
        return text;
    };

    DocumentState.prototype.getLength = function () {
        var lineCount = this._lineCount();
        if (lineCount === 0)
            return 0;

        var lastLineStart = this._indexFromPos({ line: lineCount - 1, ch: 0 });
        var lastLine = this._getLine(lineCount - 1);
        return lastLineStart + lastLine.length;
    };

    DocumentState.prototype.getLineStartPositions = function () {
        var result = [];
        var current = 0;
        this._doc['_masterEditor']._codeMirror.eachLine(function (lineHandle) {
            result.push(current);
            current += lineHandle.length + 1; // plus EOL character
        });
        return result;
    };

    DocumentState.prototype.getTextChangeRangeSinceVersion = function (scriptVersion) {
        var startVersion = this._version - this._changes.length;

        if (scriptVersion < startVersion) {
            var wholeText = this._doc.getText();
            return new TypeScript.TextChangeRange(TypeScript.TextSpan.fromBounds(0, 0), wholeText.length);
        }

        var chunk;

        if (scriptVersion = startVersion)
            chunk = this._changes;
        else
            chunk = this._changes.slice(scriptVersion - startVersion);
        this._changes.length = 0;
        return TypeScript.TextChangeRange.collapseChangesAcrossMultipleVersions(this._changes);
    };

    DocumentState.prototype._onChange = function (change) {
        var offset = this._indexFromPos(change.from);
        var oldLength = this._totalLengthOfLines(change.removed);
        var newLength = this._totalLengthOfLines(change.text);

        var ch = new TypeScript.TextChangeRange(TypeScript.TextSpan.fromBounds(offset, offset + oldLength), newLength);

        this._changes.push(ch);

        this._version++;
    };

    DocumentState.prototype._totalLengthOfLines = function (lines) {
        var length = 0;
        for (var i = 0; i < lines.length; i++) {
            if (i > 0)
                length++; // '\n'

            length += lines[i].length;
        }
        return length;
    };

    DocumentState.prototype._indexFromPos = function (pos) {
        var index = this._doc['_masterEditor']._codeMirror.indexFromPos(pos);
        return index;
    };

    DocumentState.prototype._posFromIndex = function (index) {
        var pos = this._doc['_masterEditor']._codeMirror.posFromIndex(index);
        return pos;
    };

    DocumentState.prototype._lineCount = function () {
        var lineCount = this._doc['_masterEditor']._codeMirror.lineCount();
        return lineCount;
    };

    DocumentState.prototype._getLine = function (n) {
        var line = this._doc['_masterEditor']._codeMirror.getLine(n);
        return line;
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
        var doc = this._documentManager.getCurrentDocument();
        var path = doc.file.fullPath;
        var result = $.Deferred();

        var cursorPos = this._editor.getCursorPos();
        var index = this._editor['_codeMirror'].indexFromPos(cursorPos);

        var logStr = 'getCompletionsAtPosition(' + index + ',' + path + ')...';
        if (cursorPos.ch > 0) {
            logStr += ' // ' + doc.getRange({ line: cursorPos.line, ch: 0 }, cursorPos);
        }

        console.log(logStr);
        var completionPromise = this._service.getCompletionsAtPosition(path, index, false);
        completionPromise.done(function (x) {
            console.log('completionPromise.done', x);
            if (x) {
                result.resolve({
                    hints: x.entries.map(function (e) {
                        return e.name + ' ' + e.kindModifiers + ' ' + e.kind;
                    })
                });
            }
        });

        return result;
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