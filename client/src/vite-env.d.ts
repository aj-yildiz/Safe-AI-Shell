/// <reference types="vite/client" />

interface Window {
  showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
}

interface FileSystemDirectoryHandle {
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
}