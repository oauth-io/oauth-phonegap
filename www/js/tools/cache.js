module.exports = {
  init: function(cookies_module, config) {
    this.config = config;
    return this.cookies = cookies_module;
  },
  tryCache: function(OAuth, provider, cache) {
    var e, i, res;
    if (this.cacheEnabled(cache)) {
      try {
        cache = JSON.parse(window.localStorage.getItem("oauthio_provider_" + provider));
      } catch (_error) {
        e = _error;
        cache = false;
      }
      if (cache && cache.date >= new Date().getTime()) {
        cache = cache.value;
      } else {
        cache = false;
      }
      if (!cache) {
        return false;
      }
      cache = decodeURIComponent(cache);
    }
    if (typeof cache === "string") {
      try {
        cache = JSON.parse(cache);
      } catch (_error) {
        e = _error;
        return false;
      }
    }
    if (typeof cache === "object") {
      res = {};
      for (i in cache) {
        if (i !== "request" && typeof cache[i] !== "function") {
          res[i] = cache[i];
        }
      }
      return OAuth.create(provider, res, cache.request);
    }
    return false;
  },
  clearCache: function(provider) {
    return window.localStorage.removeItem("oauthio_provider_" + provider);
  },
  storeCache: function(provider, cache) {
    var expires_in;
    expires_in = cache.expires_in * 1000 - 10000 || 36000000;
    window.localStorage.setItem("oauthio_provider_" + provider, JSON.stringify({
      value: encodeURIComponent(JSON.stringify(cache)),
      date: new Date().getTime() + expires_in
    }));
  },
  cacheEnabled: function(cache) {
    if (typeof cache === "undefined") {
      return this.config.options.cache;
    }
    return cache;
  }
};
