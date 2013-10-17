var home = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE);
var typescriptRepository = home + '/typescript';
var definitelyTypedRepository = home + '/DefinitelyTyped';
var typescriptRepositoryExists;

var fs = require('fs');
var child_process = require('child_process');


ifExists(typescriptRepository,
    function typescriptRepositoryPresent() {
      typescriptRepositoryExists = true;
      console.log('TypeScript repository detected at '+typescriptRepository+', using tsc.js from there.');

      // use external typescript compiler rather than one in imports/typescript,
      // recompile typescriptServices.js,
      // copy typescript stuff into imports/typescript

      importLatestTsc(function() {
        ifExists(definitelyTypedRepository,
          function() {
            console.log('DefiniteyTyped repository is found, copying CodeMirror typings');
            importLatestCodeMirrorTypings(function() {
              compileProject();
            },
            function() {
              compileProject();
            });
        });
      });
      
      function compileProject() {
        var firstTypescriptServicesCompile = true;
        recompileTypescriptServices(function() {
          if (firstTypescriptServicesCompile) {
            firstTypescriptServicesCompile = false;
            compileMain();
          }
        });
      }
    },
    function typescriptRepositoryAbsent() {
        typescriptRepositoryExists = false;
        console.log('TypeScript repository is not found at '+typescriptRepository+', using tsc.js from imports/typescript.');
      
        ifExists(definitelyTypedRepository,
          function() {
            console.log('DefiniteyTyped repository is found, copying CodeMirror typings');
            importLatestCodeMirrorTypings(function() {

              // use typescript compiler from imports/typescript,
              // also DO NOT recompile typescriptServices.js
      
              compileMain();
            });
          },
          function() {
            // use typescript compiler from imports/typescript,
            // also DO NOT recompile typescriptServices.js
    
            compileMain();
          });
                                          
    });

function recompileTypescriptServices(complete) {
  console.log('Generating typings for TypeScript itself: tsc services/typescriptServices.ts...'); 
  runTypeScriptCompiler(
    typescriptRepository+'/src/services/typescriptServices.ts', 'typings',
    function(txt) {
      readOriginalText(function(originalText) {
        var patchedText = originalText.replace(/function __item/,'//function __item');
        if (patchedText===originalText) {
          console.log('Bug with typescriptServices.d.ts generation has been fixed by TypeScript team. Please remove the patching code.');
          deleteGeneratedJs(txt);
        }
        else {
          writePatchedText(patchedText, function() {
            deleteGeneratedJs(txt);
          });
        }
      });
    },
    '--declaration');

  function readOriginalText(success) {
    fs.readFile('typings/typescriptServices.d.ts', function(error, data) {
      if (error) {
        console.log('  Patching typescriptService.d.ts: cannot retrieve raw script for patching '+error);
        // cannot read the generated file, fail all the way
        complete(error);
      }
      else {
        success(data ? data +'' : null);
      }
    });
  }

  function writePatchedText(patchedText, success) {
    fs.writeFile('typings/typescriptServices.d.ts', patchedText, function(error) {
      if (!error)
        console.log('  Patching typescriptServices.d.ts: patched TypeScript bug.');
      else
        console.log('  Patching typescriptServices.d.ts: patching failed - '+error);
  
      // ignore patching failures
      success();
    });
  }
  
  function deleteGeneratedJs(txt) {
    fs.unlink('typings/typescriptServices.js', function(error) {
      if (error)
        console.log('TypeScript typings: '+txt+' '+error);
      else
        console.log('TypeScript typings: '+txt+' -- cleaned');
      complete();
    });
  }
}


function compileMain() {
  var lastWrapped = null;
  runTypeScriptCompiler(
    'main.ts', '..',
    function(txt) {
      fs.readFile('../main.js', function(error,data) {
        if (error) {
          console.log('main.js ['+error.message+']: '+txt);
          return;
        }

        var rawOutput = data+'';
        var prefix = 'define(function(require,exports,module){';
        var suffix = '})';
        if (rawOutput!==lastWrapped) {
          console.log('main.js: '+txt+'...');
          lastWrapped = prefix+rawOutput+suffix;
          fs.writeFile('../main.js', lastWrapped, function() {
            console.log('main.js: wrapped');
          });
        }
      });
    },
    ['--sourcemap'/*,'--module','amd',*/]);
}

function importLatestTsc(callback) {
  importFiles(
    typescriptRepository+'/bin/',
    ['tsc.js', 'typescriptServices.js', 'jquery.d.ts', 'lib.d.ts'],
    'imports/typescript',
    callback);
}

function importLatestCodeMirrorTypings(callback) {
  importFiles(
    definitelyTypedRepository+'/codemirror/', 
    ['codemirror.d.ts'],
    'typings',
    callback);
}

