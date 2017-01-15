'use strict';

$(document).ready(function () {

    var cm = CodeMirror.fromTextArea(document.getElementById('editor'), {
        lineNumbers: true
    });

    var cmAdapter = new ot.CodeMirrorAdapter(cm);

    var user = getParameterByName("user");

    var peer = new Peer(user, { host: '192.168.0.174', port: 9000, secure: false, debug: 3 });
    peer.on('open', function (id) {
        console.log('My peer ID is: ' + id);

    });
    var peers = new Array()
    peer.on('connection', function (conn) {
        peers.push(conn)
        cmAdapter.registerCallbacks({
            change: function (operation, _) {
                console.log(operation);
                for (var i = 0; i < peers.length; i++) {
                    console.log("P Send to " + peers[i].peer)
                    peers[i].send(operation);
                }
            }
        });
        conn.on('data', function (data) {
            console.log('Received', data);
            cmAdapter.applyOperation(ot.TextOperation.fromJSON(data));
        });
    });


    var session = Session('http://192.168.0.174:8080', 'A');
    $('#share').click(function () {
        session.whoami = function () {
            return {
                'name': user
            };
        };
        session.start();
    });

    setInterval(function () {
        session.sessions().success(function (resp) {
            $('#sessions').html('');
            for (var i = 0; i < resp.length; i++) {
                var s = $('<div>');
                s.append($('<button>join</button>').click(
                    function (index) {
                        return function () {
                            session.whoami = function () {
                                return {
                                    name: user
                                }
                            };
                            session.join(index);
                            var c = function (name) {
                                var conn = peer.connect(name, { serialization: 'json' });
                                conn.on('open', function () {
                                    peers.push(conn)
                                    cmAdapter.registerCallbacks({
                                        change: function (operation, _) {
                                            for (var n = 0; n < peers.length; n++) {
                                                console.log("S Send to " + peers[n].peer)
                                                peers[n].send(operation);
                                            }

                                        }
                                    });
                                    conn.on('data', function (data) {
                                        console.log('Received', data);
                                        cmAdapter.applyOperation(ot.TextOperation.fromJSON(data));
                                    });
                                });
                            }
                            c(resp[index].owner.name)
                            for (var n = 0; resp[index].participants != null && n < resp[index].participants.length; n++) {
                                var part = resp[index].participants[n]
                                if (part.name != user) {
                                    c(part.name)
                                }
                            }

                        }
                    } (i)));
                s.append($("<div>" + JSON.stringify(resp[i], null, 4) + "</div>"));
                $("#sessions").append(s).append($("<br/>"));
            }
        })
    }, 2000);

    function getParameterByName(name, url) {
        if (!url) {
            url = window.location.href;
        }
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

});