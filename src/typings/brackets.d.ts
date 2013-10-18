/// <reference path='../imports/typescript/jquery.d.ts' />

interface JQueryPromiseTyped<T> {
  always(...alwaysCallbacks: any[]): JQueryDeferred;
  done(...doneCallbacks: { (value: T): any; }[]): JQueryDeferred;
  fail(...failCallbacks: { (error: Error): any; }[]): JQueryDeferred;
  pipe(doneFilter?: (value: T) => any, failFilter?: (error: Error) => any, progressFilter?: (x: any) => any): JQueryPromise;
  then(doneCallback: { (value: T): any; }, failCallbacks: { (error: Error); any; }, progressCallbacks?: any): JQueryDeferred;

}

declare module brackets {
  /**
   * Resolves a module (no file extension!) from either core stuff,
   * installed extensions or local within the current extension.
   */
  function getModule(moduleName: string): any;

  function getModule(moduleName: 'command/CommandManager'): brackets.CommandManager;
  function getModule(moduleName: 'command/Menus'): brackets.Menus;

  function getModule(moduleName: 'document/DocumentManager'): brackets.DocumentManager;

  function getModule(moduleName: 'editor/CodeHintManager'): brackets.CodeHintManager;
  function getModule(moduleName: 'editor/EditorManager'): brackets.EditorManager;
  function getModule(moduleName: 'language/LanguageManager'): brackets.LanguageManager;

  function getModule(moduleName: 'utils/AppInit'): brackets.AppInit;
  function getModule(moduleName: 'utils/Async'): brackets.Async;
  function getModule(moduleName: 'utils/StringUtils'): brackets.StringUtils;

  var appFileSystem: FileSystem; 

  interface AppInit {
    appReady(callback: () => void): void;
  }
  
  interface Async {
  }
  
  interface CodeHintManager {

    registerHintProvider(
      provider: CodeHintProvider,
      modes: string[],
      priority: number);
  }

  interface CodeHintProvider {
    hasHints(
      editor,
      implicitChar: string): boolean;

    getHints(
      implicitChar: string): any; // either a promise, or CodeHintProvider.Results

    insertHint(
      hint: string): boolean;
  }
  
  module CodeHintProvider {
    interface Results {
      hints: any[]; // strings or jQuery objects
      match: string;
      selectInitial: boolean;
    }
  }

 /**
  * Manages global application commands that can be called from menu items, key bindings, or subparts
  * of the application.
  *
  * This module dispatches these event(s):
  *    - commandRegistered  -- when a new command is registered
  *    - beforeExecuteCommand -- before dispatching a command
  */
  interface CommandManager {
    /**
     * Registers a global command.
     * @param name - text that will be displayed in the UI to represent command
     * @param id - unique identifier for command.
     *      Core commands in Brackets use a simple command title as an id, for example "open.file".
     *      Extensions should use the following format: "author.myextension.mycommandname".
     *      For example, "lschmitt.csswizard.format.css".
     * @param commandFn - the function to call when the command is executed. Any arguments passed to
     *     execute() (after the id) are passed as arguments to the function. If the function is asynchronous,
     *     it must return a jQuery promise that is resolved when the command completes. Otherwise, the
     *     CommandManager will assume it is synchronous, and return a promise that is already resolved.
     */
    register(name: string, id: string, commandFn: Function): CommandManager.Command;

    registerInternal(id: string, commandFn: Function): CommandManager.Command;

    /**
     * Retrieves a Command object by id
     */
    get(id: string): CommandManager.Command;
    
    /**
     * Returns the ids of all registered commands
     */
    getAll(): string[];

    /**
     * Looks up and runs a global command. Additional arguments are passed to the command.
     *
     * @param id The ID of the command to run.
     * @return a jQuery promise that will be resolved when the command completes.
     */
    execute(id: string): JQueryPromise;

  }

