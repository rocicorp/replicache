// We use a custom resolver because Jest does not resolve src/x.js to src/x.ts
module.exports = (request, options) => {
  if (
    options.basedir.endsWith('replicache-sdk-js/src') &&
    request.endsWith('.js')
  ) {
    request = request.slice(0, -3) + '.ts';
  }

  return options.defaultResolver(request, options);
};
