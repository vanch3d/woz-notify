/**
 * Created by Nicolas on 21/10/14.
 */
(function($) {
    var methods = {
        init: function(options) {
            var counter = 0;
            var dx= ["◓","◑","◒","◐"];

            methods.settings = $.extend({}, $.fn.flashNotification.defaults, options);
            console.log("FDFGFGGF");
            setInterval(
                function() {
                    $('.alert').html("<span class='vchar'>"+dx[counter%dx.length]+"</span>");
                        //.show('slow')
                        //.delay(methods.settings.hideDelay)
                        //.hide('fast')
                    ;
                    if (counter%10==5)
                        $( ".result").html("");
                    if (counter%10==0)
                    {
                        $('.alert').html("<span class='vchar'>⭕</span>");
                       // $( ".content-b" ).load( "/notification" );
                        $.ajax( "/notification" );
                    }
                    counter++;
                },
                1000
            );

            methods.listenIncomingMessages();
        },

        /**
         * Listen to AJAX responses and display messages if they contain some
         */
        listenIncomingMessages: function() {
            $(document).ajaxComplete(function(event, xhr, settings) {
                var data = $.parseJSON(xhr.responseText);
                console.log("MESSAGE RECEIVED");
                if (data.messages) {
                    var messages = data.messages;

                    var i;

                    if (messages.error) {
                        for (i = 0; i < messages.error.length; i++) {
                            methods.addError(messages.error[i]);
                        }
                    }

                    if (messages.success) {
                        for (i = 0; i < messages.success.length; i++) {
                            methods.addSuccess(messages.success[i]);
                        }
                    }

                    if (messages.info) {
                        console.log(messages.info);
                        for (i = 0; i < messages.info.length; i++) {
                            methods.addInfo(messages.info[i]);
                        }
                    }
                }
            });
        },

        addSuccess: function(message) {
            var flashMessageElt = methods.getBasicFlash(message).addClass('alert-success');

            methods.addToList(flashMessageElt);
            methods.display(flashMessageElt);
        },

        addError: function(message) {
            var flashMessageElt = methods.getBasicFlash(message).addClass('alert-error');

            methods.addToList(flashMessageElt);
            methods.display(flashMessageElt);
        },

        addInfo: function(message) {
            var flashMessageElt = methods.getBasicFlash(message).addClass('alert-info');

            methods.addToList(flashMessageElt);
            methods.display(flashMessageElt);
        },

        getBasicFlash: function(message) {
            var flashMessageElt = $('<div></div>')
                    .hide()
                    .addClass('alertdd')
                    //.append(methods.getCloseButton())
                    .append($('<span></span>').html(message))
                ;

            return flashMessageElt;
        },

        getAudio: function(message) {
            var flashMessageElt = $('<audio></audio>').attr({
                    'src':'http://api.naturalreaders.com/v2/tts/?t='+message+'&r=29&s=0&requesttoken=2fddbae4c4b4313753bc6f4a65e1e278&recognkey=04595a4428c8d269cecadeb884a054f6',
                    'volume':0.4,
                    'autoplay':'autoplay',
                    //'controls': "controls"
                })
                    .hide()
                    .addClass('alertdd')
                    //.append(methods.getCloseButton())
                    .append($('<span></span>').html(message))
                ;

            return flashMessageElt;
        },
        getCloseButton: function() {
            var closeButtonElt = $('<button></button>')
                    .addClass('close')
                    .attr('data-dismiss', 'alert')
                    .html('&times')
                ;

            return closeButtonElt;
        },

        addToList: function(flashMessageElt) {
            flashMessageElt.appendTo($('.content-b'));
        },

        display: function(flashMessageElt) {
            setTimeout(
                function() {
                    flashMessageElt
                        .show('slow')
                        //.delay(methods.settings.hideDelay)
                       // .hide('fast', function() { $(this).remove(); } )
                    ;
                },
                500
            );
        }
    };

    $.fn.flashNotification = function(method) {
        // Method calling logic
        if (methods[method]) {
            return methods[ method ].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || ! method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' +  method + ' does not exist on jQuery.flashNotification');
        }
    };

    $.fn.flashNotification.defaults = {
        'hideDelay'         : 4500,
        'autoHide'          : true,
        'animate'           : true
    };
})(jQuery);