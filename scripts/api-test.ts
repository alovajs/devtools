import fs from 'node:fs';
import path from 'node:path';
import { projectPath } from '../src/utils/path';
const DESIGN_NO_DIR = ['api-common'];
/**
 * Recursively copies files from one directory to another
 * @param {string} src - The source directory
 * @param {string} dest - The destination directory
 */
function copyDirectory(src, dest) {
  // Ensure the destination directory exists
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Read the contents of the source directory
  const entries = fs.readdirSync(src, { withFileTypes: true });

  // Loop through each entry in the source directory
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    // If entry is a directory, recursively copy it
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      // If entry is a file, copy it to the destination directory
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
/**
 * Reads and lists all subdirectory names in a given directory
 * @param {string} dir - The directory path to read
 * @returns {string[]} - An array of subdirectory names
 */
function getSubdirectories(dir) {
  // Read the contents of the directory
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  // Filter the entries to get only directories
  const subdirectories = entries.filter(entry => entry.isDirectory()).map(entry => entry.name);

  return subdirectories;
}
function main() {
  const commonDir = path.join(projectPath, './test/api-common');
  const designDirArray = getSubdirectories(path.join(projectPath, './test')).filter(
    dir => !DESIGN_NO_DIR.includes(dir) && dir.startsWith('api-')
  );
  designDirArray.forEach(dir => {
    copyDirectory(commonDir, path.join(projectPath, `./test/${dir}`));
  });
}
main();