function importFiles(repository, files, targetDir, callback) {
  var completeCount = 0;
  var error = null;
  files.forEach(function(f) {
    continueCopyFile(f, function(err) {
      completeCount++;
      error = error || err;
      if (completeCount===files.length) {
        callback(error);
      }
    });
  });

  function continueCopyFile(f, callback) {
    copyFile(
      repository+f,
      targetDir+'/'+f,
      function(error) {
        if (error) {
          console.log('  '+error.message+' '+f);
        }
        else {
          console.log('  copied '+f);
        }
        if (callback)
          callback(error);
      });
  }
}


function ifExists(f, presentCallback, absentCallback) {
    fs.exists(f, function(result) {
        if (result) {
            if (presentCallback)
                presentCallback();
        }
        else {
            if (absentCallback)
                absentCallback();
        }
    });
}

function copyFile(source, target, cb) {
  var cbCalled = false;

  var rd = fs.createReadStream(source);
  rd.on("error", function(err) {
    done(err);
  });
  var wr = fs.createWriteStream(target);
  wr.on("error", function(err) {
    done(err);
  });
  wr.on("close", function(ex) {
    done();
  });
  rd.pipe(wr);

  function done(err) {
    if (!cbCalled) {
      if (cb) {
        cb(err);
      }
      else {
          if (err)
            console.log('Copying '+source+': '+err.message);
          else
            console.log('Copied '+source+'.');
      }
      cbCalled = true;
    }
  }
}

function runTypeScriptCompiler(src, out, onchanged, more) {
    var scriptFileName = src.split('/');
    scriptFileName = scriptFileName[scriptFileName.length-1];
    scriptFileName = scriptFileName.split('.')[0];
    if (out)
        scriptFileName = out+'/'+scriptFileName;

    // either use embedded compiler, or from external repository
    var tsc = typescriptRepositoryExists ?
        typescriptRepository+'/bin/tsc.js' :
        'imports/typescript/tsc.js';

    var cmdLine = [tsc, src, '--out', scriptFileName+'.js', '--watch'];
    if (more) {
        if (typeof more === 'string')
            cmdLine.push(more);
        else
            cmdLine = cmdLine.concat(more);
    }

    var elasticWatchTimeoutMsec = 200;

    var watching;
    var changeQueued = null;
    
    if (onchanged) {
        var ignoreChanges = false;
        var onChanged = function(statBefore,statAfter) {
            if (changeQueued)
                clearTimeout(changeQueued);

            var changedText = statBefore?
                (statAfter?'changed':'deleted') :
                (statAfter?'created':'does not exist');
            changedText = scriptFileName+' '+changedText;
            changeQueued = setTimeout(function() {
                fs.exists(scriptFileName+'.js', function(exists) {
                    if (exists)
                        onchanged(changedText);
                    console.log('');

                    if (watching) {
                        fs.unwatchFile(scriptFileName+'.js',onChanged);
                        watching = false;
                    }
                  
                    if (changeQueued)
                        clearTimeout(changeQueued);
                    changeQueued = null;

                });
            }, elasticWatchTimeoutMsec);
        }

        fs.watchFile(scriptFileName+'.js',onChanged);
        runCompiler();
    }
    else {
        runCompiler();
    }
    
    function runCompiler() {
      console.log(scriptFileName+'...');
      console.log(' TypeScript >>> '+cmdLine.join(' '));
      var childProcess = child_process.execFile('node', cmdLine, function (error, stdout, stderr) {
        if (error) {
          console.log(src+' '+error);
            if (watching) {
              fs.unwatchFile(scriptFileName+'.js',onChanged);
              watching = false;
            }
          return;
        }
      });

        childProcess.stdout.on('data', function(data) {
           printOutput(data); 
        });
        childProcess.stderr.on('data', function(data) {
            console.log('**', data); 
        });
    }
    
    function printOutput(prefix, data) {
        var fullPrefix = '  '+(data?prefix+' ':'')+scriptFileName+' ';
        if (!data) data = prefix;

        var lineEndMarker = " "+String.fromCharCode(8629);
        var normalizeData = (data+'').trimRight().replace(/\r\n/g,'\n').replace(/\n/g, lineEndMarker+"\n") + lineEndMarker;
        var lines = normalizeData.split('\n');
        var dump = fullPrefix+lines.join('\n'+fullPrefix);
        console.log(dump);

        // compilation started apparently, let's keep an eye on the target now
        if (onchanged && !changeQueued && !watching) {
            fs.watchFile(scriptFileName+'.js',onChanged);
            watching = true;
        }
    }
}