  module CommandManager {
    /**
     * Events:
     *      enabledStateChange
     *      checkedStateChange
     *      keyBindingAdded
     *      keyBindingRemoved
     */
    interface Command {
      getId(): string;
      
      /**
       * Executes the command. Additional arguments are passed to the executing function
       *
       * @return a jQuery promise that will be resolved when the command completes.
       */
      execute(...args: any[]): JQueryPromise;

      getEnabled(): boolean;

      /**
       * Sets enabled state of Command and dispatches "enabledStateChange"
       * when the enabled state changes.
       */
      setEnabled(enabled: boolean);

      getChecked(): boolean;
      
      /**
       * Sets enabled state of Command and dispatches "checkedStateChange"
       * when the enabled state changes.
       */
      setChecked(checked: boolean);

      getName(): string;

      /**
       * Sets the name of the Command and dispatches "nameChange" so that
       * UI that reflects the command name can update.
       *
       * Note, a Command name can appear in either HTML or native UI
       * so HTML tags should not be used. To add a Unicode character,
       * use \uXXXX instead of an HTML entity.
       */
      setName(name: string);

    }
  }

  interface DocumentManager {
    /**
     * Returns the Document that is currently open in the editor UI. May be null.
     * When this changes, DocumentManager dispatches a "currentDocumentChange" event. The current
     * document always has a backing Editor (Document._masterEditor != null) and is thus modifiable.
     */
    getCurrentDocument(): brackets.Document;

    /**
     * Changes currentDocument to the given Document, firing currentDocumentChange, which in turn
     * causes this Document's main editor UI to be shown in the editor pane, updates the selection
     * in the file tree / working set UI, etc. This call may also add the item to the working set.
     * 
     * @param document  The Document to make current. May or may not already be in the
     *      working set.
     */
    setCurrentDocument(doc: brackets.Document);
    
    
    /**
     * Gets an existing open Document for the given file, or creates a new one if the Document is
     * not currently open ('open' means referenced by the UI somewhere). Always use this method to
     * get Documents; do not call the Document constructor directly. This method is safe to call
     * in parallel.
     *
     * If you are going to hang onto the Document for more than just the duration of a command - e.g.
     * if you are going to display its contents in a piece of UI - then you must addRef() the Document
     * and listen for changes on it. (Note: opening the Document in an Editor automatically manages
     * refs and listeners for that Editor UI).
     *
     * @return A promise object that will be resolved with the Document, or rejected
     *      with a NativeFileError if the file is not yet open and can't be read from disk.
     */
    getDocumentForPath(fullPath: string): JQueryPromiseTyped<brackets.Document>;

    /**
     * Returns the existing open Document for the given file, or null if the file is not open ('open'
     * means referenced by the UI somewhere). If you will hang onto the Document, you must addRef()
     * it; see {@link getDocumentForPath()} for details.
     */
    getOpenDocumentForPath(fullPath: string): brackets.Document;


    /**
     * Returns all Documents that are 'open' in the UI somewhere (for now, this means open in an
     * inline editor and/or a full-size editor). Only these Documents can be modified, and only
     * these Documents are synced with external changes on disk.
     */
    getAllOpenDocuments(): brackets.Document[];


    /**
     * Creates an untitled document. The associated FileEntry has a fullPath
     * looks like /some-random-string/Untitled-counter.fileExt.
     *
     * @param counter - used in the name of the new Document's FileEntry
     * @param fileExt - file extension of the new Document's FileEntry
     * @return a new untitled Document
     */
    createUntitledDocument(counter: number, fileExt: string): brackets.Document;

  }

  interface Document {
    /**
     * The FileEntry for this document. Need not lie within the project.
     * If Document is untitled, this is an InaccessibleFileEntry object.
     */
    file: NativeFileSystem.FileEntry;

    /**
     * The Language for this document. Will be resolved by file extension in the constructor
     */
    language: brackets.Language;

