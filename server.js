var http=require('http');
var fs=require('fs');
var path=require('path');
var mime=require('mime');
//缓存文件内容
var cache={};

//创建http服务器

var server=http.createServer(function(req,res){
    var filePath=false;
    if(req.url == '/'){
        //返回默认html
        filePath='public/index.html';
    }else{
        //将url转为文件的相对路径
        filePath='public'+req.url;
    }
    var absPath='./'+filePath;
    //返回静态文件
    serveStatic(res, cache, absPath);
});

//启动服务器
server.listen(3000,function(){
    console.log("Server listening on port 3000.");
});

//加载自定义的模块，处理socket.io服务端功能
var chatServer = require('./lib/chat_server');

//启动socket.io服务器
chatServer.listen(server);




//请求文件不存在返回404
function send404(res){
    res.writeHead(404,{"Content-Type":"text/plain"});
    res.write('Error 404 : resource not found');
    res.end();
}

//提供请求文件数据
function sendFile(res,filePath,fileContents){
    res.writeHead(200,{"content-type" : mime.lookup(path.basename(filePath))});
    res.end(fileContents);
}

//检查文件是否缓存，并决定从哪里读取数据
function serveStatic(res,cache,absPath){
    //检查文件是否缓存在内存中
    if(cache[absPath]){
        //从内存返回数据
        sendFile(res, absPath,cache[absPath]);

    }else{
        //检查文件是否存在
        fs.exists(absPath,function(exists){
            if(exists){
                //从硬盘中读取文件
                fs.readFile(absPath,function(err,data){
                    if(err){
                        send404(res);
                    }else{
                        //读取并返回文件
                        cache[absPath]=data;
                        sendFile(res,absPath,data);
                    }
                });
            }else{
                send404(res);
            }
        });

    }
}


