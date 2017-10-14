console.log('hello from client');

//Global Babble var
window.Babble = {

    counter : 0,
    //register API function
    register: function register(userInfo){
        var babble =  {"userInfo": userInfo,
                       "currentMessage": ""};

        localStorage.setItem('babble', JSON.stringify(babble));
        closemaodal();
    },
    //getMessages API function
    getMessages: function getMessages(counter, callback) {
                var xhr = new XMLHttpRequest();
                xhr.open("GET", 'http://localhost:9000/messages?counter=' + counter);
                xhr.addEventListener("load", function(){
                    if(xhr.status != 200){
                        console.log('Status: ' + xhr.status + ' is not OK');
                        return;
                    }

                    var responseInfo = JSON.parse(this.responseText);
                    Babble.counter = responseInfo.count;
                    if (callback){
                        callback(responseInfo);
                    }
                    else {
                        //update the updated messages
                        document.getElementById('stats-messages').innerHTML = Babble.counter;
                        getMessagesHandler(responseInfo);
                        getMessages(Babble.counter, callback);
                    } 
                });
                xhr.send();
    },
    //postMessage API function
    postMessage: function postMessage(message, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "http://localhost:9000/messages", true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.addEventListener('load', function (e) { 
            if(xhr.status != 200){
                console.log('Status: ' + xhr.status + ' is not OK');
                return;
            }
            if(callback){
                callback(JSON.parse(this.responseText));
            }
        });
        xhr.send(JSON.stringify(message));
    },
    //deleteMessage API function
    deleteMessage: function deleteMessage(id, callback){
        var xhr = new XMLHttpRequest();
        xhr.open("DELETE", "http://localhost:9000/messages/" + id, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.addEventListener('load', function (e) { 
            if(xhr.status != 200){
                console.log('Status: ' + xhr.status + ' is not OK');
                return;
            }

            if(callback){
                callback(JSON.parse(this.responseText));
            }
        });
        xhr.send();
    },
    //getStats API function
    getStats: function getStats(callback){
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "http://localhost:9000/stats", true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.addEventListener('load', function (e) { 
            if(xhr.status != 200){
                console.log('Status: ' + xhr.status + ' is not OK');
                return;
            }

            if(callback){
                callback(JSON.parse(e.target.responseText));
            }
            joinToList();
        });
        xhr.send();
    }
};

//function prepare the relevant info (save/anonymous) for register api function
function registerHandle(isSave){
    var info;

    //save case
    if(isSave){
        var registerForm = document.getElementById("register");
            info = {name: registerForm.elements.fullName.value,
                email: registerForm.elements.email.value}
    }
    else{   //anonymous case
        info = {name: "",
                email: ""}
    }

    Babble.register(info);

}

//function will send to server the user info in login
function login(data, callback){
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "http://localhost:9000/login", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.addEventListener('load', function (e) { 
        if(xhr.status != 200){
            console.log('Status: ' + xhr.status + ' is not OK');
            return;
        }

        if(callback){
            callback(JSON.parse(this.responseText));
        }

        Babble.getStats(getStatsHandler);

    });
    xhr.send(JSON.stringify(data));
}

//function will remove the user from server accoring email
function logout(data, callback){
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "http://localhost:9000/logout", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.addEventListener('load', function (e) { 
        if(xhr.status != 200){
            console.log('Status: ' + xhr.status + ' is not OK');
            return;
        }

        if(callback){
            callback(JSON.parse(this.responseText));
        }

    });
    xhr.send(JSON.stringify(data));
}

//this function will append response to waiting list in server
//in order to get notify when some a user logs in or out
function joinToList(callback){
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "http://localhost:9000/join", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.addEventListener('load', function (e) { 
        if(xhr.status != 200){
            console.log('Status: ' + xhr.status + ' is not OK');
            return;
        }

        if(callback){
            callback(JSON.parse(this.responseText));
        }

        Babble.getStats(getStatsHandler);

    });
    xhr.send();
}

//This function will create new message to display in chat
function createMessage(name, email, avatar, msgString, timestampe, id){

        var msgList = document.getElementById('id-msgList');
        var avatarSrc = "https://www.gravatar.com/avatar/" + avatar;
        //get email form local storage
        var localStorageInfo =  JSON.parse(localStorage.getItem('babble'));
        if(name == "" && email == ""){
            name = "Anonymous";
            avatarSrc = "../images/anonymous-avatar.png"
        }

        var listItem = document.createElement('li');
        listItem.className = 'msgList-msgBox';
        listItem.id = "msg" + String(id);
        
        var nowDate = new Date(timestampe); 
        var hh = nowDate.getHours() < 10 ? '0' + nowDate.getHours() : nowDate.getHours();
        var mm = nowDate.getMinutes() < 10 ? '0' + nowDate.getMinutes() : nowDate.getMinutes();
        var msgTime = hh + ':' + mm;
   
        msgList.appendChild(listItem);

        var imgAvatatr = document.createElement('img');
        imgAvatatr.className = 'msgBox-avatar';
        imgAvatatr.setAttribute('alt', "");
        imgAvatatr.setAttribute('src', avatarSrc);
        

        listItem.appendChild(imgAvatatr);

        var divMsg = document.createElement('div');
        divMsg.className = 'msgBox-msgContent';
        divMsg.setAttribute('tabindex', '1');

        var cName = document.createElement('cite');
        cName.className = 'msgContent-name';
        cName.innerHTML = name;

        divMsg.appendChild(cName);

        var bTime = document.createElement('time');
        bTime.className = 'msgContent-time';
        bTime.innerHTML = msgTime;
        bTime.setAttribute('datetime', msgTime);
        divMsg.appendChild(bTime);

        //checks if this message beloge to current user
        if (email ==  localStorageInfo.userInfo.email && localStorageInfo.userInfo.email != "")
        {
            divMsg.className = 'msgBox-myMsgContent';
            var delButton = document.createElement('button');
            delButton.setAttribute('id', String(id));
            delButton.setAttribute('class', 'delButton');
            delButton.setAttribute('tabindex', '1');
            delButton.setAttribute('aria-label', 'Delete');
            delButton.setAttribute('onclick', 'Babble.deleteMessage(this.id);return false;');
            divMsg.appendChild(delButton);
        }

        var pContent = document.createElement('p');
        pContent.className = 'msgContent-msgText';
        pContent.innerHTML += msgString;

        divMsg.appendChild(pContent);  
        listItem.appendChild(divMsg);

        var objOl = document.getElementById("id-msgList");
        objOl.scrollTo(0,objOl.scrollHeight);
}

//funtion will display modal to user
function displaymaodal() {
    document.querySelector('.js-Modal').style.display = "block";
    document.querySelector('.js-Modal-overlay').style.display = "block";
}

//funtion will close the modal.
function closemaodal() {
    document.querySelector('.js-Modal').style.display = "none";
    document.querySelector('.js-Modal-overlay').style.display = "none";
}

//listener for catching submit button click
var submitForm = document.querySelector('.js-submitForm');
submitForm.addEventListener('submit', function(e) {
    e.preventDefault();
    if(document.getElementById('txt-message').value != ''){
        postMessageHandler();
        document.querySelector('.js-clone').innerHTML = '';
        document.querySelector('.js-submitForm').removeAttribute("style");
        document.querySelector('.js-msgList').removeAttribute("style");
     }  
});


//function prepare new message info for postMessage api function
function postMessageHandler(){
            var babble = JSON.parse(localStorage.getItem('babble'));
            var infoMessage = {name: babble.userInfo.name,
                               email: babble.userInfo.email, 
                               message: document.getElementById("txt-message").value,
                               timestamp: Date.now()}
    
            document.getElementById('txt-message').value = '';

            var localStorageInfo = JSON.parse(localStorage.getItem('babble'));
            localStorageInfo.currentMessage =  '';
            localStorage.setItem('babble', JSON.stringify(localStorageInfo));
            Babble.postMessage(infoMessage);
}

//function that remove / create message called after getMessages
function getMessagesHandler (data) {
    if (data !== undefined){
        if(data.isDelete){
            removeMessage(data.append.id)
        }
        else{
            for (var i=0 ; i< data.append.length ; i++) {
                var cMsg = data.append[i];  //current message
                createMessage(cMsg.name, cMsg.email, cMsg.avatar, cMsg.msg, cMsg.time, cMsg.id);
            }
        }
    }
}

//remove message according specific id
function removeMessage(id){
    var msgList = document.getElementById('id-msgList');
    var child = document.getElementById('msg' + String(id));

    msgList.removeChild(child);
}

//update stats info
function getStatsHandler(statsInfo){
    document.getElementById('stats-users').innerHTML = statsInfo.users;
    document.getElementById('stats-messages').innerHTML = statsInfo.messages
}

//listener for loading - should be active when new user is signed in
window.addEventListener("load", function(e) {
    checkLocalStorage();
    login({
        name: JSON.parse(localStorage.getItem('babble')).userInfo.name,
        email: JSON.parse(localStorage.getItem('babble')).userInfo.email
    });

    Babble.getMessages(Babble.counter);
    makeGrowable(document.querySelector('.js-growable'));
});

//function will remove the user from the server when logged out
window.onbeforeunload = function(){
    var mName = '';
    var mEmail = '';
    var localStorageInfo = JSON.parse(localStorage.getItem('babble'));
    if(localStorageInfo != null){
        mName = localStorageInfo.userInfo.name;
        mEmail = localStorageInfo.userInfo.email;
    }
    logout({
        name: mName,
        email: mEmail
    });
}


//if local sorage is exist sot get the info, else display modal
function checkLocalStorage(){
    if (storageAvailable('localStorage')) {
         if (!localStorage.getItem('babble')){ //modal should be displayed

            var babble_empty =  {
                "userInfo": {
                    "name": '',
                    "email": ''
                },
                "currentMessage": ""
            };

            localStorage.setItem('babble', JSON.stringify(babble_empty));
            displaymaodal();
         }
         else{
             var txtMsgInput = document.getElementById('txt-message');
             if (txtMsgInput != null){
                document.getElementById('txt-message').value = 
                JSON.parse(localStorage.getItem('babble')).currentMessage;
             }

         }
     }
     else {
         // Too bad, no localStorage for us
     }
}

//function will check if local storage is supported and available
function storageAvailable(type) {
    try {
        var storage = window[type],
            x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    }
    catch(e) {
        return e instanceof DOMException && (
            // everything except Firefox
            e.code === 22 ||
            // Firefox
            e.code === 1014 ||
            // test name field too, because code might not be present
            // everything except Firefox
            e.name === 'QuotaExceededError' ||
            // Firefox
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
            // acknowledge QuotaExceededError only if there's something already stored
            storage.length !== 0;
    }
}

//send the message when enter has been clicked
function enterpressalert(e, textarea){
    var code = (e.keyCode ? e.keyCode : e.which);
        if(code == 13) { //Enter keycode
           if(textarea.value != ''){
              postMessageHandler();
           }  
        }
}

//change the height of form and message list when textarea growing
function fixHeight(growDivStartHeight){
	
	var growDiv = document.querySelector('.js-growable').clientHeight;
	var formHeight = document.querySelector('.js-submitForm').clientHeight;
	var growPre = element = document.querySelector('pre').clientHeight;
	var msgListHeight = document.querySelector('.js-msgList').clientHeight;
	
    if(formHeight < growDiv){
		var diff = Math.abs(formHeight - growPre);
		
		var newFormHeight = formHeight + diff;
		
		if(newFormHeight > 300){
			newFormHeight = 300;
			diff = newFormHeight - formHeight;
		}
		
		document.querySelector('.js-submitForm').style.height = newFormHeight + 'px';
		
		var newMsgListHeight = msgListHeight - diff;
		document.querySelector('.js-msgList').style.height = newMsgListHeight + 'px';
	}
	else if (growDiv > growPre && growDiv > growDivStartHeight){

			var diff = Math.abs(formHeight - growPre);
			
			var newFormHeight = formHeight - diff;
			
			if(newFormHeight < growDivStartHeight){				
				document.querySelector('.js-submitForm').removeAttribute("style");
				document.querySelector('.js-msgList').removeAttribute("style");
			}
			else{
				document.querySelector('.js-submitForm').style.height = newFormHeight + 'px';
				var newMsgListHeight = msgListHeight + diff;
				document.querySelector('.js-msgList').style.height = newMsgListHeight + 'px';	
			}

	}
	
	//equal - do nothing..
}

//function that enlarge the textarea to accomodate the text inside
function makeGrowable(container) {
	var area = container.querySelector('textarea');
    var clone = container.querySelector('span');
    var growDivStartHeight;

    if(document.getElementById('id-grow') != null)
       growDivStartHeight = document.getElementById('id-grow').clientHeight;

	area.addEventListener('input', function(e) {
        //save current message in local storage
        var localStorageInfo = JSON.parse(localStorage.getItem('babble'));
        localStorageInfo.currentMessage =  document.getElementById('txt-message').value;
        localStorage.setItem('babble', JSON.stringify(localStorageInfo));

        clone.textContent = area.value;
        if(area.value == ''){
            document.querySelector('.js-submitForm').removeAttribute("style");
            document.querySelector('.js-msgList').removeAttribute("style");
        }
		fixHeight(growDivStartHeight);
	});
}