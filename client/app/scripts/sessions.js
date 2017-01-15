'use strict';

new function (exp) {

    exp.Session = function (server, context) {
        const sessionUrl = server + '/' + context + '/sessions';
        return {
            start: function () {

                return $.ajax({
                    method: 'POST',
                    url: sessionUrl,
                    data: JSON.stringify({
                        'owner': this.whoami()
                    }),
                    dataType: 'json',
                    contentType: 'application/json'
                });
            },
            join: function (session) {
                return $.ajax({
                    method: 'PATCH',
                    url: sessionUrl + '/' + session,
                    data: JSON.stringify({
                        'participants': [
                            this.whoami()
                        ]
                    }),
                    dataType: 'json',
                    contentType: 'application/json'
                });
            },
            sessions: function () {
                return $.ajax({
                    method: 'GET',
                    url: sessionUrl,
                    dataType: 'json'
                });
            },
            whoami: function () {
                return {
                    'name': 'Test 2',
                    'peerid': 'AA'
                };
            }
        }
    }

}(window);