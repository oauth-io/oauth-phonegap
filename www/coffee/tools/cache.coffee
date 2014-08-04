module.exports =
	init: (cookies_module, config) ->
		@config = config
		@cookies = cookies_module
	tryCache: (OAuth, provider, cache) ->
			if @cacheEnabled(cache)
				try
					cache = JSON.parse(window.localStorage.getItem("oauthio_provider_" + provider))
				catch e 
					cache = false
				if (cache and cache.date >= new Date().getTime())
					cache = cache.value
				else
					cache = false
				return false  unless cache
				cache = decodeURIComponent(cache)
			if typeof cache is "string"
				try cache = JSON.parse(cache)
				catch e
					return false
			if typeof cache is "object"
				res = {}
				for i of cache
  					res[i] = cache[i]  if i isnt "request" and typeof cache[i] isnt "function"
				return OAuth.create(provider, res, cache.request)
			false
	clearCache: (provider) ->
		if (provider?)
			window.localStorage.removeItem("oauthio_provider_" + provider)
		else
			try
				cached_providers = JSON.parse(window.localStorage.getItem("oauthio_cached_providers"))
			catch e 
				cached_providers = {}
			cached_providers = cached_providers || {}
			for k of cached_providers
				if (cached_providers[k])
					cached_providers[k] = false
					window.localStorage.removeItem("oauthio_provider_" + k)
			window.localStorage.setItem "oauthio_cached_providers", JSON.stringify(cached_providers)

	storeCache: (provider, cache) ->
		expires_in = cache.expires_in * 1000 - 10000 or 36000000
		window.localStorage.setItem "oauthio_provider_" + provider, JSON.stringify({ value: encodeURIComponent(JSON.stringify(cache)), date: new Date().getTime() + expires_in })
		try
			cached_providers = JSON.parse(window.localStorage.getItem("oauthio_cached_providers"))
		catch e 
			cached_providers = {}
		cached_providers = cached_providers || {}
		cached_providers[provider] = true
		window.localStorage.setItem "oauthio_cached_providers", JSON.stringify(cached_providers)
		return

	cacheEnabled: (cache) ->
		return @config.options.cache  if typeof cache is "undefined"
		cache