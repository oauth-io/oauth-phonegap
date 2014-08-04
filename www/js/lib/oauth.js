"use strict";
var Url, cache, config, cookies, sha1;

config = require("../config");

cookies = require("../tools/cookies");

cache = require("../tools/cache");

Url = require("../tools/url");

sha1 = require("../tools/sha1");

module.exports = function(window, document, jQuery, navigator) {
  var $, client_states, oauth_result, oauthio, parse_urlfragment, providers_api, providers_cb, providers_desc;
  $ = jQuery;
  Url = Url(document);
  cookies.init(config, document);
  cache.init(cookies, config);
  oauthio = {
    request: {}
  };
  providers_desc = {};
  providers_cb = {};
  providers_api = {
    execProvidersCb: function(provider, e, r) {
      var cbs, i;
      if (providers_cb[provider]) {
        cbs = providers_cb[provider];
        delete providers_cb[provider];
        for (i in cbs) {
          cbs[i](e, r);
        }
      }
    },
    getDescription: function(provider, opts, callback) {
      opts = opts || {};
      if (typeof providers_desc[provider] === "object") {
        return callback(null, providers_desc[provider]);
      }
      if (!providers_desc[provider]) {
        providers_api.fetchDescription(provider);
      }
      if (!opts.wait) {
        return callback(null, {});
      }
      providers_cb[provider] = providers_cb[provider] || [];
      providers_cb[provider].push(callback);
    }
  };
  config.oauthd_base = Url.getAbsUrl(config.oauthd_url).match(/^.{2,5}:\/\/[^/]+/)[0];
  client_states = [];
  oauth_result = void 0;
  (parse_urlfragment = function() {
    var cookie_state, results;
    results = /[\\#&]oauthio=([^&]*)/.exec(document.location.hash);
    if (results) {
      document.location.hash = document.location.hash.replace(/&?oauthio=[^&]*/, "");
      oauth_result = decodeURIComponent(results[1].replace(/\+/g, " "));
      cookie_state = cookies.readCookie("oauthio_state");
      if (cookie_state) {
        client_states.push(cookie_state);
        cookies.eraseCookie("oauthio_state");
      }
    }
  })();
  window.location_operations = {
    reload: function() {
      return document.location.reload();
    },
    getHash: function() {
      return document.location.hash;
    },
    setHash: function(newHash) {
      return document.location.hash = newHash;
    },
    changeHref: function(newLocation) {
      return document.location.href = newLocation;
    }
  };
  return function(exports) {
    var delayedFunctions, delayfn, e, _preloadcalls;
    delayedFunctions = function($) {
      oauthio.request = require("./oauthio_requests")($, config, client_states, cache, providers_api);
      providers_api.fetchDescription = function(provider) {
        if (providers_desc[provider]) {
          return;
        }
        providers_desc[provider] = true;
        $.ajax({
          url: config.oauthd_api + "/providers/" + provider,
          data: {
            extend: true
          },
          dataType: "json"
        }).done(function(data) {
          providers_desc[provider] = data.data;
          providers_api.execProvidersCb(provider, null, data.data);
        }).always(function() {
          if (typeof providers_desc[provider] !== "object") {
            delete providers_desc[provider];
            providers_api.execProvidersCb(provider, new Error("Unable to fetch request description"));
          }
        });
      };
    };
    if (exports.OAuth == null) {
      exports.OAuth = {
        initialize: function(public_key, options) {
          var i;
          config.key = public_key;
          if (options) {
            for (i in options) {
              config.options[i] = options[i];
            }
          }
        },
        setOAuthdURL: function(url) {
          config.oauthd_url = url;
          config.oauthd_base = Url.getAbsUrl(config.oauthd_url).match(/^.{2,5}:\/\/[^/]+/)[0];
        },
        getVersion: function() {
          return config.version;
        },
        create: function(provider, tokens, request) {
          var i, make_res, make_res_endpoint, res;
          if (!tokens) {
            return cache.tryCache(exports.OAuth, provider, true);
          }
          if (typeof request !== "object") {
            providers_api.fetchDescription(provider);
          }
          make_res = function(method) {
            return oauthio.request.mkHttp(provider, tokens, request, method);
          };
          make_res_endpoint = function(method, url) {
            return oauthio.request.mkHttpEndpoint(provider, tokens, request, method, url);
          };
          res = {};
          for (i in tokens) {
            res[i] = tokens[i];
          }
          res.get = make_res("GET");
          res.post = make_res("POST");
          res.put = make_res("PUT");
          res.patch = make_res("PATCH");
          res.del = make_res("DELETE");
          res.me = oauthio.request.mkHttpMe(provider, tokens, request, "GET");
          return res;
        },
        popup: function(provider, opts, callback) {
          var defer, frm, getMessage, res, url, wnd, wndTimeout, _ref;
          getMessage = function(e) {
            if (e.origin !== config.oauthd_base) {
              return;
            }
            try {
              wnd.close();
            } catch (_error) {}
            opts.data = e.data;
            return oauthio.request.sendCallback(opts, defer);
          };
          wnd = void 0;
          frm = void 0;
          wndTimeout = void 0;
          defer = (_ref = window.jQuery) != null ? _ref.Deferred() : void 0;
          opts = opts || {};
          if (!config.key) {
            if (defer != null) {
              defer.reject(new Error("OAuth object must be initialized"));
            }
            if (callback == null) {
              return;
            } else {
              return callback(new Error("OAuth object must be initialized"));
            }
          }
          if (arguments.length === 2 && typeof opts === 'function') {
            callback = opts;
            opts = {};
          }
          if (cache.cacheEnabled(opts.cache)) {
            res = cache.tryCache(exports.OAuth, provider, opts.cache);
            if (res) {
              if (defer != null) {
                defer.resolve(res);
              }
              if (callback) {
                return callback(null, res);
              } else {
                return defer.promise();
              }
            }
          }
          if (!opts.state) {
            opts.state = sha1.create_hash();
            opts.state_type = "client";
          }
          client_states.push(opts.state);
          url = config.oauthd_url + "/auth/" + provider + "?k=" + config.key;
          url += '&redirect_uri=http%3A%2F%2Flocalhost';
          if (opts) {
            url += "&opts=" + encodeURIComponent(JSON.stringify(opts));
          }
          opts.provider = provider;
          opts.cache = opts.cache;
          wndTimeout = setTimeout(function() {
            if (defer != null) {
              defer.reject(new Error("Authorization timed out"));
            }
            if (opts.callback && typeof opts.callback === "function") {
              opts.callback(new Error("Authorization timed out"));
            }
            try {
              wnd.close();
            } catch (_error) {}
          }, 1200 * 1000);
          wnd = window.open(url, "_blank", 'toolbar=yes,closebuttoncaption=Back,presentationstyle=formsheet,toolbarposition=top,clearsessioncache=yes,clearcache=yes');
          wnd.addEventListener("loadstart", function(ev) {
            var results;
            if (ev.url.substr(0, 17) !== "http://localhost/") {
              return;
            }
            if (wndTimeout) {
              clearTimeout(wndTimeout);
            }
            results = /[\\#&]oauthio=([^&]*)/.exec(ev.url);
            wnd.close();
            if (results && results[1]) {
              opts.data = decodeURIComponent(results[1].replace(/\+/g, " "));
              opts.callback = callback;
              opts.provider = provider;
              oauthio.request.sendCallback(opts, defer);
            } else {
              if (opts.callback && typeof opts.callback === "function") {
                opts.callback(new Error("unable to receive token"));
              }
              if (defer != null) {
                defer.reject(new Error("unable to receive token"));
              }
            }
          });
          wnd.addEventListener("exit", function() {
            if (defer != null) {
              defer.reject(new Error("The popup was closed"));
            }
            if (opts.callback && typeof opts.callback === "function") {
              return opts.callback(new Error("The popup was closed"));
            }
          });
          return defer != null ? defer.promise() : void 0;
        },
        clearCache: function(provider) {
          cache.clearCache(provider);
        },
        http_me: function(opts) {
          if (oauthio.request.http_me) {
            oauthio.request.http_me(opts);
          }
        },
        http: function(opts) {
          if (oauthio.request.http) {
            oauthio.request.http(opts);
          }
        }
      };
      if (typeof window.jQuery === "undefined") {
        _preloadcalls = [];
        delayfn = void 0;
        if (typeof chrome !== "undefined" && chrome.extension) {
          delayfn = function() {
            return function() {
              throw new Error("Please include jQuery before oauth.js");
            };
          };
        } else {
          e = document.createElement("script");
          e.src = "http://code.jquery.com/jquery-2.1.1.min.js";
          e.type = "text/javascript";
          e.onload = function() {
            var i;
            delayedFunctions(window.jQuery);
            for (i in _preloadcalls) {
              _preloadcalls[i].fn.apply(null, _preloadcalls[i].args);
            }
          };
          document.getElementsByTagName("head")[0].appendChild(e);
          delayfn = function(f) {
            return function() {
              var arg, args_copy;
              args_copy = [];
              for (arg in arguments) {
                args_copy[arg] = arguments[arg];
              }
              _preloadcalls.push({
                fn: f,
                args: args_copy
              });
            };
          };
        }
        oauthio.request.http = delayfn(function() {
          oauthio.request.http.apply(exports.OAuth, arguments);
        });
        providers_api.fetchDescription = delayfn(function() {
          providers_api.fetchDescription.apply(providers_api, arguments);
        });
        oauthio.request = require("./oauthio_requests")(window.jQuery, config, client_states, cache, providers_api);
      } else {
        delayedFunctions(window.jQuery);
      }
    }
  };
};
