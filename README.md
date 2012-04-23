Facebook Call API 0.0.2
=======================

## Purpose

There's likely other perfectly good modules out there to fetch data from the Facebook Graph. But I wanted to make a module that is quick and easy, allowing for rapid development.

***Important!*** This is an extremely early version. Not all of the request types are fully tested. YMMV

## Making Requests

You can make requests to the following:

`accounts`, `achievements`, `activities`, `adaccounts`, `albums`, `apprequests`, `books`, `checkins`, `comments`, `events`, `family`, `feed`, `friendlists`, `friendrequests`, `friends`, `games`, `groups`, `home`, `inbox`, `insights`, `interests`, `likes`, `links`, `movies`, `music`, `mutualfriends`, `notes`, `notifications`, `outbox`, `payments`, `permissions`, `photos`, `picture`, `posts`, `questions`, `scores`, `statuses`, `subscribers`, `subscriptions`, `tagged`, `television`, `threads`, `updates`, `user`, `videos`

Most of these are documented on [Facebook's Developers Page](http://developers.facebook.com/docs/reference/api/).

Making a request looks something like:

```js
var facebookGraphApi = require('facebook-graph-api')
var graph = new facebookGraphApi()

graph.likes('user_id', 'access_token', function(err, response, body) {
	console.dir(body)
})
```

If you need to pass a parameter like `limit` or `fields' then pass them as an `{}` object, just before the callback. 

```js
graph.likes('user_id', 'access_token', {
	limit: 10,
	fields: [ 'id', 'name' ]
}, function(err, response, body) {
	console.dir(body)
})
```

The `response` will be the full request response. If Facebook returns json in the request, then `body` will be the json object. Otherwise `body` will be whatever they return (possibly a string).

The `user` request is equivalent to a graph request to `/me/`. It returns information like name, birthday, location, et cetera.

## Using the User object

If you plan to make multiple requests for a given user, or simiply want an object that stores the returning data, then you can make a user object. There are two ways to do this.

```js
var facebookGraphApi = require('facebook-graph-api')
var graph = new facebookGraphApi()
var facebookUser

facebookUser = new graph.User('user_id', 'access_token')

// is equivalent to

facebookUser = new facebookGraphApi.User('user_id', 'access_token')
```

Now you can make the same requests avaiable in `graph`, as shown above, but with a `User` instance you only need to pass the callback.

```js
facebookUser.likes(function(err, response, body) {
	console.dir(body)
})
```

The callback receives the same arguments as the previous example. Though, in this case, the data returned is also stored in `facebookUser.data`. If you make a `likes` request, then the data from the call will be stored in `facebookUser.data.likes`.

```js
facebookUser.likes(function(err, response, body) {
	console.dir(body)

	// is equivalent to

	console.dir(facebookUser.data.likes)
})
```

Additionally, you can fire off a number of asynchronous requests, with a callback that will be fired when all are returned. But, in this case, the callback will receieve an error (if there was one) and the `facebookUser` object. Note that if more than one error resulting from the multiple requests, then you will only receive the first that was returned.

```js
facebookUser.get(['likes', 'feed', 'friends'], function(err, facebookUser) {
	console.dir(facebookUser.data)
});
```

## Installing

The easiest way to install is via [npm](http://npmjs.org/)

```
npm install Facebook_Graph_API
```