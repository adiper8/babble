var http = require('http');
var urlUtil = require('url');
var md5 = require('md5');
var messages = require('./messages-util');

var clients = [];
var connctedClients = [];
var clientsStats = [];

//checks if the given string is valid json object
function IsJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

//create server and listening on port 9000
var server =  http.createServer(function (request, response) {
    
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, From');
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");

    if (request.method === 'OPTIONS'){
        response.writeHead(204);
        response.end();
        return;
    }
    var url_parts = urlUtil.parse(request.url);

    if (request.method === 'GET') {
        if(url_parts.pathname == '/login' || url_parts.pathname == '/logout'){
            //method not allowed
            response.writeHead(405);
            response.end();
            return;
        }
        
        var count;

        if (url_parts.pathname == '/messages'){

            if (url_parts.query != null)
            {
               count = url_parts.query.substring(8);
            }
           

            if (isNaN(count) || url_parts.query.substring(0,8) != 'counter='){
                //data is bad
                response.writeHead(400);
                response.end();
                return;
            }

            msgs_arr = messages.getMessages(count);

            if(msgs_arr != null) {
                response.writeHead(200);
                response.end(JSON.stringify( {
                    count: messages.getMsgsLength(),
                    isDelete: false,
                    append: msgs_arr
                }));
            }  else {
                clients.push(response);
            }
        }
        else if(url_parts.pathname == '/stats'){
            response.writeHead(200);
            response.end(JSON.stringify({
                users: connctedClients.length,
                messages: messages.getMsgsLength()
            }));
        }
        else if(url_parts.pathname == '/join'){
            clientsStats.push(response);
        }
        else{
            //doesn't match to all cases (GET) - url not found (error 404)
            response.writeHead(404);
            response.end();
            return;
        }
     }
     else if (request.method === 'POST') {
           
            if(url_parts.pathname == '/stats' || url_parts.pathname == '/join'){
                //method not allowed
                response.writeHead(405);
                response.end();
                return;
            }

            // message receiving
            var requestBody = '';
            request.on('data', function(chunk) {
                requestBody += chunk.toString();
            });

            request.on('end', function() {
                var data = '';

                if(!IsJsonString(requestBody)){
                    //data is bad
                    response.writeHead(400);
                    response.end();
                    return;
                }

                data = JSON.parse(requestBody);

                if(url_parts.pathname == '/messages'){

                    if(!("name" in data) || !("email" in data) || !("message" in data) || !("timestamp" in data)){
                        //data is bad
                        response.writeHead(400);
                        response.end();
                        return;
                    }
                    
                    msg_id = messages.addMessage({
                                name : data.name,
                                email : data.email,
                                avatar : md5(data.email), 
                                msg : data.message, 
                                time : data.timestamp,
                            });

                    response.writeHead(200, { "Content-Type": "text/json" });
                    response.end(JSON.stringify({
                        id : msg_id
                    }));

                    while(clients.length > 0) {
                        var client = clients.pop();
                        client.writeHead(200, { "Content-Type": "text/json" });
                        client.end(JSON.stringify({
                        count: messages.getMsgsLength(),
                        isDelete: false,
                        append: [{
                            name : data.name, 
                            email : data.email,
                            avatar : md5(data.email), 
                            msg : data.message, 
                            time : data.timestamp,
                            id : msg_id
                        }]
                        }));
                    }
                }
                else if (url_parts.pathname == '/login'){

                    if(!("name" in data) || !("email" in data)){
                        //data is bad
                        response.writeHead(400);
                        response.end();
                        return;
                    }
                    var userIsExist = false;
                    for (var i=0 ; i<connctedClients.length ; i++){
                        if(connctedClients[i].email == data.email && data.email != ''){
                            userIsExist = true;
                        }                             
                    }

                    if (userIsExist == false)
                    {
                            connctedClients.push({
                            name: data.name,
                            email: data.email
                        });
                    }

                    while (clientsStats.length > 0) {
                        var client = clientsStats.pop();
                        client.writeHead(200, {"Content-Type": "application/json"});
                        client.end(JSON.stringify({status: true}));
                    }

                    response.writeHead(200, {"Content-Type": "application/json"});
                    response.end(JSON.stringify({status: true}));
                }
                else if (url_parts.pathname == '/logout'){

                    if(!("name" in data) || !("email" in data)){
                        //data is bad
                        response.writeHead(400);
                        response.end();
                        return;
                    }

                    var oneDeleted = true;

                    for (var i=0 ; i<connctedClients.length && oneDeleted ; i++){
                        if(connctedClients[i].email == data.email){
                            connctedClients.splice(i, 1);   //remove client from connected clients list
                            oneDeleted = false;
                        }                             
                    }

                    while (clientsStats.length > 0) {
                        var client = clientsStats.pop();
                        client.writeHead(200, { "Content-Type": "text/json" });
                        client.end(JSON.stringify(true));
                    }

                    response.writeHead(200, {"Content-Type": "application/json"});
                    response.end(JSON.stringify({status: true}));
                }
                else{

                    //doesn't match to all cases - url not found (error 404)
                    response.writeHead(404);
                    response.end();
                    return;
                    
                }
            });
    }
    else if (request.method === 'DELETE'){
        if(url_parts.pathname == '/stats' || url_parts.pathname == '/join' ||
            url_parts.pathname == '/login' || url_parts.pathname == '/logout'){
             //method not allowed
             response.writeHead(405);
             response.end();
             return;
         }

        if (url_parts.pathname.substring(0,10) == '/messages/'){

            var receviedId = url_parts.path.substring(url_parts.path.lastIndexOf("/") + 1);

            if (isNaN(receviedId)){
                //data is bad
                response.writeHead(400);
                response.end();
                return;
            }
            

            messages.deleteMessage(receviedId);

            //send to all clients the specific id that should be deleted
            while(clients.length > 0) {
                var client = clients.pop();
                client.writeHead(200, { "Content-Type": "text/json" });
                client.end(JSON.stringify({
                count: messages.getMsgsLength(),
                isDelete: true,
                append: {
                    id : receviedId
                }
                }));
            }

            response.writeHead(200);
            response.end(JSON.stringify(true));
        }
        else{
            //doesn't match to all cases - url not found (error 404)
            response.writeHead(404);
            response.end();
            return;
        }
    }     
}).listen(9000);
console.log('Server running.');

module.exports = {server};