    /**
     * Whether this document has unsaved changes or not.
     * When this changes on any Document, DocumentManager dispatches a "dirtyFlagChange" event.
     */
    isDirty: boolean;

    /**
     * What we expect the file's timestamp to be on disk. If the timestamp differs from this, then
     * it means the file was modified by an app other than Brackets.
     */
    diskTimestamp: Date;
    
    /** Add a ref to keep this Document alive */
    addRef();

    /** Remove a ref that was keeping this Document alive */
    releaseRef();
    
    /**
     * Returns the document's current contents; may not be saved to disk yet. Whenever this
     * value changes, the Document dispatches a "change" event.
     *
     * @param useOriginalLineEndings If true, line endings in the result depend on the
     *      Document's line endings setting (based on OS & the original text loaded from disk).
     *      If false, line endings are always \n (like all the other Document text getter methods).
     */
    getText(useOriginalLineEndings?: boolean): any;

    /**
     * Sets the contents of the document. Treated as an edit. Line endings will be rewritten to
     * match the document's current line-ending style.
     * @param text The text to replace the contents of the document with.
     */
    setText(text: string);

    /**
     * Sets the contents of the document. Treated as reloading the document from disk: the document
     * will be marked clean with a new timestamp, the undo/redo history is cleared, and we re-check
     * the text's line-ending style. CAN be called even if there is no backing editor.
     * @param text The text to replace the contents of the document with.
     * @param newTimestamp Timestamp of file at the time we read its new contents from disk.
     */
    refreshText(text: string, newTimestamp: Date);

    /**
     * Adds, replaces, or removes text. If a range is given, the text at that range is replaced with the
     * given new text; if text == "", then the entire range is effectively deleted. If 'end' is omitted,
     * then the new text is inserted at that point and all existing text is preserved. Line endings will
     * be rewritten to match the document's current line-ending style.
     * 
     * IMPORTANT NOTE: Because of #1688, do not use this in cases where you might be
     * operating on a linked document (like the main document for an inline editor) 
     * during an outer CodeMirror operation (like a key event that's handled by the
     * editor itself). A common case of this is code hints in inline editors. In
     * such cases, use `editor._codeMirror.replaceRange()` instead. This should be
     * fixed when we migrate to use CodeMirror's native document-linking functionality.
     *
     * @param text  Text to insert or replace the range with
     * @param start  Start of range, inclusive (if 'to' specified) or insertion point (if not)
     * @param end  End of range, exclusive; optional
     * @param origin  Optional string used to batch consecutive edits for undo.
     *     If origin starts with "+", then consecutive edits with the same origin will be batched for undo if 
     *     they are close enough together in time.
     *     If origin starts with "*", then all consecutive edit with the same origin will be batched for
     *     undo.
     *     Edits with origins starting with other characters will not be batched.
     *     (Note that this is a higher level of batching than batchOperation(), which already batches all
     *     edits within it for undo. Origin batching works across operations.)
     */
    replaceRange(
      text: string,
      start: {line:number; ch:number;},
      end?: {line:number; ch:number;},
      origin?: string);

    /**
     * Returns the characters in the given range. Line endings are normalized to '\n'.
     * @param start  Start of range, inclusive
     * @param end  End of range, exclusive
     */
    getRange(start: {line:number; ch:number;}, end: {line:number; ch:number;}): string;

    /**
     * Returns the text of the given line (excluding any line ending characters)
     * @param Zero-based line number
     */
    getLine(lineNum: number): string;

    /**
     * Batches a series of related Document changes. Repeated calls to replaceRange() should be wrapped in a
     * batch for efficiency. Begins the batch, calls doOperation(), ends the batch, and then returns.
     */
    batchOperation(doOperation: () => any);

    /**
     * Returns the language this document is written in.
     * The language returned is based on the file extension.
     * @return An object describing the language used in this document
     */
    getLanguage(): brackets.Language;

