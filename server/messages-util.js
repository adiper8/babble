'use strict';

    var msgs = [];
    var idMsg = 0;
    
    function addMessage(message){
        message.id = idMsg;
        idMsg++;
        msgs.push(message);
        return message.id;
    }

    function getMessages(counter){

        if(msgs.length > counter) {
            return msgs.slice(counter);
        }

        return null;
    }

    function deleteMessage(id){
        //go over all messages and find the correct message and delete it.
        for (var i=0 ; i< msgs.length ; i++) {
            if(msgs[i].id == id){
                msgs.splice(i,1);    //delete object in index i
            }
        }
    }

    function getMsgsLength(){
        return msgs.length;
    }

    module.exports = { addMessage, getMessages, deleteMessage, getMsgsLength };

