const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class FileHelper {
  async createTempFile(content, extension = 'txt', prefix = '') {
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.ensureDir(tempDir);
    
    const fileName = `${prefix}${uuidv4()}.${extension}`;
    const filePath = path.join(tempDir, fileName);
    
    await fs.writeFile(filePath, content, 'utf8');
    
    return {
      path: filePath,
      name: fileName,
      size: Buffer.byteLength(content, 'utf8')
    };
  }

  async createTempDirectory(prefix = '') {
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.ensureDir(tempDir);
    
    const dirName = `${prefix}${uuidv4()}`;
    const dirPath = path.join(tempDir, dirName);
    
    await fs.ensureDir(dirPath);
    
    return {
      path: dirPath,
      name: dirName
    };
  }

  async cleanupTempFiles(filePath) {
    try {
      if (await fs.pathExists(filePath)) {
        const stats = await fs.stat(filePath);
        
        if (stats.isDirectory()) {
          await fs.remove(filePath);
        } else {
          await fs.unlink(filePath);
        }
      }
    } catch (error) {
      console.error(`Error cleaning up file ${filePath}:`, error);
    }
  }

  async cleanupOldTempFiles(maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
    const tempDir = path.join(process.cwd(), 'temp');
    
    if (!await fs.pathExists(tempDir)) {
      return;
    }

    const now = Date.now();
    const files = await fs.readdir(tempDir);

    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = await fs.stat(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        try {
          await fs.remove(filePath);
          console.log(`Cleaned up old temp file: ${file}`);
        } catch (error) {
          console.error(`Error cleaning up old temp file ${file}:`, error);
        }
      }
    }
  }

  async readFile(filePath) {
    try {
      if (!await fs.pathExists(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      return await fs.readFile(filePath, 'utf8');
    } catch (error) {
      throw new Error(`Error reading file ${filePath}: ${error.message}`);
    }
  }

  async writeFile(filePath, content) {
    try {
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, content, 'utf8');
      
      return {
        path: filePath,
        size: Buffer.byteLength(content, 'utf8')
      };
    } catch (error) {
      throw new Error(`Error writing file ${filePath}: ${error.message}`);
    }
  }

  async getFileStats(filePath) {
    try {
      if (!await fs.pathExists(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      const stats = await fs.stat(filePath);
      
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        accessed: stats.atime,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile()
      };
    } catch (error) {
      throw new Error(`Error getting file stats ${filePath}: ${error.message}`);
    }
  }

  async listTempFiles() {
    const tempDir = path.join(process.cwd(), 'temp');
    
    if (!await fs.pathExists(tempDir)) {
      return [];
    }

    const files = await fs.readdir(tempDir);
    const fileList = [];

    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = await fs.stat(filePath);
      
      fileList.push({
        name: file,
        path: filePath,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isDirectory: stats.isDirectory()
      });
    }

    return fileList;
  }

  validateFileName(fileName) {
    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(fileName)) {
      throw new Error('File name contains invalid characters');
    }

    // Check for reserved names (Windows)
    const reservedNames = [
      'CON', 'PRN', 'AUX', 'NUL',
      'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
      'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
    ];

    const nameWithoutExt = path.parse(fileName).name.toUpperCase();
    if (reservedNames.includes(nameWithoutExt)) {
      throw new Error('File name is reserved');
    }

    // Check length
    if (fileName.length > 255) {
      throw new Error('File name is too long (max 255 characters)');
    }

    return true;
  }

  sanitizeFileName(fileName) {
    // Remove or replace invalid characters
    return fileName
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 255);
  }

  async getTempDirectorySize() {
    const tempDir = path.join(process.cwd(), 'temp');
    
    if (!await fs.pathExists(tempDir)) {
      return 0;
    }

    let totalSize = 0;
    const files = await fs.readdir(tempDir);

    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isFile()) {
        totalSize += stats.size;
      } else if (stats.isDirectory()) {
        totalSize += await this.getDirectorySize(filePath);
      }
    }

    return totalSize;
  }

  async getDirectorySize(dirPath) {
    let totalSize = 0;
    const files = await fs.readdir(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isFile()) {
        totalSize += stats.size;
      } else if (stats.isDirectory()) {
        totalSize += await this.getDirectorySize(filePath);
      }
    }

    return totalSize;
  }
}

module.exports = new FileHelper();
