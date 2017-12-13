const crypto = require('crypto');


 /**
  * A few useful features
  */
class CacheHelper {
  /**
   * Calculates a unique hash value for a given URL.
   * Useful for uniquely identifying files in the file system.
   */
  static getFilename(url) {
    const sha1 = crypto.createHash('sha1');
    sha1.update(url);
    return sha1.digest('hex');
  }

  static fullFilename(url, extension) {
    return CacheHelper.cachePrefix + CacheHelper.getFilename(url) + extension;
  }
}

CacheHelper.cachePrefix = `${__dirname}/../../cache/`;

module.exports = CacheHelper;
