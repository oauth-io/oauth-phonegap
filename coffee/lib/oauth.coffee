"use strict"

cookies = require("../tools/cookies")
oauthio_requests = require("./request")
sha1 = require("../tools/sha1")

module.exports = (Materia) ->
	Url = Materia.getUrl()
	config = Materia.getConfig()
	document = Materia.getDocument()
	window = Materia.getWindow()
	$ = Materia.getJquery()
	cache = Materia.getCache()

	providers_api = require('./providers') Materia

	config.oauthd_base = Url.getAbsUrl(config.oauthd_url).match(/^.{2,5}:\/\/[^/]+/)[0]

	client_states = []
	location_operations = Materia.getLocationOperations()
	oauthio = request: oauthio_requests(Materia, client_states, providers_api)

	oauth = {
		initialize: (public_key, options) -> return Materia.initialize public_key, options
		setOAuthdURL: (url) ->
			config.oauthd_url = url
			config.oauthd_base = Url.getAbsUrl(config.oauthd_url).match(/^.{2,5}:\/\/[^/]+/)[0]
			return
		create: (provider, tokens, request) ->
			return cache.tryCache(oauth, provider, true)  unless tokens
			providers_api.fetchDescription provider  if typeof request isnt "object"
			make_res = (method) ->
				oauthio.request.mkHttp provider, tokens, request, method

			make_res_endpoint = (method, url) ->
				oauthio.request.mkHttpEndpoint provider, tokens, request, method, url

			res = {}
			for i of tokens
				res[i] = tokens[i]

			res.toJson = ->
				a = {}
				a.access_token = res.access_token if res.access_token?
				a.oauth_token = res.oauth_token if res.oauth_token?
				a.oauth_token_secret = res.oauth_token_secret if res.oauth_token_secret?
				a.expires_in = res.expires_in if res.expires_in?
				a.token_type = res.token_type if res.token_type?
				a.id_token = res.id_token if res.id_token?
				a.provider = res.provider if res.provider?
				a.email = res.email if res.email?
				return a

			res.get = make_res("GET")
			res.post = make_res("POST")
			res.put = make_res("PUT")
			res.patch = make_res("PATCH")
			res.del = make_res("DELETE")
			res.me = oauthio.request.mkHttpMe provider, tokens, request, "GET"

			res

		popup: (provider, opts, callback) ->
			gotmessage = false
			getMessage = (e) ->
				console.log("going in callback")
				console.log(JSON.stringify(e))
				if not gotmessage
					return  if e.origin isnt config.oauthd_base
					gotmessage = true
					try
						wnd.close()
					opts.data = e.data
					oauthio.request.sendCallback opts, defer
			wnd = undefined
			frm = undefined
			wndTimeout = undefined
			defer = $.Deferred()
			opts = opts or {}
			unless config.key
				defer?.reject new Error("OAuth object must be initialized")
				if not callback?
					return defer.promise()
				else
					return callback(new Error("OAuth object must be initialized"))
			if arguments.length is 2 and typeof opts == 'function'
				callback = opts
				opts = {}
			if cache.cacheEnabled(opts.cache)
				res = cache.tryCache(oauth, provider, opts.cache)
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
				gotmessage = true
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
				if not gotmessage
					defer?.reject new Error("The popup was closed")
					opts.callback new Error("The popup was closed")  if opts.callback and typeof opts.callback == "function"

			return defer?.promise()

		clearCache: (provider) ->
			cache.clearCache provider

		http_me: (opts) ->
			oauthio.request.http_me opts  if oauthio.request.http_me
			return

		http: (opts) ->
			oauthio.request.http opts  if oauthio.request.http
			return
		getVersion: () ->
			Materia.getVersion.apply this
	}
	return oauth
