Facebook Call API 0.0.4
=======================

## Purpose

There's likely other perfectly good modules out there to fetch data from the Facebook Graph. But I wanted to make a module that is quick and easy, allowing for rapid development.

***Important!*** This is an extremely early version. Not all of the request types are fully tested. YMMV

## Installing

The easiest way to install is via [npm](http://npmjs.org/)

```
npm install Facebook_Graph_API
```

## Making Requests

You can make requests to the following:

`accounts`, `achievements`, `activities`, `adaccounts`, `albums`, `apprequests`, `books`, `checkins`, `comments`, `events`, `family`, `feed`, `friendlists`, `friendrequests`, `friends`, `games`, `groups`, `home`, `inbox`, `insights`, `interests`, `likes`, `links`, `movies`, `music`, `mutualfriends`, `notes`, `notifications`, `outbox`, `payments`, `permissions`, `photos`, `picture`, `posts`, `questions`, `scores`, `statuses`, `subscribers`, `subscriptions`, `tagged`, `television`, `threads`, `updates`, `user`, `videos`

Most of these are documented on [Facebook's Developers Page](http://developers.facebook.com/docs/reference/api/).

Making a request looks something like:

```js
var facebookGraphApi = require('facebook-graph-api')
var graph = new facebookGraphApi()

graph.likes('user_id', 'access_token', function(err, response, body, paging) {
	console.dir(body)
})
```

If you need to pass an option like `limit` or `fields` then pass them as an `{}` object, just before the callback. 

```js
graph.likes('user_id', 'access_token', {
	limit: 10,
	fields: [ 'id', 'name' ]
}, function(err, response, body, paging) {
	console.dir(body)
})
```

The `response` will be the full request response. If Facebook returns json in the request, then `body` will be the json object. Otherwise `body` will be whatever they return (possibly a string).

The last parameter, `paging`, may contain `next` or `previous`. If available, you can call these with a callback. An example of this is given below.

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
facebookUser.likes(function(err, response, body, paging) {
	console.dir(body)
})
```

The callback receives the same arguments as the previous example. Though, in this case, the data returned is also stored in `facebookUser.data`. If you make a `likes` request, then the data from the call will be stored in `facebookUser.data.likes`.

```js
facebookUser.likes(function(err, response, body, paging) {
	console.dir(body)

	// is equivalent to

	console.dir(facebookUser.data.likes)
})
```

Additionally, you can fire off a number of asynchronous requests, with a callback that will be fired when all are returned. But, in this case, the callback will receieve an error (if there was one) and the `facebookUser` object. Note that if more than one error resulting from the multiple requests, then you will only receive the first that was returned.

Paging isn't available from a `get`.

```js
facebookUser.get(['likes', 'feed', 'friends'], function(err, facebookUser) {
	console.dir(facebookUser.data)
})
```

Also, similar to other requests, you can send an options object.

```js
facebookUser.get(['likes', 'feed', 'friends'], { limit: 1000 }, function(err, facebookUser) {
	console.dir(facebookUser.data)
})
```

## Paging

The last parameter sent to callbacks is `paging`, which _may_ contain `next` or `previous`. If available, these functions can be called with a callback to trigger another request, of the same critera, with the new callback.

The following example will request a user's posts, from day one. And will stop after the fourth `next`.

Note that in this example we pass a native date to `since`. Facebook actually takes dates in seconds, not milliseconds, and this module will adjust date object to make them work.

Also, we may only get one or two `next` functions. Or none at all. Hence the check for `paging.next`.

```js
var i = 0

var callback = function(err, response, body, paging) {
	i++
	console.log('Callback #' + i)

	if (i > 5 && paging.next) {
		return paging.next(callback)
	}

	console.dir(facebookUser.data.posts)
}

var fbLaunched = new Date(Date.parse('February 4, 2004'))

facebookUser.posts({ since: fbLaunched }, callback)
```

## Searching

Facebook offers [ways to search](http://developers.facebook.com/docs/reference/api/#searching) both public data (like posts, places, et cetera) as well as a user's own data.

Searching public data is achieved by calling the `search` method.

```js
graph.search('user_id', 'access_token', {
	q: 'today',
	type: 'post'
}, function(err, response, body, paging) {
	console.dir(body)
})

// is equivalent to

User.search({
	q: 'election',
	type: 'today'
}, function(err, response, body, paging) {
	console.dir(body)
})
```

The search on `graph` and `User` both search public data on Facebook. If you want to search a user's own posts (or other data), you'd have to do something like this:

```js
graph.posts('user_id', 'access_token', {
	q: 'fridge'
}, function(err, response, body, paging) {
	console.dir(body)
})

// is equivalent to

User.posts({
	q: 'fridge'
}, function(err, response, body, paging) {
	console.dir(body)
})
```

Note that on *some* public searches you don't need an auth key. Unlike other methods, the `graph.search` method allows you to ommit the user id and auth key.

```js
// this will work
graph.search({
	q: 'purple',
	type: 'post'
}, function(err, response, body, paging) {
	console.dir(body)
})

// this will fail, since facebook requires an auth key for this type of search
graph.search({
	q: 'purple',
	type: 'place'
}, function(err, response, body, paging) {
	console.dir(body)
})
```

Also worth mentioning is that the query string `q` will not be restricted to exact matches. Facebook matches against case-insensitive tokens. And Facebook does not ensure that tokens are not part of a word. So if you search for `what a day` it may yield a post message like `Day one and I don't know what I'm doing`. 