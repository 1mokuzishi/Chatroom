
//声明变量
var socketio=require('socket.io');
var io;

var guestNumber=1;
var nickNames={};
var namesUsed=[];
var currentRoom={};

//定义聊天服务器listen,server中会调用listen
exports.listen=function(server){
    //启动socket.io服务器

    io=socketio.listen(server);
    //允许该服务器搭载在已有的http服务器上

    //定义监听连接事件
    io.sockets.on('connection',function(socket){
        //触发连接事件后，给用户分配访客名,并放入聊天室Lobby
        guestNumber=assignGuestName(socket,guestNumber,nickNames,namesUsed);
        joinRoom(socket,'Lobby');

        //处理用户的消息，更名，以及聊天室的创建和变更
        handleMessageBroadcasting(socket,nickNames);
        handleNameChangeAttempts(socket,nickNames,namesUsed);
        handleRoomJoining(socket);
        //监听rooms事件
        socket.on('rooms',function(){
            //触发rooms事件后向用户提供已经被占用的聊天室的列表
            socket.emit('rooms',io.sockets.manager.rooms);
        });
        handleClientDisconnection(socket,nickNames,namesUsed);
    });

}

//分配用户昵称
function assignGuestName(socket,guestNumber,nickNames,namesUsed){
    //生成新昵称
    var name='Guest' + guestNumber;
    //将生成的昵称与客户端连接的id相关联
    nickNames[socket.id]=name;
    //向用户发送昵称
    socket.emit('nameResult',{success: true,name:name});
    //将已经被占用的昵称存在nameUsed数组里
    namesUsed.push(name);
    //增加昵称计数器的值
    return guestNumber+1;

}

//进入聊天室
//将用户加入Socket.IO房间很简单，只需要调用socket对象的join方法就可以了

function joinRoom(socket,room){
    //让用户进入房间
    socket.join(room);
    //使用currentRoom记录用户当前所在房间
    currentRoom[socket.id]=room;
    //向新用户发送自己所在聊天室
    socket.emit('joinResult',{room:room});
    //向房间里的其他用户发送新用户进入了房间
    socket.broadcast.to(room).emit('message',{text:nickNames[socket.id]+'已经进入'+room+'.'});
    //确定这个房间里的所有用户
    var usersInRoom=io.sockets.clients(room);
    //如果不止一个人在这个房间就汇总一下都是谁
    if(usersInRoom.length>1){
        var usersInRoomSummary='在'+room+'房间中的用户有:';
        for(var index in usersInRoom){
            var userSocketId=usersInRoom[index].id;
            if(userSocketId != socket.id){
                if(index>0){
                    usersInRoomSummary+=', ';
                }
                usersInRoomSummary+=nickNames[userSocketId];
            }
        }
        usersInRoomSummary+='.';
        socket.emit('message',{text:usersInRoomSummary});
    }

}

//变更昵称: web browser -- nameAttempt事件 -->  NodeServer
//          NodeServer  -- nameResult事件 -->  web browser
//更名需要用户的浏览器同归Socket.IO发送一个请求，并接受表示失败和成功的response

function handleNameChangeAttempts(socket,nickNames,namesUsed){
    //添加nameAttempth事件的监听器
    socket.on('nameAttempt',function(name){
        //昵称不能以guest开头
        if(name.indexOf('Guest') == 0){
            socket.emit('nameResult',{success: false,message:'名字不能以"Guest"开头。'});
        }else{
            //判断昵称是否存在
            if(namesUsed.indexOf(name)==-1){
                //不存在
                var previousName=nickNames[socket.id];//用于存放旧名

                //用于存放旧名在已用名单的索引
                var previousNameIndex=namesUsed.indexOf(previousName);
                namesUsed.push(name);
                nickNames[socket.id]=name;
                //删除更名前的昵称
                delete namesUsed[previousNameIndex];
                socket.emit('nameResult',{success:true,name:name});
                socket.broadcast.to(currentRoom[socket.id]).emit('message',{text : previousName+' 更名为'+name+'.' });
            }else{
                //存在，返回信息
                socket.emit('nameResult',{success:false,message:'昵称已存在'});
            }
        }
    });
}


//发送聊天信息:
//BrowserA -- message事件 -->  NodeServer
//NodeServer -- message事件 -->  BrowserB/C/D

function handleMessageBroadcasting(socket){
    socket.on('message',function(message){
        socket.broadcast.to(message.room).emit('message',{text:nickNames[socket.id]+': '+message.text})
    });
}


//如果用户进入没有的房间，就需要创建房间
//Browser  -- join事件 -->  NodeServer
//NodeServer  -- joinResult --> Browser
function handleRoomJoining(socket){
    socket.on('join',function(room){
        //leave方法的使用
        socket.leave(currentRoom[socket.id]);
        joinRoom(socket,room.newRoom);
    });
}


//用户断开连接
//当用户离开程序时，从nickNames和namesUsed中移除用户昵称

function handleClientDisconnection(socket){
    socket.on('disconnect',function(){
        var nameIndex=namesUsed.indexOf(nickNames[socket.id]);
        delete namesUsed[nameIndex];
        delete nickNames[socket.id];
    });
}

