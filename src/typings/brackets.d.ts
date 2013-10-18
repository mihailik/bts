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
  function getModule(moduleName: 'command/KeyBindingManager'): brackets.KeyBindingManager;

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

  /**
   * EditorManager owns the UI for the editor area. This essentially mirrors the 'current document'
   * property maintained by DocumentManager's model.
   *
   * Note that there is a little bit of unusual overlap between EditorManager and DocumentManager:
   * because the Document state is actually stored in the CodeMirror editor UI, DocumentManager is
   * not a pure headless model. Each Document encapsulates an editor instance, and thus EditorManager
   * must have some knowledge about Document's internal state (we access its _editor property).
   *
   * This module dispatches the following events:
   *    - activeEditorChange --  Fires after the active editor (full or inline) changes and size/visibility
   *                             are complete. Doesn't fire when editor temporarily loses focus to a non-editor
   *                             control (e.g. search toolbar or modal dialog, or window deactivation). Does
   *                             fire when focus moves between inline editor and its full-size container.
   *                             This event tracks getActiveEditor() changes, while DocumentManager's
   *                             currentDocumentChange tracks getCurrentFullEditor() changes.
   *                             The 2nd arg to the listener is which Editor became active; the 3rd arg is
   *                             which Editor is deactivated as a result. Either one may be null.
   *                             NOTE (#1257): getFocusedEditor() sometimes lags behind this event. Listeners
   *                             should use the arguments or call getActiveEditor() to reliably see which Editor 
   *                             just gained focus.
   */
  interface EditorManager {

    /**
     * Flag for _onEditorAreaResize() to always force refresh.
     */
    REFRESH_FORCE: string;

    /**
     * Flag for _onEditorAreaResize() to never refresh.
     */
    REFRESH_SKIP: string;
    
    /**
     * Designates the DOM node that will contain the currently active editor instance. EditorManager
     * will own the content of this DOM node.
     * @param holder (jQueryObject)
     */
    setEditorHolder(holder: any);
    
    /** Returns the visible full-size Editor corresponding to DocumentManager.getCurrentDocument() */
    getCurrentFullEditor(): brackets.Editor;

    /**
     * Creates a new inline Editor instance for the given Document.
     * The editor is not yet visible or attached to a host editor.
     * @param doc  Document for the Editor's content
     * @param range  If specified, all lines outside the given
     *      range are hidden from the editor. Range is inclusive. Line numbers start at 0.
     * @param inlineContent
     * 
     * @return {{content:DOMElement, editor:Editor}}
     */
    createInlineEditorForDocument(doc: brackets.Document, range: {startLine: number; endLine: number;}, inlineContent: HTMLDivElement): { content: HTMLElement; editor: brackets.Editor; };
    createInlineEditorForDocument(doc: brackets.Document, inlineContent: HTMLDivElement): { content: HTMLElement; editor: brackets.Editor; };

    /** 
     * Returns focus to the last visible editor that had focus. If no editor visible, does nothing.
     * This function should be called to restore editor focus after it has been temporarily
     * removed. For example, after a dialog with editable text is closed.
     */
    focusEditor();

    /**
     * Returns the currently focused editor instance (full-sized OR inline editor).
     * This function is similar to getActiveEditor(), with one main difference: this
     * function will only return editors that currently have focus, whereas 
     * getActiveEditor() will return the last visible editor that was given focus (but
     * may not currently have focus because, for example, a dialog with editable text
     * is open).
     */
    getFocusedEditor(): brackets.Editor;

    /**
     * Returns the current active editor (full-sized OR inline editor). This editor may not 
     * have focus at the moment, but it is visible and was the last editor that was given 
     * focus. Returns null if no editors are active.
     * @see getFocusedEditor()
     */
    getActiveEditor(): brackets.Editor;

    /**
     * Returns the currently focused inline widget, if any.
     */
    getFocusedInlineWidget(): brackets.InlineWidget;

    /**
     * Must be called whenever the size/visibility of editor area siblings is changed without going through
     * PanelManager or Resizer. Resizable panels created via PanelManager do not require this manual call.
     */
    resizeEditor();

    /**
     * Registers a new inline editor provider. When Quick Edit is invoked each registered provider is
     * asked if it wants to provide an inline editor given the current editor and cursor location.
     * An optional priority parameter is used to give providers with higher priority an opportunity
     * to provide an inline editor before providers with lower priority.
     * 
     * The provider returns a promise that will be resolved with an InlineWidget, or returns null
     * to indicate the provider doesn't want to respond to this case.
     */
    registerInlineEditProvider(
      provider: (editor: brackets.Editor, position: {line:number;ch:number;}) => JQueryPromiseTyped<brackets.InlineWidget>,
      priority: number);

    /**
     * Registers a new inline docs provider. When Quick Docs is invoked each registered provider is
     * asked if it wants to provide inline docs given the current editor and cursor location.
     * An optional priority parameter is used to give providers with higher priority an opportunity
     * to provide an inline editor before providers with lower priority.
     * 
     * The provider returns a promise that will be resolved with an InlineWidget, or returns null
     * to indicate the provider doesn't want to respond to this case.
     */
    registerInlineDocsProvider(provider: (editor: brackets.Editor, position: {line:number;ch:number}) => JQueryPromiseTyped<brackets.InlineWidget>, priority: number);

    /**
     * Registers a new jump-to-definition provider. When jump-to-definition is invoked each
     * registered provider is asked if it wants to provide jump-to-definition results, given
     * the current editor and cursor location. 
     * The provider returns a promise that will be resolved with jump-to-definition results, or
     * returns null to indicate the provider doesn't want to respond to this case.
     */
    registerJumpToDefProvider(provider: (editor: brackets.Editor, position: {line:number;ch:number}) => JQueryPromiseTyped<brackets.InlineWidget>);

    getInlineEditors;

    /**
     * Removes the given widget UI from the given hostEditor (agnostic of what the widget's content
     * is). The widget's onClosed() callback will be run as a result.
     * @param hostEditor The editor containing the widget.
     * @param inlineWidget The inline widget to close.
     * @return A promise that's resolved when the widget is fully closed.
     */
    closeInlineWidget(hostEditor: brackets.Editor, inlineWidget: brackets.InlineWidget): JQueryPromise;
  }

