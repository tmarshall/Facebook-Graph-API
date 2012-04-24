var 
	util = require('util'),
	request = require('request'),
	querystring = require('querystring'),
	nonIdBasedConnection = [ 'permissions', 'picture', 'user' ],
	connections,
	preQueryString = /.*\?/,
	toString = Object.prototype.toString

function graph() {
	return this
}

function prepOptions(options) {
	var
		key,
		prepped = {}

	// facebook using seconds, not ms
	for (key in options) prepped[key] = toString.call(options[key]) === '[object Date]' ? Math.floor((+options[key] + 1) / 1000) : options[key]
	
	return prepped
}

function connection(kind) {
	return function connfunc(id, accessToken, a, b) {
		var 
			lex = this,
			isUser = this instanceof User,
			isNonIdBased = ~nonIdBasedConnection.indexOf(kind),
			options, callback,
			pagingFunc

		a = isUser ? arguments[0] : a,
		b = isUser ? arguments[1] : b 

		options = a && toString.call(a) === '[object Object]' ? prepOptions(a) : false,
		callback = typeof a === 'function' ? a : b

		if (this instanceof User) id = this.id, accessToken = this.accessToken, this.data[kind] = this.data[kind] || (isNonIdBased ? null : {})

		if (typeof callback != 'function') throw 'No callback given for #' + kind + '()'

		request('https://graph.facebook.com/' + id + (kind === 'user' ? '' : '/' + kind) + '?access_token=' + accessToken + (options === false ? '' : '&' + querystring.stringify(options)), function(err, res, body) {
			var 
				i, l, key,
				paging = {}

			try {
				body = JSON.parse(body)
			} catch(e) {}

			if (isUser) {
				if (isNonIdBased) lex.data[kind] = typeof body == 'string' ? body : Array.isArray(body.data) ? body.data[0] : body.data ? body.data : body
				else if (Array.isArray(body.data)) for (i = 0, l = body.data.length; i < l; i++) lex.data[kind][body.data[i].id] = body.data[i]
			}

			if (body.paging) {
				pagingFunc = function(callback) {
					var pagingOptions = querystring.parse(body.paging[this].replace(preQueryString, ''))
					delete pagingOptions.access_token
					connfunc.apply(lex, (isUser ? [ ] : [ id, accessToken ]).concat([ pagingOptions, callback ]))
				}

				for (key in body.paging) paging[key] = pagingFunc.bind(key)
			}

			callback(err, res, body, paging)
		})
		
		return this
	}
}

;(connections = [
	'accounts', // nada
	'achievements', // developers.facebook.com/docs/achievements
	'activities',
	'adaccounts', // permissions
	'albums', // nada
	'apprequests', // nada
	'books',
	'checkins',
	'comments', // undocumented & nada
	'events',
	'family',
	'feed',
	'friendlists', // nada
	'friendrequests', // permissions
	'friends',
	'games',
	'groups',
	'home',
	'inbox', // permissions
	'insights', // nada (undocumented?)
	'interests',
	'likes',
	'links',
	'movies',
	'music',
	'mutualfriends', // needs 'user' param, and .data should be stored under that user id, within 'mutualfriends'
	'notes', // nada
	'notifications', // permissions
	'outbox', // permissions
	'payments', // permissions
	'permissions',
	'photos',
	'picture', // blob
	'posts',
	'questions', // undocumented - nada
	'scores', // nada
	'statuses',
	'subscribers', // undocumented
	'subscriptions', // 'this method must be called with an app access_token'
	'tagged',
	'television',
	'threads', // undocumented? permissions
	'updates', // permissions
	'user',
	'videos'
]).forEach(function(kind) {
	graph.prototype[kind] = connection(kind)
})

function User(id, accessToken) {
	if (arguments.length < 2) throw 'Users require a Facebook Id and an accessToken'

	this.id = id, 
	this.accessToken = accessToken,
	this.data = {}

	return this
}
util.inherits(User, graph)

User.prototype.get = function(toGet, a, b) {
	var 
		lex = this,
		i = 0, l = toGet.length, 
		finished = 0, 
		firstErr,
		getCallback = function(err) {
			if (err) firstErr = firstErr || err
			if (++finished === l) callback(firstErr, lex)
		}

	options = a && toString.call(a) === '[object Object]' ? prepOptions(a) : false,
	callback = typeof a === 'function' ? a : b

	if (!Array.isArray(toGet) || toGet.length === 0) throw 'Must supply at least one connection to \'get\''
	if (typeof callback != 'function') throw 'No callback given for #get()'

	for (; i < l; i++) {
		if (!~connections.indexOf(toGet[i])) throw toGet[i] + ' is not a valid \'connection\' type'

		this[toGet[i]].apply(lex, (options ? [ options ] : [ ]).concat([ getCallback ]))
	}
}

graph.prototype.User = User
graph.User = User

module.exports = graph