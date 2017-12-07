function parseJSONs(promise) {
  return promise.then((results) => results.map(x => JSON.parse(x.data)));
}

module.exports = {parseJSONs};