    /**
     * Is this an untitled document?
     * 
     * @return whether or not the document is untitled
     */
    isUntitled(): boolean;
    notifnotifySaved();

  }

  interface EditorManager {
  }
  
  interface FileSystem {
  }
  
  interface Language {
  }

  interface LanguageManager {
    defineLanguage(
      name: string,
      options: any);
  }

  interface Menus {
    /**
     * Brackets Application Menu Constants
     */
    AppMenuBar: {
      FILE_MENU: string;
      EDIT_MENU: string;
      VIEW_MENU: string;
      NAVIGATE_MENU: string;
      HELP_MENU: string;
    };

    /**
     * Brackets Context Menu Constants
     */
    ContextMenuIds: {
        EDITOR_MENU: string;
        INLINE_EDITOR_MENU: string;
        PROJECT_MENU: string;
        WORKING_SET_MENU: string;
    };

    /**
     * Brackets Application Menu Section Constants
     * It is preferred that plug-ins specify the location of new MenuItems
     * in terms of a menu section rather than a specific MenuItem. This provides
     * looser coupling to Bracket's internal MenuItems and makes menu organization
     * more semantic. 
     * Use these constants as the "relativeID" parameter when calling addMenuItem() and
     * specify a position of FIRST_IN_SECTION or LAST_IN_SECTION.
     *
     * Menu sections are denoted by dividers or the beginning/end of a menu
     */
    MenuSection: {
        // Menu Section                     Command ID to mark the section
        FILE_OPEN_CLOSE_COMMANDS: {sectionMarker: string; };
        FILE_SAVE_COMMANDS: {sectionMarker: string; };
        FILE_LIVE: {sectionMarker: string};
        FILE_EXTENSION_MANAGER: {sectionMarker: string; };

        EDIT_UNDO_REDO_COMMANDS: {sectionMarker: string; };
        EDIT_TEXT_COMMANDS: {sectionMarker: string; };
        EDIT_SELECTION_COMMANDS: {sectionMarker: string; };
        EDIT_FIND_COMMANDS: {sectionMarker: string; };
        EDIT_REPLACE_COMMANDS: {sectionMarker: string; };
        EDIT_MODIFY_SELECTION: {sectionMarker: string; };
        EDIT_COMMENT_SELECTION: {sectionMarker: string; };
        EDIT_CODE_HINTS_COMMANDS: {sectionMarker: string; };
        EDIT_TOGGLE_OPTIONS: {sectionMarker: string; };

        VIEW_HIDESHOW_COMMANDS: {sectionMarker: string; };
        VIEW_FONTSIZE_COMMANDS: {sectionMarker: string; };
        VIEW_TOGGLE_OPTIONS: {sectionMarker: string; };

        NAVIGATE_GOTO_COMMANDS: {sectionMarker: string; };
        NAVIGATE_DOCUMENTS_COMMANDS: {sectionMarker: string; };
        NAVIGATE_OS_COMMANDS: {sectionMarker: string; };
        NAVIGATE_QUICK_EDIT_COMMANDS: {sectionMarker: string; };
        NAVIGATE_QUICK_DOCS_COMMANDS: {sectionMarker: string; };
    };

    /**
     * Insertion position constants
     * Used by addMenu(), addMenuItem(), and addSubMenu() to
     * specify the relative position of a newly created menu object
     */
    BEFORE: string;
    AFTER: string;
    FIRST: string;
    LAST: string;
    FIRST_IN_SECTION: string;
    LAST_IN_SECTION: string;

    /**
     * Other constants
     */
    DIVIDER: string;

    /**
     * Error Codes from Brackets Shell
     */
    NO_ERROR: string;
    ERR_UNKNOWN: string;
    ERR_INVALID_PARAMS: string;
    ERR_NOT_FOUND: string;


  }


  interface StringUtils {
  }
}
  
declare module NativeFileSystem {
  interface FileEntry {
    fullPath: string;
  }
}