/**
 * Editor is a 1-to-1 wrapper for a CodeMirror editor instance. It layers on Brackets-specific
 * functionality and provides APIs that cleanly pass through the bits of CodeMirror that the rest
 * of our codebase may want to interact with. An Editor is always backed by a Document, and stays
 * in sync with its content; because Editor keeps the Document alive, it's important to always
 * destroy() an Editor that's going away so it can release its Document ref.
 *
 * For now, there's a distinction between the "master" Editor for a Document - which secretly acts
 * as the Document's internal model of the text state - and the multitude of "slave" secondary Editors
 * which, via Document, sync their changes to and from that master.
 *
 * For now, direct access to the underlying CodeMirror object is still possible via _codeMirror --
 * but this is considered deprecated and may go away.
 *  
 * The Editor object dispatches the following events:
 *    - keyEvent -- When any key event happens in the editor (whether it changes the text or not).
 *          Event handlers are passed ({Editor}, {KeyboardEvent}). The 2nd arg is the raw DOM event.
 *          Note: most listeners will only want to respond when event.type === "keypress".
 *    - cursorActivity -- When the user moves the cursor or changes the selection, or an edit occurs.
 *          Note: do not listen to this in order to be generally informed of edits--listen to the
 *          "change" event on Document instead.
 *    - scroll -- When the editor is scrolled, either by user action or programmatically.
 *    - lostContent -- When the backing Document changes in such a way that this Editor is no longer
 *          able to display accurate text. This occurs if the Document's file is deleted, or in certain
 *          Document->editor syncing edge cases that we do not yet support (the latter cause will
 *          eventually go away).
 *    - optionChange -- Triggered when an option for the editor is changed. The 2nd arg to the listener
 *          is a string containing the editor option that is changing. The 3rd arg, which can be any
 *          data type, is the new value for the editor option.
 *
 * The Editor also dispatches "change" events internally, but you should listen for those on
 * Documents, not Editors.
 *
 * These are jQuery events, so to listen for them you do something like this:
 *    $(editorInstance).on("eventname", handler);
 */
  interface Editor {
    
  }

  interface InlineWidget {
  }
  
  interface FileSystem {
  }

  interface KeyBindingManager {
    getKeymap;
    setEnabled;
    addBinding;
    removeBinding;
    formatKeyDescriptor;
    getKeyBindings;
    addGlobalKeydownHook;
    removeGlobalKeydownHook;

    /**
     * Use windows-specific bindings if no other are found (e.g. Linux).
     * Core Brackets modules that use key bindings should always define at
     * least a generic keybinding that is applied for all platforms. This
     * setting effectively creates a compatibility mode for third party
     * extensions that define explicit key bindings for Windows and Mac, but
     * not Linux.
     */
    useWindowsCompatibleBindings;
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

    /**
     * Retrieves the Menu object for the corresponding id. 
     */
    getMenu(id: string): brackets.Menus.Menu;

    /**
     * Retrieves the map of all Menu objects.
     */
    getAllMenus(): { [name: string]: brackets.Menus.Menu; };

    /**
     * Retrieves the ContextMenu object for the corresponding id. 
     */
    getContextMenu(id: string): brackets.Menus.ContextMenu;

    /**
     * Retrieves the MenuItem object for the corresponding id. 
     */
    getMenuItem(id: string): Menus.MenuItem;

    /**
     * Closes all menus that are open
     */
    closeAll();

    /**
     * Adds a top-level menu to the application menu bar which may be native or HTML-based.
     *
     * @param name - display text for menu
     * @param id - unique identifier for a menu.
     *      Core Menus in Brackets use a simple  title as an id, for example "file-menu".
     *      Extensions should use the following format: "author.myextension.mymenuname". 
     * @param position - constant defining the position of new the Menu relative
     *  to other Menus. Default is LAST (see Insertion position constants).
     *      
     * @param relativeID - id of Menu the new Menu will be positioned relative to. Required
     *      when position is AFTER or BEFORE, ignored when position is FIRST or LAST
     * 
     * @return the newly created Menu
     */
    addMenu(name: string, id: string, position?: string, relativeID?: string): brackets.Menus.Menu;

    /**
     * Removes a top-level menu from the application menu bar which may be native or HTML-based.
     *
     * @param id - unique identifier for a menu.
     *      Core Menus in Brackets use a simple title as an id, for example "file-menu".
     *      Extensions should use the following format: "author.myextension.mymenuname".
     */
    removeMenu(id: string);

    /**
     * Registers new context menu with Brackets. 

     * Extensions should generally use the predefined context menus built into Brackets. Use this 
     * API to add a new context menu to UI that is specific to an extension.
     *
     * After registering  a new context menu clients should:
     *      - use addMenuItem() to add items to the context menu
     *      - call open() to show the context menu. 
     *      For example:
     *      $("#my_ID").contextmenu(function (e) {
     *          if (e.which === 3) {
     *              my_cmenu.open(e);
     *          }
     *      });
     *
     * To make menu items be contextual to things like selection, listen for the "beforeContextMenuOpen"
     * to make changes to Command objects before the context menu is shown. MenuItems are views of
     * Commands, which control a MenuItem's name, enabled state, and checked state.
     *
     * @param id - unique identifier for context menu.
     *      Core context menus in Brackets use a simple title as an id.
     *      Extensions should use the following format: "author.myextension.mycontextmenu name"
     * @return the newly created context menu
     */
    registerContextMenu(id: string): brackets.Menus.ContextMenu;

  }

  module Menus {

    /**
     * Menu represents a top-level menu in the menu bar. A Menu may correspond to an HTML-based
     * menu or a native menu if Brackets is running in a native application shell. 
     * 
     * Since menus may have a native implementation clients should create Menus through 
     * addMenu() and should NOT construct a Menu object directly. 
     * Clients should also not access HTML content of a menu directly and instead use
     * the Menu API to query and modify menus.
     */
    interface Menu {
      /**
       * Removes the specified menu item from this Menu. Key bindings are unaffected; use KeyBindingManager
       * directly to remove key bindings if desired.
       * @param command - command the menu would execute if we weren't deleting it.
       */
      removeMenuItem(command: string);
      /**
       * Removes the specified menu item from this Menu. Key bindings are unaffected; use KeyBindingManager
       * directly to remove key bindings if desired.
       * @param command - command the menu would execute if we weren't deleting it.
       */
      removeMenuItem(command: brackets.CommandManager.Command);

      /**
       * Adds a new menu item with the specified id and display text. The insertion position is
       * specified via the relativeID and position arguments which describe a position 
       * relative to another MenuItem or MenuGroup. It is preferred that plug-ins 
       * insert new  MenuItems relative to a menu section rather than a specific 
       * MenuItem (see Menu Section Constants).
       *
       * TODO: Sub-menus are not yet supported, but when they are implemented this API will
       * allow adding new MenuItems to sub-menus as well.
       *
       * Note, keyBindings are bound to Command objects not MenuItems. The provided keyBindings
       *      will be bound to the supplied Command object rather than the MenuItem.
       * 
       * @param command - the command the menu will execute.
       *      Pass Menus.DIVIDER for a menu divider, or just call addMenuDivider() instead.
       * @param keyBindings - register one
       *      one or more key bindings to associate with the supplied command.
       * @param position - constant defining the position of new MenuItem relative to
       *      other MenuItems. Values:
       *          - With no relativeID, use Menus.FIRST or LAST (default is LAST)
       *          - Relative to a command id, use BEFORE or AFTER (required)
       *          - Relative to a MenuSection, use FIRST_IN_SECTION or LAST_IN_SECTION (required)
       * @param relativeID - command id OR one of the MenuSection.* constants. Required
       *      for all position constants except FIRST and LAST.
       *
       * @return the newly created MenuItem
       */
      addMenuItem(
        command: string,
        keyBindings: {key: string; platform: string; }[],
        position: string,
        relativeID: string): brackets.Menus.MenuItem;

      addMenuItem(
        command: brackets.CommandManager.Command,
        keyBindings: {key: string; platform: string; }[],
        position: string,
        relativeID: string): brackets.Menus.MenuItem;

      /**
       * Inserts divider item in menu.
       * @param position - constant defining the position of new the divider relative
       *      to other MenuItems. Default is LAST.  (see Insertion position constants). 
       * @param relativeID - id of menuItem, sub-menu, or menu section that the new 
       *      divider will be positioned relative to. Required for all position constants
       *      except FIRST and LAST
       * @return the newly created divider
       */
      addMenuDivider(position?: string, relativeID?: string): brackets.Menus.MenuItem;

      /**
       * Gets the Command associated with a MenuItem
       */
      getCommand(): brackets.CommandManager.Command;

      /**
       * Returns the parent Menu for this MenuItem
       */
      getParentMenu(): brackets.Menus.Menu;

    }

    /**
     * Represents a context menu that can open at a specific location in the UI. 
     *
     * Clients should not create this object directly and should instead use registerContextMenu()
     * to create new ContextMenu objects.
     *
     * Context menus in brackets may be HTML-based or native so clients should not reach into
     * the HTML and should instead manipulate ContextMenus through the API.
     *
     * Events:
     *      beforeContextMenuOpen
     */
    interface ContextMenu extends Menu {
      /**
       * Displays the ContextMenu at the specified location and dispatches the 
       * "beforeContextMenuOpen" event.The menu location may be adjusted to prevent
       * clipping by the browser window. All other menus and ContextMenus will be closed
       * bofore a new menu is shown.
       *
       * @param mouseOrLocation - pass a MouseEvent
       *      to display the menu near the mouse or pass in an object with page x/y coordinates
       *      for a specific location.
       */
      open(mouseOrLocation: MouseEvent);
      open(mouseOrLocation:{pageX:number; pageY:number;});

      /**
       * Closes the context menu.
       */
      close();
    }

    /**
     * MenuItem represents a single menu item that executes a Command or a menu divider. MenuItems
     * may have a sub-menu. A MenuItem may correspond to an HTML-based
     * menu item or a native menu item if Brackets is running in a native application shell
     *
     * Since MenuItems may have a native implementation clients should create MenuItems through 
     * addMenuItem() and should NOT construct a MenuItem object directly. 
     * Clients should also not access HTML content of a menu directly and instead use
     * the MenuItem API to query and modify menus items.
     *
     * MenuItems are views on to Command objects so modify the underlying Command to modify the
     * name, enabled, and checked state of a MenuItem. The MenuItem will update automatically
     */
    interface MenuItem {
      id: string;
      isDivider: boolean;

      /**
       * {string|Command} command - the Command this MenuItem will reflect.
       *                                   Use DIVIDER to specify a menu divider
       */
      command: any;
    }
  }


  interface StringUtils {
  }
}
  
declare module NativeFileSystem {
  interface FileEntry {
    fullPath: string;
  }
}