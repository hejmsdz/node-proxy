const { Transform } = require('stream');
const fs = require('fs');
const CacheHelper = require('./CacheHelper');
const Log = require('../Log');

const logger = new Log(process.stdout);

/**
 * Esta clase funciona como flujo de entrada y salida
 * que escribe todo el contenido y cabeceras recibidas
 * en ficheros correspondientes en la carpeta cache
 * y también lo devuelve para que se pueda pasar adelante.
 * Uso: mediante stream.pipe()
 */
class CacheWriter extends Transform {
  /**
   * Crear un nuevo flujo que baja los datos a la caché.
   *
   * @param {string} url URL del objeto
   * @param {http.IncomingMessage} res respuesta HTTP
   */
  constructor(url, res, cacheConfig) {
    super();

    this.headerFileSuffix = cacheConfig.headerFileSuffix;
    this.bodyFileSuffix = cacheConfig.bodyFileSuffix;
    this.folder = cacheConfig.folder;
    this.url = url;

    this.cacheHelper = new CacheHelper();

    this._writeHeaders(res.headers);
    this._createOutFile();
    this.on('end', () => {
      this.outFile.close();
    });
  }

  _writeHeaders(headers) {
    if (!headers['date']) {
      headers['date'] = new Date(Date.now()).toString();
    }
    const headersJSON = JSON.stringify(headers);
    const headersFilename = CacheHelper.fullFilename(this.folder, this.url, this.headerFileSuffix);
    fs.writeFile(headersFilename, headersJSON, (err) => {
      if(err) {
        logger.debug(err);
      }
    });
  }

  _createOutFile() {
    const bodyFilename = CacheHelper.fullFilename(this.folder, this.url, this.bodyFileSuffix);
    this.outFile = fs.createWriteStream(bodyFilename);
    this.outFile.on('errer', (err) => {
      logger.debug(err);
    })
  }

  _transform(chunk, encoding, callback) {
    this.outFile.write(chunk);
    this.push(chunk);
    callback();
  }
}

module.exports = CacheWriter;
