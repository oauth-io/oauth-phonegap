"use strict"
config = require("../config")
cookies = require("../tools/cookies")
cache = require("../tools/cache")
Url = require("../tools/url")
sha1 = require("../tools/sha1")
module.exports = (window, document, jQuery, navigator) ->
	$ = jQuery

	# datastore = datastore(config, document)
	Url = Url(document)
	cookies.init config, document
	cache.init cookies, config

	oauthio = request: {}
	providers_desc = {}
	providers_cb = {}
	providers_api =
		execProvidersCb: (provider, e, r) ->
			if providers_cb[provider]
				cbs = providers_cb[provider]
				delete providers_cb[provider]

				for i of cbs
					cbs[i] e, r
			return

		
		# "fetchDescription": function(provider) is created once jquery loaded
		getDescription: (provider, opts, callback) ->
			opts = opts or {}
			return callback(null, providers_desc[provider])  if typeof providers_desc[provider] is "object"
			providers_api.fetchDescription provider  unless providers_desc[provider]
			return callback(null, {})  unless opts.wait
			providers_cb[provider] = providers_cb[provider] or []
			providers_cb[provider].push callback
			return

	config.oauthd_base = Url.getAbsUrl(config.oauthd_url).match(/^.{2,5}:\/\/[^/]+/)[0]
	client_states = []
	oauth_result = undefined
	(parse_urlfragment = ->
		results = /[\\#&]oauthio=([^&]*)/.exec(document.location.hash)
		if results
			document.location.hash = document.location.hash.replace(/&?oauthio=[^&]*/, "")
			oauth_result = decodeURIComponent(results[1].replace(/\+/g, " "))
			cookie_state = cookies.readCookie("oauthio_state")
			if cookie_state
				client_states.push cookie_state
				cookies.eraseCookie "oauthio_state"
		return
	)()

	window.location_operations = {
		reload: ->
			document.location.reload()
		getHash: ->
			return document.location.hash
		setHash: (newHash) ->
			document.location.hash = newHash
		changeHref: (newLocation) ->
			document.location.href = newLocation
	}

	return (exports) ->
		
		# create popup
		delayedFunctions = ($) ->
			oauthio.request = require("./oauthio_requests")($, config, client_states, cache, providers_api)
			providers_api.fetchDescription = (provider) ->
				return  if providers_desc[provider]
				providers_desc[provider] = true
				$.ajax(
					url: config.oauthd_api + "/providers/" + provider
					data:
						extend: true

					dataType: "json"
				).done((data) ->
					providers_desc[provider] = data.data
					providers_api.execProvidersCb provider, null, data.data
					return
				).always ->
					if typeof providers_desc[provider] isnt "object"
						delete providers_desc[provider]

						providers_api.execProvidersCb provider, new Error("Unable to fetch request description")
					return

				return

			return
		unless exports.OAuth?
			exports.OAuth =
				initialize: (public_key, options) ->
					config.key = public_key
					if options
						for i of options
							config.options[i] = options[i]
					return

				setOAuthdURL: (url) ->
					config.oauthd_url = url
					config.oauthd_base = Url.getAbsUrl(config.oauthd_url).match(/^.{2,5}:\/\/[^/]+/)[0]
					return

				getVersion: ->
					config.version

				create: (provider, tokens, request) ->
					return cache.tryCache(exports.OAuth, provider, true)  unless tokens
					providers_api.fetchDescription provider if typeof request isnt "object"
					make_res = (method) ->
						oauthio.request.mkHttp provider, tokens, request, method
					make_res_endpoint = (method, url) ->
						oauthio.request.mkHttpEndpoint provider, tokens, request, method, url

					res = {}
					for i of tokens
						res[i] = tokens[i]
					res.get = make_res("GET")
					res.post = make_res("POST")
					res.put = make_res("PUT")
					res.patch = make_res("PATCH")
					res.del = make_res("DELETE")
					res.me = oauthio.request.mkHttpMe provider, tokens, request, "GET"

					res

				popup: (provider, opts, callback) ->
					getMessage = (e) ->
						return  if e.origin isnt config.oauthd_base
						try
							wnd.close()
						opts.data = e.data
						oauthio.request.sendCallback opts, defer
					wnd = undefined
					frm = undefined
					wndTimeout = undefined
					defer = window.jQuery?.Deferred()
					opts = opts or {}
					unless config.key
						defer?.reject new Error("OAuth object must be initialized")
						if not callback?
							return
						else
							return callback(new Error("OAuth object must be initialized"))
					if arguments.length is 2 and typeof opts == 'function'
						callback = opts
						opts = {}
					if cache.cacheEnabled(opts.cache)
						res = cache.tryCache(exports.OAuth, provider, opts.cache)
						if res
							defer?.resolve res
							if callback
								return callback(null, res)
							else
								return defer.promise()
					unless opts.state
						opts.state = sha1.create_hash()
						opts.state_type = "client"
					client_states.push opts.state
					url = config.oauthd_url + "/auth/" + provider + "?k=" + config.key
					url += '&redirect_uri=http%3A%2F%2Flocalhost'
					url += "&opts=" + encodeURIComponent(JSON.stringify(opts))  if opts
					
					opts.provider = provider
					opts.cache = opts.cache

					wndTimeout = setTimeout(->
						defer?.reject new Error("Authorization timed out")
						if opts.callback and typeof opts.callback == "function"
							opts.callback new Error("Authorization timed out")  
						try
							wnd.close()
						return
					, 1200 * 1000)

					wnd = window.open(url, "_blank", 'toolbar=yes,closebuttoncaption=Back,presentationstyle=formsheet,toolbarposition=top,clearsessioncache=yes,clearcache=yes')
					
					wnd.addEventListener "loadstart", (ev) ->
						return  if ev.url.substr(0, 17) isnt "http://localhost/"
						clearTimeout wndTimeout  if wndTimeout
						results = /[\\#&]oauthio=([^&]*)/.exec(ev.url)
						wnd.close()
						if results and results[1]
							opts.data = decodeURIComponent(results[1].replace(/\+/g, " "))
							opts.callback = callback
							opts.provider = provider
							oauthio.request.sendCallback opts, defer
						else
							if opts.callback and typeof opts.callback == "function"
								opts.callback new Error("unable to receive token")
							defer?.reject new Error("unable to receive token")
						return
					wnd.addEventListener "exit", () ->
						defer?.reject new Error("The popup was closed")
						opts.callback new Error("The popup was closed")  if opts.callback and typeof opts.callback == "function"

					return defer?.promise()
				clearCache: (provider) ->
					cache.clearCache provider
					return

				http_me: (opts) ->
					oauthio.request.http_me opts  if oauthio.request.http_me
					return

				http: (opts) ->
					oauthio.request.http opts  if oauthio.request.http
					return

			if typeof window.jQuery is "undefined"
				_preloadcalls = []
				delayfn = undefined
				if typeof chrome isnt "undefined" and chrome.extension
					delayfn = ->
						->
							throw new Error("Please include jQuery before oauth.js")
							return
				else
					e = document.createElement("script")
					e.src = "http://code.jquery.com/jquery-2.1.1.min.js"
					e.type = "text/javascript"
					e.onload = ->
						delayedFunctions window.jQuery
						for i of _preloadcalls
							_preloadcalls[i].fn.apply(null, _preloadcalls[i].args)
						return

					document.getElementsByTagName("head")[0].appendChild e
					delayfn = (f) ->
						->
							args_copy = []
							for arg of arguments
								 args_copy[arg] = arguments[arg]
							_preloadcalls.push
								fn: f
								args: args_copy

							return
				oauthio.request.http = delayfn(->
					oauthio.request.http.apply exports.OAuth, arguments
					return
				)
				providers_api.fetchDescription = delayfn(->
					providers_api.fetchDescription.apply providers_api, arguments
					return
				)
				oauthio.request = require("./oauthio_requests")(window.jQuery, config, client_states, cache, providers_api)
			else
				delayedFunctions window.jQuery
		return

