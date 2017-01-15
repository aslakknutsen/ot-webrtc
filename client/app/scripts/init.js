'use strict';

$(document).ready(function() {

    var cm = CodeMirror.fromTextArea(document.getElementById('editor'), {
        lineNumbers: true
    });

    var cmAdapter = new ot.CodeMirrorAdapter(cm);

    var user = getParameterByName("user");

    var peer = new Peer(user, { host: '192.168.0.174', port: 9000, secure: false, debug: 3 });
    peer.on('open', function (id) {
        console.log('My peer ID is: ' + id);

    });
    peer.on('connection', function (conn) {
        cmAdapter.registerCallbacks({
            change: function (operation, _) {
                console.log(operation);
                conn.send(operation);
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
                            var conn = peer.connect(resp[index].owner.name, {serialization: 'json'});
                            conn.on('open', function () {
                                cmAdapter.registerCallbacks({
                                    change: function (operation, _) {
                                        conn.send(operation);
                                    }
                                });
                                conn.on('data', function (data) {
                                    console.log('Received', data);
                                    cmAdapter.applyOperation(ot.TextOperation.fromJSON(data));
                                });
                            });
                        }
                    }(i)));
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