# File System Requirements for TextEdit Integration

## Overview
This document outlines the file system implementation requirements needed for TextEdit to properly save, load, and manage files in the Webintosh environment.

## Core Requirements

### 1. File System Store (`stores/filesystem.ts`)

#### Data Structure
```typescript
interface FileSystemFile {
  id: string;           // Unique identifier (e.g., 'file-1234567890-abc')
  name: string;         // File name with extension
  parentId: string;     // Parent folder ID
  content: string;      // File content (HTML for rich text, plain text, etc.)
  size: number;         // File size in bytes
  type: 'file';         // Type discriminator
  createdAt: Date;      // Creation timestamp
  modifiedAt: Date;     // Last modification timestamp
  mimeType?: string;    // Optional MIME type
}

interface FileSystemFolder {
  id: string;           // Unique identifier or system name ('documents', 'desktop', etc.)
  name: string;         // Folder display name
  parentId: string | null; // Parent folder ID (null for root)
  type: 'folder';       // Type discriminator
  createdAt: Date;      // Creation timestamp
  modifiedAt: Date;     // Last modification timestamp
}

type FileSystemItem = FileSystemFile | FileSystemFolder;
```

#### Store Methods
```typescript
interface FilesystemStore {
  // State
  items: Map<string, FileSystemItem>;
  
  // File Operations
  createFile(options: {
    name: string;
    parentId: string;
    content: string;
    size?: number;
    mimeType?: string;
  }): FileSystemFile;
  
  getFile(id: string): FileSystemFile | undefined;
  
  updateFile(id: string, updates: Partial<FileSystemFile>): void;
  
  deleteFile(id: string): void;
  
  // Folder Operations
  createFolder(options: {
    name: string;
    parentId: string;
  }): FileSystemFolder;
  
  getFolder(id: string): FileSystemFolder | undefined;
  
  getFolderContents(folderId: string): FileSystemItem[];
  
  // Utility Methods
  getItemsByParent(parentId: string): FileSystemItem[];
  getPath(itemId: string): string;
  moveItem(itemId: string, newParentId: string): void;
  renameItem(itemId: string, newName: string): void;
  
  // Persistence
  saveToLocalStorage(): void;
  loadFromLocalStorage(): void;
  initializeDefaultStructure(): void;
}
```

### 2. Default Folder Structure

The file system should initialize with these default folders:
- **Root** (`/`)
  - **Applications** (`applications`) - System applications folder
  - **Desktop** (`desktop`) - User desktop folder
  - **Documents** (`documents`) - Default save location for TextEdit
  - **Downloads** (`downloads`) - Downloaded files
  - **Pictures** (`pictures`) - Image files
  - **Music** (`music`) - Audio files
  - **Videos** (`videos`) - Video files

### 3. TextEdit Integration Points

#### File Operations
1. **New Document**
   - Create untitled document in memory
   - No file system entry until first save

2. **Save Document**
   - If new file: Create file in Documents folder by default
   - If existing file: Update file content and modifiedAt
   - Return file ID for tracking

3. **Save As**
   - Create new file with specified name
   - Allow folder selection (future enhancement)

4. **Open Document**
   - Accept file ID from Finder via metadata
   - Load file content into editor
   - Update window title with file name

5. **Auto-save** (future enhancement)
   - Periodically save changes to existing files
   - Store draft state for unsaved documents

#### Metadata Passing
```typescript
// When opening TextEdit from Finder
osStore.openApp('textedit', {
  fileId: 'file-1234567890-abc'
});

// TextEdit component receives metadata
defineProps<{
  windowId?: number;
  metadata?: {
    fileId?: string;
    [key: string]: any;
  }
}>();
```

### 4. Finder Integration Points

#### File Display
- Show files with appropriate icons based on extension
- Display file size and modification date
- Support for different view modes (icons, list, columns)

#### File Operations
1. **Double-click to Open**
   - `.txt`, `.md`, `.rtf` → Open in TextEdit
   - Pass file ID via metadata

