new function (exp) {

	exp.Session = function (server, context) {
		return {
			start: function () {
				return $.ajax({
					method: 'POST',
					url: server + '/' + context + '/sessions',
					data: JSON.stringify({
						'owner': this.whoami()
					}),
					dataType: 'json',
					contentType: 'application/json'
				})
			},
			join: function (session) {
				return $.ajax({
					method: 'PATCH',
					url: server + '/' + context + '/sessions/' + session,
					data: JSON.stringify({
						'participants': [
							this.whoami()
						]
					}),
					dataType: 'json',
					contentType: 'application/json'
				})
			},
			sessions: function () {
				return $.ajax({
					method: 'GET',
					url: server + '/' + context + '/sessions',
					dataType: 'json'
				})
			},
			whoami: function () {
				return {
					'name': 'Test 2',
					'peerid': 'AA'
				}
			}
		}
	}

} (window)