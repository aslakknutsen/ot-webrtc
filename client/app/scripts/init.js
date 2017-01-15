'use strict';

$(document).ready(function() {

    var cm = CodeMirror.fromTextArea(document.getElementById('editor'), {
        lineNumbers: true
    });

    var cmAdapter = new ot.CodeMirrorAdapter(cm);

    cmAdapter.registerCallbacks({
        change: function (operation, inversion) {
            console.log('operation', operation);
            console.log('inversion', inversion);
            // TODO pass message to the peer
        }
    });

    // TODO listen to messages

});