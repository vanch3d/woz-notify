/**
 * Created by Nicolas on 21/10/14.
 */
(function($) {
    var methods = {
        init: function(options) {
            var counter = 0;
            var trigger = 5;
            var dx= ["","fa-rotate-90","fa-rotate-180","fa-rotate-270"];

            $.ajaxSetup({ cache: false });
            methods.settings = $.extend({}, $.fn.flashNotification.defaults, options);
            methods.stack = {"dir1": "down", "dir2": "right", "push": "top"};
            setInterval(
                function() {
                    $(".alert #msg").html("");
                    $('.alert #monitor').html('<i class="fa fa-spinner '+dx[counter%dx.length]+'"></i>');
                    if (counter%trigger==0)
                    {
                        $.ajax( methods.settings.ajax ).done(function( data ) {
                            $(".alert #msg").html("...");
                        });
                    }
                    counter++;
                },
                100
            );

            methods.listenIncomingMessages();
        },

        /**
         * Listen to AJAX responses and display messages if they contain some
         */
        listenIncomingMessages: function() {
            $(document).ajaxComplete(function(event, xhr, settings) {
                var data = $.parseJSON(xhr.responseText);
                console.log(data);
                if (data.message) {
                    console.log("MESSAGE RECEIVED");
                    console.log(data.message);
                    var i;
                    var message = data.message;

                    if (message.error) {
                        for (i = 0; i < messages.error.length; i++) {
                            methods.addError(messages.error[i]);
                        }
                    }

                    if (message.type == "admin")  {
                        //var tag = $('.content-b .alertdd').attr('mydata');
                       //if (tag==message.date) return;
                        //message.msg="Screen Reloaded";
                        //var flashMessageElt = methods.getBasicFlash(message).addClass('alert-info');
                        //methods.addToList(flashMessageElt,true);
                        //methods.display(flashMessageElt);
                       // console.log(flashMessageElt);
                        location.reload(true);
                        return;
                    }

                    if (message.type == "info") {
                        methods.addInfo(message);

                    }
                    if (data.sensors) {
                        console.log("SENSORS: ");
                        $.each(data.sensors, function(index, value){
                            if (value.status=="active")
                                $("#"+index).show();
                            else
                                $("#"+index).hide();

                        });

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

            console.log(message);
            var tag = $('.content-b .alertdd').attr('mydata');
            if (tag==message.date) return;

            if ($.inArray("text",message.format) != -1)
            {
                var flashMessageElt = methods.getBasicFlash(message).addClass('alert-info');

                methods.addToList(flashMessageElt,true);
                methods.display(flashMessageElt);
            }

            if ($.inArray("tts",message.format) != -1)
            {
                var flashMessageElt2 = methods.getAudio(message);
                methods.addToList(flashMessageElt2,false);
                methods.display(flashMessageElt2);
            }
            if ($.inArray("pnotify",message.format) != -1)
            {
                new PNotify({
                    text: message.msg,
                    delay: 20000,
                    stack:  methods.stack,
                    addclass: "stack-topleft"
                });
            }
        },

        getBasicFlash: function(message) {
            var flashMessageElt = $('<div></div>')
                    .hide()
                    .addClass('alertdd')
                    .attr("mydata",message.date)
                    //.append(methods.getCloseButton())
                    .append($('<span></span>').html(message.msg))
                ;

            return flashMessageElt;
        },

        getAudio: function(message) {
            var flashMessageElt = $('<audio></audio>').attr({
                    'src':'/marytts/process?INPUT_TEXT='+message.msg+'&INPUT_TYPE=TEXT&OUTPUT_TYPE=AUDIO&AUDIO=WAVE_FILE&LOCALE=en_GB&VOICE=dfki-obadiah',
                    'volume':0.9,
                    'autoplay':'autoplay',
                    'controls': "controls"
                    //'onloadeddata' : "var audioPlayer = this; setTimeout(function() { audioPlayer.play(); }, 1200)"
                }).hide();

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

        addToList: function(flashMessageElt,clean) {

//            /flashMessageElt.appendTo($('.content-b'));
            if (clean)
                $('.content-b').empty();
           $('.content-b').append(flashMessageElt);
            //$('.content-b').append(flashMessageElt);
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