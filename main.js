var 
	util = require('util'),
	request = require('request'),
	nonIdBasedConnection = [ 'permissions', 'picture', 'user' ],
	connections

function graph() {
	return this
}

function connection(kind) {
	return function(id, accessToken, callback) {
		var 
			lex = this,
			isNonIdBased = ~nonIdBasedConnection.indexOf(kind)

		if (this instanceof User) callback = arguments[0], id = this.id, accessToken = this.accessToken, this.data[kind] = this.data[kind] || isNonIdBased ? null : {}

		if (typeof callback != 'function') throw 'No callback given for #' + kind + '()'

		request('https://graph.facebook.com/' + id + (kind === 'user' ? '' : '/' + kind) + '?access_token=' + accessToken, function(err, res, body) {
			var i, l

			try {
				body = JSON.parse(body)
			} catch(e) { }

			if (lex instanceof User) {
				if (isNonIdBased) lex.data[kind] = typeof body == 'string' ? body : Array.isArray(body.data) ? body.data[0] : body.data ? body.data : body
				else if (Array.isArray(body.data)) for (i = 0, l = body.data.length; i < l; i++) lex.data[kind][body.data[i].id] = body.data[i]
			}

			callback(err, res, body)
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

User.prototype.get = function(toGet, callback) {
	var 
		lex = this,
		i = 0, l = toGet.length, 
		finished = 0, 
		firstErr

	if (!Array.isArray(toGet) || toGet.length === 0) throw 'Must supply at least one connection to \'get\''
	if (typeof callback != 'function') throw 'No callback given for #get()'

	for (; i < l; i++) {
		if (!~connections.indexOf(toGet[i])) throw toGet[i] + ' is not a valid \'connection\' type'

		this[toGet[i]](function(err) {
			if (err) firstErr = firstErr || err
			console.log('got one')
			if (++finished === l) callback(firstErr, lex)
		})
	}
}

graph.prototype.User = User
graph.User = User

module.exports = graph