var typescriptRepository = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/typescript';
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

        importLatestTsc('', function() {
            recompileTypescriptServices(function() {
              compileMain();
            });
        });
    },
    function typescriptRepositoryAbsent() {
        typescriptRepositoryExists = false;
        console.log('TypeScript repository is not found at '+typescriptRepository+', using tsc.js from imports/typescript.');

        // use typescript compiler from imports/typescript,
        // also DO NOT recompile typescriptServices.js

        compileMain();
    });

function recompileTypescriptServices(complete) {
  console.log('Generating typings for TypeScript itself: tsc services/typescriptServices.ts...'); 
  runTypeScriptCompiler(
    typescriptRepository+'/src/services/typescriptServices.ts', 'typings',
    function(txt) {
      fs.unlink('typings/typescriptServices.js', function(error) {
        if (error)
            console.log('TypeScript typings: '+txt+' '+error);
        else
            console.log('TypeScript typings: '+txt+' -- cleaned');

        complete();
      });
    },
    '--declaration');
}

function compileMain() {
    runTypeScriptCompiler(
        'main.ts', '..',
        function(txt) {
            console.log('main.js: '+txt);
        },
        ['--sourcemap','--module','commonjs']);
}

function importLatestTsc(txt, callback) {
  var files = ['tsc.js', 'typescriptServices.js', 'jquery.d.ts', 'lib.d.ts'];
  var completeCount = 0;
  var error = null;
  files.forEach(function(f) {
    copyTypescriptFile(f, function(err) {
      completeCount++;
      error = error || err;
      if (completeCount===files.length) {
        callback(error);
      }
    });
  });

  function copyTypescriptFile(f, callback) {
    copyFile(
      typescriptRepository+'/bin/'+f,
      'imports/typescript/'+f,
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

    var elasticWatchTimeoutMsec = 2000;

    var watching;
    var changeQueued = null;
    
    if (onchanged) {
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
      console.log('['+cmdLine+']');
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