/// <reference path='../imports/typescript/jquery.d.ts' />

declare module brackets {
  /**
   * Resolves a module (no file extension!) from either core stuff,
   * installed extensions or local within the current extension.
   */
  function getModule(moduleName: string): any;

  function getModule(moduleName: 'utils/AppInit'): AppInit;
  function getModule(moduleName: 'utils/Async'): Async;
  function getModule(moduleName: 'editor/CodeHintManager'): CodeHintManager;
  function getModule(moduleName: 'document/DocumentManager'): DocumentManager;
  function getModule(moduleName: 'editor/EditorManager'): EditorManager;
  function getModule(moduleName: 'language/LanguageManager'): LanguageManager;
  function getModule(moduleName: 'utils/StringUtils'): StringUtils;

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
  
  export module CodeHintProvider {
    interface Results {
      hints: any[]; // strings or jQuery objects
      match: string;
      selectInitial: boolean;
    }
  }

  interface DocumentManager {
    getDocumentForPath(path: string): JQueryPromise;
  }

  interface EditorManager {
  }
  
  interface FileSystem {
  }

  interface LanguageManager {
    defineLanguage(
      name: string,
      options: any);
  }

  interface StringUtils {
  }

}