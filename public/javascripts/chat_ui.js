
//显示文本的辅助函数

//显示可疑的文本，不会解析为html标签
function divEscapedContentElement(message) {
    return $('<div style="text-align: right"></div>').text(message);
}
//显示系统创建的文本，可以解析html标签
    function divSystemContentElement(message){
        return $('<div></div>').html('<i>'+message+'</i>');
    }

//处理用户输入

    function processUserInput(chatApp,socket){
        var message = $('#send-message').val();
        var systemMessage;
        if(message.charAt(0) == '/'){

            systemMessage = chatApp.processCommand(message);
            if(systemMessage){
                $('#messages').append(divSystemContentElement(systemMessage));
            }

        }else{
            chatApp.sendMessage($('#room').text(),message);
            $('#messages').append(divEscapedContentElement(message));
            $('#messages').scrollTop($('#messages').prop('scrollHeight'));
        }
        $('#send-message').val('');
    }

//客户端初始化

    var socket = io.connect();
    $(document).ready(function(){
        var chatApp = new Chat(socket);

        socket.on('nameResult',function(result){
            var message;

            if(result.success){
                message = '' +'您的昵称为：'+result.name +'.';
            }else{
                message = result.message;
            }
            $('#messages').append(divSystemContentElement(message));
        });

        socket.on('joinResult',function(result){
            $('#room').text(result.room);
            $('#messages').append(divSystemContentElement('Room changes.'));
        });

        socket.on('message',function(message){
            var newElement = $('<div></div>').text(message.text);
            $('#messages').append(newElement);
        });

        socket.on('rooms',function(rooms){
            $('#room-list').empty();
            for(var room in rooms){
                room = room.substring(1,room.length);
                if(room!=''){
                    $('#room-list').append(divEscapedContentElement(room));
                }
            }

            $('#room-list div').click(function(){
                chatApp.processCommand('/join '+$(this).text());
                $('#send-message').focus();
            });
        });
        setInterval(function(){
            socket.emit('rooms');
        },1000);
        $('#send-message').focus();

        $('#send-form').submit(function(){
            processUserInput(chatApp,socket);
            return false;
        });
    });