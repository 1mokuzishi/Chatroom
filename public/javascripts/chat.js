
//client
//使用Socket.IO的socket参数初始化Chat对象
var Chat = function(socket){
    this.socket=socket;
};

//发送消息
Chat.prototype.sendMessage=function(room,text){
    var message={
        room:room,
        text:text
    };
    this.socket.emit('message',message);
};

//变更房间
Chat.prototype.changeRoom=function(room){
    this.socket.emit('join',{
        newRoom:room
    });
};

//处理聊天命令join命令代表加入或创建房间，nick表示修改昵称
Chat.prototype.processCommand = function(command){
    var words=command.split(' ');
    //从第一个单词开始解析命令
    var command=words[0].substring(1,words[0].length).toLowerCase();

    var message =false;
    switch(command){
        //处理join命令
        case 'join':
            words.shift();
            var room =words.join(' ');
            this.changeRoom(room);
            break;

        //处理nick命令
        case 'nick':
            words.shift();
            var name = words.join(' ');
            this.socket.emit('nameAttempt',name);
            break;

        default:
            message = '不能识别的指令';
            break;
    }
    return message;
};


