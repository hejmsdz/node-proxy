/**
 * Determinar si una respuesta HTTP se puede almacenar en la caché.
 */
function IsCacheable(req, res) {
  const cacheControl = (res.headers['cache-control'] || '').split(', ');

  // por simplicidad sólo respuestas 200 OK y el método GET
  if (res.statusCode != 200) {
    return false;
  }

  if (res.method != 'GET') {
    return false;
  }

  if (cacheControl.find(order => order == 'private' || order == 'no-store')) {
    return false;
  }

  return true;
}

module.exports = IsCacheable;