2. **Context Menu Actions**
   - Open with TextEdit
   - Rename file
   - Delete file
   - Duplicate file
   - Move to trash

3. **Drag and Drop** (future enhancement)
   - Move files between folders
   - Open files by dropping on app icons

### 5. File Type Support

#### Initially Supported
- `.txt` - Plain text files
- `.md` - Markdown files
- `.rtf` - Rich text format (store as HTML)
- `.html` - HTML files

#### File Extensions Mapping
```typescript
const FILE_ASSOCIATIONS = {
  'textedit': ['.txt', '.md', '.rtf', '.html'],
  'preview': ['.jpg', '.png', '.gif', '.svg'],
  // ... other apps
};
```

### 6. Persistence

#### LocalStorage Schema
```typescript
// Key: 'webintosh:filesystem:v1'
interface FilesystemPersistence {
  version: 1;
  items: Array<FileSystemItem>;
  lastModified: string; // ISO date string
}
```

#### Session Restoration
- Load file system on app mount
- Restore open files in TextEdit windows
- Maintain file references across refreshes

### 7. Error Handling

#### Required Error Cases
1. File not found
2. Invalid file name (special characters, length)
3. Duplicate file name in same folder
4. Storage quota exceeded
5. Corrupted file content
6. Permission denied (system folders)

### 8. Future Enhancements

#### Phase 2
- File search functionality
- Recent files list
- File versioning/history
- Trash/Recycle bin
- File compression
- Export/Import files to/from host system

#### Phase 3
- Cloud sync simulation
- Shared folders
- File permissions
- File encryption
- Virtual drives

## Implementation Priority

### Phase 1 - Core Functionality (Required)
1. Create filesystem store with basic CRUD operations
2. Implement default folder structure
3. Add localStorage persistence
4. Integrate TextEdit save/load
5. Update Finder to use filesystem store

### Phase 2 - Enhanced Features
1. File search and filtering
2. Trash functionality
3. File duplication
4. Batch operations

### Phase 3 - Advanced Features
1. File sharing
2. Version control
3. Cloud simulation

## Testing Requirements

### Unit Tests
- File CRUD operations
- Folder navigation
- Path resolution
- Persistence save/load

### Integration Tests
- TextEdit file save/load flow
- Finder file operations
- Cross-window file updates
- Session restoration

### Edge Cases
- Large files (>1MB)
- Deep folder nesting
- Special characters in names
- Concurrent file access

## Performance Considerations

### Optimization Targets
- File list rendering: <100ms for 1000 files
- Save operation: <50ms for typical document
- Search: <200ms for full system search
- Initial load: <500ms for complete filesystem

### Memory Management
- Lazy load file contents
- Implement virtual scrolling for large folders
- Cache frequently accessed files
- Cleanup orphaned files

## Security Considerations

### Input Validation
- Sanitize file names
- Validate file paths
- Prevent directory traversal
- Limit file sizes

### Data Protection
- Escape HTML content
- Prevent XSS in file names
- Validate MIME types
- Sandbox file operations

## API Documentation

### Example Usage

```typescript
// Creating a file
const file = filesystemStore.createFile({
  name: 'document.md',
  parentId: 'documents',
  content: '# My Document\n\nContent here...',
  mimeType: 'text/markdown'
});

// Updating a file
filesystemStore.updateFile(file.id, {
  content: '# Updated Document\n\nNew content...',
  modifiedAt: new Date()
});

// Getting folder contents
const documentsFolder = filesystemStore.getFolderContents('documents');

// Moving a file
filesystemStore.moveItem(file.id, 'desktop');
```

## Success Criteria

The file system implementation will be considered complete when:

1. ✅ TextEdit can save new documents
2. ✅ TextEdit can load existing documents
3. ✅ Finder displays all files and folders
4. ✅ Files persist across page refreshes
5. ✅ File operations are reflected in real-time
6. ✅ Error handling prevents data loss
7. ✅ Performance meets target metrics

## References

- [Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (future)
- [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API) (future)
