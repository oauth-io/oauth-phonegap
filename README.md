# OAuth.io Apache Cordova/PhoneGap Plugin

This is the official plugin for [OAuth.io](https://oauth.io) in [PhoneGap/Apache Cordova](http://incubator.apache.org/cordova/)!

The OAuth.io plugin for Apache Cordova/PhoneGap allows you to use the same JavaScript code in your PhoneGap application as you use in your web application, to connect any OAuth provider [available on OAuth.io](https://oauth.io/providers).

Lot of providers does not implement the _token_ response type, which typically lead developers to expose their secret keys. Using our unified interface, you always receive a token with a unique public key, and whatever the provider's implementation.

* Supported on PhoneGap (Cordova) v3.0.0 and above.


## OAuth.io Requirements and Set-Up

To use this plugin you will need to make sure you've registered your OAuth.io app and have a public key (https://oauth.io/docs).


### Installation

You can install this plugin into your project with the phonegap command-line interface:

	phonegap local plugin add https://github.com/oauth-io/oauth-phonegap


### Usage

The usage is basically the same than the web [javascript API](https://oauth.io/docs/api), but there are some light differences:

 - There is only the popup mode, as mobiles don't distinct redirection/popup.
 - jquery is not auto loaded by default, so you can include it only if you need its features.

In your Javascript, add this line to initialize OAuth:

	OAuth.initialize('Public key');

To connect your user to a provider (e.g. facebook):

 ```javascript
OAuth.popup('facebook', function(err, result) {
  //handle error with err
  //use result.access_token in your API request
});
 ```

If you include jquery, you can call an API with authorized requests (e.g. twitter):

 ```javascript
OAuth.popup("twitter", function(err, r) {
  // the tokens are still available via r.oauth_token / r.oauth_token_secret
  // You can use r.get / r.post / r.put / r.patch / r.del, with the same $.ajax options and syntax
  r.get('/1.1/account/verify_credentials.json').done(function(data) {
    // Hello, data.name !
  });
});
 ```

For more informations about API requests, you can see the [full documentation of this part](https://oauth.io/docs/requests)

### Run the included samples

1. Create a new project as described in the [PhoneGap documentation](http://docs.phonegap.com/en/edge/guide_cli_index.md.html#The%20Command-line%20Interface). By example:

		phonegap create oauthio-test com.example.oauthio-test OAuthioTest
		cd oauthio-test
		phonegap install android

2. Install OAuth.io plugin into the project

		phonegap local plugin add https://github.com/oauth-io/oauth-phonegap

3. Replace the generated example _index.html_ with the one included in the example folder, and copy jquery. A valid key is provided, but you can do your own app on [OAuth.io](https://oauth.io/). Also, please check that your _config.xml_ file contains `<access origin="*" />` or accept oauth.io and the provider's domain (e.g. graph.facebook.com).

4. Plug your phone & run it ! (or add --emulate)

		phonegap run android


### URL Whitelist

OAuth.io will try to access various URLs, and their domains must be whitelisted in your _config.xml_ under **access**.

You can either add each domain separately, depending on the providers you use:

* graph.facebook.com
* api.twitter.com
* github.com
...

Or you can allow all domains with `*`

### Troubleshoot

Make sure you only include this plugin in your app, and not the [web's JS](https://github.com/oauth-io/oauth-js) file.
