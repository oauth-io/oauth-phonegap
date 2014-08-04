var Url,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Url = require('../tools/url')();

module.exports = function($, config, client_states, cache, providers_api) {
  return {
    http: function(opts) {
      var defer, desc_opts, doRequest, i, options;
      doRequest = function() {
        var i, k, qs, request;
        request = options.oauthio.request || {};
        if (!request.cors) {
          options.url = encodeURIComponent(options.url);
          if (options.url[0] !== "/") {
            options.url = "/" + options.url;
          }
          options.url = config.oauthd_url + "/request/" + options.oauthio.provider + options.url;
          options.headers = options.headers || {};
          options.headers.oauthio = "k=" + config.key;
          if (options.oauthio.tokens.oauth_token && options.oauthio.tokens.oauth_token_secret) {
            options.headers.oauthio += "&oauthv=1";
          }
          for (k in options.oauthio.tokens) {
            options.headers.oauthio += "&" + encodeURIComponent(k) + "=" + encodeURIComponent(options.oauthio.tokens[k]);
          }
          delete options.oauthio;
          return $.ajax(options);
        }
        if (options.oauthio.tokens) {
          if (options.oauthio.tokens.access_token) {
            options.oauthio.tokens.token = options.oauthio.tokens.access_token;
          }
          if (!options.url.match(/^[a-z]{2,16}:\/\//)) {
            if (options.url[0] !== "/") {
              options.url = "/" + options.url;
            }
            options.url = request.url + options.url;
          }
          options.url = Url.replaceParam(options.url, options.oauthio.tokens, request.parameters);
          if (request.query) {
            qs = [];
            for (i in request.query) {
              qs.push(encodeURIComponent(i) + "=" + encodeURIComponent(Url.replaceParam(request.query[i], options.oauthio.tokens, request.parameters)));
            }
            if (__indexOf.call(options.url, "?") >= 0) {
              options.url += "&" + qs;
            } else {
              options.url += "?" + qs;
            }
          }
          if (request.headers) {
            options.headers = options.headers || {};
            for (i in request.headers) {
              options.headers[i] = Url.replaceParam(request.headers[i], options.oauthio.tokens, request.parameters);
            }
          }
          delete options.oauthio;
          return $.ajax(options);
        }
      };
      options = {};
      i = void 0;
      for (i in opts) {
        options[i] = opts[i];
      }
      if (!options.oauthio.request || options.oauthio.request === true) {
        desc_opts = {
          wait: !!options.oauthio.request
        };
        defer = $ != null ? $.Deferred() : void 0;
        providers_api.getDescription(options.oauthio.provider, desc_opts, function(e, desc) {
          if (e) {
            return defer != null ? defer.reject(e) : void 0;
          }
          if (options.oauthio.tokens.oauth_token && options.oauthio.tokens.oauth_token_secret) {
            options.oauthio.request = desc.oauth1 && desc.oauth1.request;
          } else {
            options.oauthio.request = desc.oauth2 && desc.oauth2.request;
          }
          if (defer != null) {
            defer.resolve();
          }
        });
        return defer != null ? defer.then(doRequest) : void 0;
      } else {
        return doRequest();
      }
    },
    http_me: function(opts) {
      var defer, desc_opts, doRequest, k, options;
      doRequest = function() {
        var defer, k, promise, request;
        defer = $ != null ? $.Deferred() : void 0;
        request = options.oauthio.request || {};
        options.url = config.oauthd_url + "/auth/" + options.oauthio.provider + "/me";
        options.headers = options.headers || {};
        options.headers.oauthio = "k=" + config.key;
        if (options.oauthio.tokens.oauth_token && options.oauthio.tokens.oauth_token_secret) {
          options.headers.oauthio += "&oauthv=1";
        }
        for (k in options.oauthio.tokens) {
          options.headers.oauthio += "&" + encodeURIComponent(k) + "=" + encodeURIComponent(options.oauthio.tokens[k]);
        }
        delete options.oauthio;
        promise = $.ajax(options);
        $.when(promise).done(function(data) {
          if (defer != null) {
            defer.resolve(data.data);
          }
        }).fail(function(data) {
          if (data.responseJSON) {
            if (defer != null) {
              defer.reject(data.responseJSON.data);
            }
          } else {
            if (defer != null) {
              defer.reject(new Error("An error occured while trying to access the resource"));
            }
          }
        });
        return defer != null ? defer.promise() : void 0;
      };
      options = {};
      for (k in opts) {
        options[k] = opts[k];
      }
      if (!options.oauthio.request || options.oauthio.request === true) {
        desc_opts = {
          wait: !!options.oauthio.request
        };
        defer = $ != null ? $.Deferred() : void 0;
        providers_api.getDescription(options.oauthio.provider, desc_opts, function(e, desc) {
          if (e) {
            return defer != null ? defer.reject(e) : void 0;
          }
          if (options.oauthio.tokens.oauth_token && options.oauthio.tokens.oauth_token_secret) {
            options.oauthio.request = desc.oauth1 && desc.oauth1.request;
          } else {
            options.oauthio.request = desc.oauth2 && desc.oauth2.request;
          }
          if (defer != null) {
            defer.resolve();
          }
        });
        return defer != null ? defer.then(doRequest) : void 0;
      } else {
        return doRequest();
      }
    },
    mkHttp: function(provider, tokens, request, method) {
      var base;
      base = this;
      return function(opts, opts2) {
        var i, options;
        options = {};
        if (typeof opts === "string") {
          if (typeof opts2 === "object") {
            for (i in opts2) {
              options[i] = opts2[i];
            }
          }
          options.url = opts;
        } else if (typeof opts === "object") {
          for (i in opts) {
            options[i] = opts[i];
          }
        }
        options.type = options.type || method;
        options.oauthio = {
          provider: provider,
          tokens: tokens,
          request: request
        };
        return base.http(options);
      };
    },
    mkHttpMe: function(provider, tokens, request, method) {
      var base;
      base = this;
      return function(filter) {
        var options;
        options = {};
        options.type = options.type || method;
        options.oauthio = {
          provider: provider,
          tokens: tokens,
          request: request
        };
        options.data = options.data || {};
        options.data.filter = (filter ? filter.join(",") : undefined);
        return base.http_me(options);
      };
    },
    sendCallback: function(opts, defer) {
      var base, data, e, err, i, make_res, request, res, tokens;
      base = this;
      data = void 0;
      err = void 0;
      try {
        data = JSON.parse(opts.data);
      } catch (_error) {
        e = _error;
        if (defer != null) {
          defer.reject(new Error("Error while parsing result"));
        }
        return opts.callback(new Error("Error while parsing result"));
      }
      if (!data || !data.provider) {
        return;
      }
      if (opts.provider && data.provider.toLowerCase() !== opts.provider.toLowerCase()) {
        err = new Error("Returned provider name does not match asked provider");
        if (defer != null) {
          defer.reject(err);
        }
        if (opts.callback && typeof opts.callback === "function") {
          return opts.callback(err);
        } else {
          return;
        }
      }
      if (data.status === "error" || data.status === "fail") {
        err = new Error(data.message);
        err.body = data.data;
        if (defer != null) {
          defer.reject(err);
        }
        if (opts.callback && typeof opts.callback === "function") {
          return opts.callback(err);
        } else {
          return;
        }
      }
      if (data.status !== "success" || !data.data) {
        err = new Error();
        err.body = data.data;
        if (defer != null) {
          defer.reject(err);
        }
        if (opts.callback && typeof opts.callback === "function") {
          return opts.callback(err);
        } else {
          return;
        }
      }
      if (!data.state || client_states.indexOf(data.state) === -1) {
        if (defer != null) {
          defer.reject(new Error("State is not matching"));
        }
        if (opts.callback && typeof opts.callback === "function") {
          return opts.callback(new Error("State is not matching"));
        } else {
          return;
        }
      }
      if (!opts.provider) {
        data.data.provider = data.provider;
      }
      res = data.data;
      if (cache.cacheEnabled(opts.cache) && res) {
        cache.storeCache(data.provider, res);
      }
      request = res.request;
      delete res.request;
      tokens = void 0;
      if (res.access_token) {
        tokens = {
          access_token: res.access_token
        };
      } else if (res.oauth_token && res.oauth_token_secret) {
        tokens = {
          oauth_token: res.oauth_token,
          oauth_token_secret: res.oauth_token_secret
        };
      }
      if (!request) {
        if (defer != null) {
          defer.resolve(res);
        }
        if (opts.callback && typeof opts.callback === "function") {
          return opts.callback(null, res);
        } else {
          return;
        }
      }
      if (request.required) {
        for (i in request.required) {
          tokens[request.required[i]] = res[request.required[i]];
        }
      }
      make_res = function(method) {
        return base.mkHttp(data.provider, tokens, request, method);
      };
      res.get = make_res("GET");
      res.post = make_res("POST");
      res.put = make_res("PUT");
      res.patch = make_res("PATCH");
      res.del = make_res("DELETE");
      res.me = base.mkHttpMe(data.provider, tokens, request, "GET");
      if (defer != null) {
        defer.resolve(res);
      }
      if (opts.callback && typeof opts.callback === "function") {
        return opts.callback(null, res);
      } else {

      }
    }
  };
};
