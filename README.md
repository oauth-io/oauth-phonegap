OAuth.io Cordova/Phonegap SDK
=======================

This is the Cordova/Phonegap SDK for [OAuth.io](https://oauth.io). OAuth.io allows you to integrate **100+ providers** really easily in your web app, without worrying about each provider's OAuth specific implementation.

Installation
============

* This plugin is supported on PhoneGap (Cordova) v3.0.0 and above.

OAuth.io Requirements and Set-Up
--------------------------------

To use this plugin you will need to make sure you've registered your OAuth.io app and have a public key (please check https://oauth.io/docs).

Getting the SDK
---------------

Run the following command in your project directory. If you are using Phonegap, use the `phonegap` command. If you are using Cordova, use the `cordova` command.

```sh
$ cordova plugin add https://github.com/oauth-io/oauth-phonegap
```

Whitelisting API URLs
---------------------

OAuth.io will try to access various URLs, and their domains must be whitelisted in your `config.xml` in the `<access />` tag's `origin` attribute :

```xml
<?xml version='1.0' encoding='utf-8'?>
<widget id="com.example.myapp" version="0.0.1" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0">
    <!-- ... -->
    <access origin="URL" />
    <!-- ... -->
</widget>
```


You can either add each domain separately, depending on the providers you use:

* graph.facebook.com
* api.twitter.com
* github.com
* ...

Or you can allow all domains with `*` like this :

```xml
<access origin="*" />
```


Integrating in your project
---------------------------

The `OAuth` object is automatically added to `window` when you include the plugin, so you don't need to add it yourself.

In your JavaScript, add this line to initialize OAuth.js. You can get the public key of your app from your [OAuth.io dashboard](https://oauth.io/dashboard/apps).

```javascript
OAuth.initialize('your_app_public_key');
```

Usage
=====

To connect your user using facebook (as an example):

 ```javascript
//Using popup (option 1)
OAuth.popup('facebook')
.done(function(result) {
  //use result.access_token in your API request 
  //or use result.get|post|put|del|patch|me methods (see below)
})
.fail(function (err) {
  //handle error with err
});
 ```

Using the cache
---------------

As of version `0.2.0`, you can use the cache feature. This prevents the user from having to log in to the provider through a popup everytime he wants to access the app.

To use the cache, pass an options object to your popup method like this :

```javascript
OAuth.popup('facebook', {
    cache: true
})
.done(function(result) {
  //use result.access_token in your API request 
  //or use result.get|post|put|del|patch|me methods (see below)
})
.fail(function (err) {
  //handle error with err
});
```

That way, your user will have to login to the provider only if the request token has not been retrieved yet or has expired.

Making requests
---------------

You can make requests to the provider's API manually with the access token you got from the `popup` or `callback` methods, or use the request methods stored in the `result` object.

**GET Request**

To make a GET request, you have to call the `result.get` method like this :

```javascript
//Let's say the /me endpoint on the provider API returns a JSON object
//with the field "name" containing the name "John Doe"
OAuth.popup(provider)
.done(function(result) {
    result.get('/me')
    .done(function (response) {
        //this will display "John Doe" in the console
        console.log(response.name);
    })
    .fail(function (err) {
        //handle error with err
    });
})
.fail(function (err) {
    //handle error with err
});
```

**POST Request**

To make a POST request, you have to call the `result.post` method like this :

```javascript
//Let's say the /message endpoint on the provider waits for
//a POST request containing the fields "user_id" and "content"
//and returns the field "id" containing the id of the sent message 
OAuth.popup(provider)
.done(function(result) {
    result.post('/message', {
        data: {
            user_id: 93,
            content: 'Hello Mr. 93 !'
        }
    })
    .done(function (response) {
        //this will display the id of the message in the console
        console.log(response.id);
    })
    .fail(function (err) {
        //handle error with err
    });
})
.fail(function (err) {
    //handle error with err
});
```

**PUT Request**

To make a PUT request, you have to call the `result.post` method like this :

```javascript
//Let's say the /profile endpoint on the provider waits for
//a PUT request to update the authenticated user's profile 
//containing the field "name" and returns the field "name" 
//containing the new name
OAuth.popup(provider)
.done(function(result) {
    result.put('/profile', {
        data: {
            name: "John Williams Doe III"
        }
    })
    .done(function (response) {
        //this will display the new name in the console
        console.log(response.name);
    })
    .fail(function (err) {
        //handle error with err
    });
})
.fail(function (err) {
    //handle error with err
});
```

**PATCH Request**

To make a PATCH request, you have to call the `result.patch` method like this :

```javascript
//Let's say the /profile endpoint on the provider waits for
//a PATCH request to update the authenticated user's profile 
//containing the field "name" and returns the field "name" 
//containing the new name
OAuth.popup(provider)
.done(function(result) {
    result.patch('/profile', {
        data: {
            name: "John Williams Doe III"
        }
    })
    .done(function (response) {
        //this will display the new name in the console
        console.log(response.name);
    })
    .fail(function (err) {
        //handle error with err
    });
})
.fail(function (err) {
    //handle error with err
});
```

**DELETE Request**

To make a DELETE request, you have to call the `result.del` method like this :

```javascript
//Let's say the /picture?id=picture_id endpoint on the provider waits for
//a DELETE request to delete a picture with the id "84"
//and returns true or false depending on the user's rights on the picture
OAuth.popup(provider)
.done(function(result) {
    result.del('/picture?id=84')
    .done(function (response) {
        //this will display true if the user was authorized to delete
        //the picture
        console.log(response);
    })
    .fail(function (err) {
        //handle error with err
    });
})
.fail(function (err) {
    //handle error with err
});
```

**Me() Request**

The `me()` request is an OAuth.io feature that allows you, when the provider is supported, to retrieve a unified object describing the authenticated user. That can be very useful when you need to login a user via several providers, but don't want to handle a different response each time.

To use the `me()` feature, do like the following (the example works for Facebook, Github, Twitter and many other providers in this case) :

```javascript
//provider can be 'facebook', 'twitter', 'github', or any supported
//provider that contain the fields 'firstname' and 'lastname' 
//or an equivalent (e.g. "FirstName" or "first-name")
var provider = 'facebook';

OAuth.popup(provider)
.done(function(result) {
    result.me()
    .done(function (response) {
        console.log('Firstname: ', response.firstname);
        console.log('Lastname: ', response.lastname);
    })
    .fail(function (err) {
        //handle error with err
    });
})
.fail(function (err) {
    //handle error with err
});
```

*Filtering the results*

You can filter the results of the `me()` method by passing an array of fields you need :

```javascript
//...
result.me(['firstname', 'lastname', 'email'/*, ...*/])
//...
```


Contributing
============

**Issues**

Feel free to post issues if you have problems while using this SDK.

**Pull requests**

You are welcome to fork and make pull requests. We appreciate the time you spend working on this project and we will be happy to review your code and merge it if it brings nice improvements :)

If you want to do a pull request, please mind these simple rules :

- *One feature per pull request*
- *Write lear commit messages*
- *Unit test your feature* : if it's a bug fix for example, write a test that proves the bug exists and that your fix resolves it.
- *Write a clear description of the pull request*

If you do so, we'll be able to merge your pull request more quickly :)

Testing the SDK
===============

Unit Testing
------------

To test the SDK, you first need to install the npm modules `jasmine-node` and `istanbul` (to get the tests coverage) :

```sh
$ sudo npm install -g jasmine-node@2.0.0 istanbul
```

Then you can run the testsuite from the SDK www directory :

```sh
$ jasmine-node --verbose tests/unit/spec
```

Once you've installed `istanbul`, you can run the following command to get coverage information :

```sh
$ npm test
```

The coverage report is generated in the `coverage` folder. You can have a nice HTML render of the report in `coverage/lcof-report/index.html`

Running the included samples
------------------------

**Create a new project as described in the [PhoneGap documentation](http://docs.phonegap.com/en/edge/guide_cli_index.md.html#The%20Command-line%20Interface). For example:**

```sh
$ phonegap create oauthio-test com.example.oauthio-test OAuthioTest
$ cd oauthio-test
$ phonegap install android
```

**Install OAuth.io plugin into the project**

```sh
$ phonegap local plugin add https://github.com/oauth-io/oauth-phonegap
```

**Replace the generated example `index.html` with the one included in the example folder, and copy jquery.**

A valid key is provided, but you can do your own app on [OAuth.io](https://oauth.io/). Also, please check that your `config.xml` file contains `<access origin="*" />` or accept oauth.io and the provider's domain (e.g. graph.facebook.com).

**Plug your phone & run it ! (or add --emulate)**

```sh
$ phonegap run android
```

License
=======

This SDK is published under the Apache2 License.



More information in [oauth.io documentation](http://oauth.io/#/docs)
