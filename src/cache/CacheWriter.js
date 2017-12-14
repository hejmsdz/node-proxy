const { Transform } = require('stream');
const fs = require('fs');
const CacheHelper = require('./CacheHelper');

/**
 * Esta clase funciona como flujo de entrada y salida
 * que escribe todo el contenido y cabeceras recibidas
 * en ficheros correspondientes en la carpeta cacShe
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

    this.url = url;

    this._writeHeaders(res.headers);
    this._createOutFile();
    this.on('end', () => {
      this.outFile.close();
    });
  }

  _writeHeaders(headers) {
    const headersJSON = JSON.stringify(headers);
    const headersFilename = CacheHelper.fullFilename(this.url, '.headers');
    fs.writeFile(headersFilename, headersJSON, () => {});
  }

  _createOutFile() {
    const bodyFilename = CacheHelper.fullFilename(this.url, '.body');
    this.outFile = fs.createWriteStream(bodyFilename);
    this.outFile.on('errer', (err) => {
      console.log(err);
    })
  }

  _transform(chunk, encoding, callback) {
    this.outFile.write(chunk);
    this.push(chunk);
    callback();
  }
}

module.exports = CacheWriter;
