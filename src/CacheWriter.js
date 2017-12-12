const { Transform } = require('stream');
const fs = require('fs');
const crypto = require('crypto');

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
  constructor(url, res) {
    super();

    this.filename = CacheWriter._getFilename(url);

    this._writeHeaders(res.headers);
    this._createOutFile();
    this.on('end', () => {
      this.outFile.close();
    });
  }

  static _getFilename(url) {
    const sha1 = crypto.createHash('sha1');
    sha1.update(url);
    return sha1.digest('hex');
  }

  _fullFilename(extension) {
    return CacheWriter.cachePrefix + this.filename + extension;
  }

  _writeHeaders(headers) {
    const headersJSON = JSON.stringify(headers);
    const headersFilename = this._fullFilename('.headers');
    fs.writeFile(headersFilename, headersJSON, () => {});
  }

  _createOutFile() {
    const bodyFilename = this._fullFilename('.body');
    this.outFile = fs.createWriteStream(bodyFilename);
  }

  _transform(chunk, encoding, callback) {
    this.outFile.write(chunk);
    this.push(chunk);
    callback();
  }
}

CacheWriter.cachePrefix = `${__dirname}/../cache/`;

module.exports = CacheWriter;