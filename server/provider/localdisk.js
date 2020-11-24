const path = require("path");
const fs = require("fs");

const DATA_PATH = process.env.DATA_PATH || "data/";
const LOCAL_PATH = path.isAbsolute(DATA_PATH)
  ? DATA_PATH
  : path.join(__dirname, "..", "..", DATA_PATH);

class LocalDiskProvider {
  constructor() {
    fs.mkdirSync(LOCAL_PATH, { recursive: true });
  }

  mkdirFolder = (folderPath) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (!fs.existsSync(folderPath)) {
          await fs.promises.mkdir(folderPath, { recursive: true });
        }
        resolve(true);
      } catch (err) {
        reject(err);
      }
    });
  };

  getFile = (filePath) => {
    filePath = path.join(LOCAL_PATH, filePath);
    return new Promise(async (resolve, reject) => {
      try {
        resolve(filePath);
      } catch (err) {
        reject(err);
      }
    });
  };

  getCompileFile = (filePath) => {
    filePath = path.join(LOCAL_PATH, filePath);
    return new Promise(async (resolve, reject) => {
      try {
        resolve({ localPath: path.dirname(filePath), main: filePath });
      } catch (err) {
        reject(err);
      }
    });
  };

  deleteFile = (filePath) => {
    filePath = path.join(LOCAL_PATH, filePath);
    return new Promise(async (resolve, reject) => {
      try {
        await fs.promises.rm(filePath, {
          force: true,
          maxRetries: 3,
        });
        resolve(true);
      } catch (err) {
        reject(err);
      }
    });
  };

  deleteDir = (dirPath) => {
    dirPath = path.join(LOCAL_PATH, dirPath);
    return new Promise(async (resolve, reject) => {
      try {
        await fs.promises.rmdir(dirPath, {
          recursive: true,
          maxRetries: 3,
        });
        resolve(true);
      } catch (err) {
        reject(err);
      }
    });
  };

  writeFile = (filePath, data) => {
    filePath = path.join(LOCAL_PATH, filePath);
    return new Promise(async (resolve, reject) => {
      try {
        await this.mkdirFolder(path.dirname(filePath));
        await fs.promises.writeFile(filePath, data);
        resolve(true);
      } catch (err) {
        console.error(err);
        reject(err);
      }
    });
  };

  renameFile = (filePath, newPath) => {
    filePath = path.join(LOCAL_PATH, filePath);
    newPath = path.join(LOCAL_PATH, newPath);
    return new Promise(async (resolve, reject) => {
      try {
        await this.mkdirFolder(path.dirname(filePath));
        await this.mkdirFolder(path.dirname(newPath));
        await fs.promises.rename(filePath, newPath);
        resolve(true);
      } catch (err) {
        reject(err);
      }
    });
  };
}

module.exports = {
  LocalDiskProvider,
};
