const fs = require('fs');
const beautify = require("json-beautify");
const rootFolder = require('app-root-path');

/**
 * This class can read the configuration file asynchronously
 * and can change or extend it asynchronously.
 **/
class Config {

  /**
  * The constructor saves the passed fileName or uses the standard config file.
  * @param {string} fileName
  **/
  constructor(fileName) {
    if(fileName) {
      this.fileName = fileName;
    } else {
      this.fileName = `${rootFolder}/config/default.json`;
    }
  }

  /**
  * The callback function allows to read the value or
  * to handle appropriately a error.
  *
  * @callback getCallback
  * @param {boolean} errorFlag
  * @param {string or object} value(s)
  **/

  /**
  * The function asynchronously determines the value for a given path.
  * @param {string or object} path(s) - The path(s) to a specific value
  * @param {getCallback} cb - The callback function
  **/
  get(path, cb) {
    fs.readFile(this.fileName, (err, data) => {
      if(err) {  cb(true, null); }

      let config = JSON.parse(data);

      if(typeof path === 'string') {
        let value = Config.getValue(path, config);
        value !== null ? cb(false, value) : cb(true, null);
      } else if(Array.isArray(path)) {
        let values = {};

        for (var i = 0; i < path.length; i++) {
          let value = Config.getValue(path[i], config);
          if(value == null) {
            cb(true, null);
            return;
          }

          values[path[i]] = value;
        }

        cb(false, values);
      } else {
        cb(true, false)
      }
    });
  }

  static getValue(path, o) {
    path = path.replace(/\[(\w+)\]/g, '.$1');
    path = path.replace(/^\./, '');
    let a = path.split('.');

    while(a.length) {
      let n = a.shift();
      if (n in o) {
        o = o[n];
      } else {
        return null;
      }
    }

    return o;
  }

  /**
  * The callback function allows to handle appropriately a error.
  *
  * @callback setCallback
  * @param {boolean} errorFlag
  * @param {object} headersObject
  **/

  /**
  * The function asynchronously sets the value for a given path.
  * @param {string} path - The path to a specific value
  * @param {object} value - the value to save
  * @param {setCallback} cb - The callback function
  **/
  set(path, value, cb) {
    fs.readFile(this.fileName, (err, data) => {
      if(err) {  cb(true); }

      let a = path.split('.');
      let obj = JSON.parse(data);
      let o = obj;

      for (let i = 0; i < a.length - 1; i++) {
        let n = a[i];
        if (n in o) {
          o = o[n];
        } else {
          o[n] = {};
          o = o[n];
        }
      }
      o[a[a.length - 1]] = value;

      // Just stringify the obj and make it look "good"
      obj = beautify(obj, null, 3, 40);

      fs.writeFile(this.fileName, obj, (err) => {
        if(err) {  cb(true); return; }


        cb(false);
      });
    });
  }
}

module.exports = Config;
