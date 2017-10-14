'use strict';

let assert = window.chai.assert;
let sinon = window.sinon;
let Babble = window.Babble;

describe('LocalStorage', function() {
  it('should have one key named babble in json format', function() {
    let keys = Object.keys(localStorage);
    assert.equal(keys.length, 1);
    assert.deepEqual(keys, ['babble']);

    let data = localStorage.getItem('babble');
    assert.doesNotThrow(JSON.parse.bind(JSON, data));
  });
  it('should have mandatory keys', function() {
    let data = JSON.parse(localStorage.getItem('babble'));
    assert.exists(data.userInfo);
    assert.exists(data.currentMessage);
    assert.exists(data.userInfo.name);
    assert.exists(data.userInfo.email);
  });
});


describe('User state', function() {
  let originalValue;
  before(function() {
    originalValue = localStorage.getItem('babble');
  });
  after(function() {
    localStorage.setItem('babble', originalValue);
  });
  it('should be empty before registering', function() {
    let data = JSON.parse(localStorage.getItem('babble'));
    assert.isEmpty(data.userInfo.name);
    assert.isEmpty(data.userInfo.email);
  });
  it('should have details after register', function() {
    Babble.register({
      name: 'Alex Krul',
      email: 'alex@krul.co.il'
    });
    let data = JSON.parse(localStorage.getItem('babble'));
    assert.equal(data.userInfo.name, 'Alex Krul');
    assert.equal(data.userInfo.email, 'alex@krul.co.il');
  });
  it('should allow anonymous register', function() {
    Babble.register({
      name: '',
      email: ''
    });
    let data = JSON.parse(localStorage.getItem('babble'));
    assert.empty(data.userInfo.name);
    assert.empty(data.userInfo.email);
  });
});

describe('Client-Server', function() {
  let server, apiUrl;

  before(function() {
    apiUrl = 'http://localhost:9000';
    server = sinon.fakeServer.create();
  });
  beforeEach(function() {
    server.requests.length = 0;
  });
  after(function() {
    server.restore();
  });

  describe('API', function() {
    it('should issue GET /messages ', function() {
      server.respondWith('GET', `${apiUrl}/messages?counter=0`, JSON.stringify([]));
      let callback = sinon.spy();
      Babble.getMessages(0, callback);
      server.respond();
      sinon.assert.calledWith(callback, []);
    });

    it('should issue POST /messages ', function() {
      server.respondWith('POST', `${apiUrl}/messages`, JSON.stringify({id: '42'}));
      let callback = sinon.spy();
      let message = {
        name: 'Alex Krul',
        email: 'alex@krul.co.il',
        message: 'Hi from mocha',
        timestamp: Date.now()
      };
      Babble.postMessage(message, callback);
      server.respond();
      assert.equal(server.requests[0].requestBody, JSON.stringify(message));
      sinon.assert.calledWith(callback, {id: '42'});
    });
    it('should issue DELETE /messages/:id ', function() {
      server.respondWith('DELETE', `${apiUrl}/messages/42`, JSON.stringify(true));
      let callback = sinon.spy();
      Babble.deleteMessage('42', callback);
      server.respond();
      sinon.assert.calledWith(callback, true);
    });
    it('should issue GET /stats ', function() {
      server.respondWith('GET', `${apiUrl}/stats`, JSON.stringify({users: 5, messages: 20}));
      let callback = sinon.spy();
      Babble.getStats(callback);
      server.respond();
      sinon.assert.calledWith(callback, {users: 5, messages: 20});
    });
  });
});


describe('Additional functions', function() {
     let server, apiUrl;

    before(function() {
      apiUrl = 'http://localhost:9000';
      server = sinon.fakeServer.create();
    });
    beforeEach(function() {
      server.requests.length = 0;
    });
    after(function() {
      server.restore();
    });
    describe('Server access', function() {
      it('should issue POST /login ', function() {
        server.respondWith('POST', `${apiUrl}/login`, JSON.stringify({status: true}));
        let callback = sinon.spy();
        let loginInfo = {
          name: 'Adi Perlov',
          email: 'adiper8@gmail.com',
        };
        login(loginInfo,callback);
        server.respond();
        sinon.assert.calledWith(callback, {status: true});
      });
      it('should issue POST /logout ', function() {
        server.respondWith('POST', `${apiUrl}/logout`, JSON.stringify({status: true}));
        let callback = sinon.spy();
        let logoutInfo = {
          name: 'Adi Perlov',
          email: 'adiper8@gmail.com',
        };
        logout(logoutInfo,callback);
        server.respond();
        sinon.assert.calledWith(callback, {status: true});
      });
      it('should issue GET /join ', function() {
        server.respondWith('GET', `${apiUrl}/join`, JSON.stringify({status: true}));
        let callback = sinon.spy();
        joinToList(callback);
        server.respond();
        sinon.assert.calledWith(callback, {status: true});
      });
  });
  describe('Handler functions', function() {
    let originalValue;
    before(function() {
      originalValue = localStorage.getItem('babble');
    });
    after(function() {
      localStorage.setItem('babble', originalValue);
    });
    it('should be registered after registerHandle with TRUE parameter', function() {
      document.getElementById('register').elements.fullName.value = "Adi Perlov";
      document.getElementById('register').elements.email.value = "adiper8@gmail.com";
      registerHandle(true);
      let data = JSON.parse(localStorage.getItem('babble'));
      assert.equal(data.userInfo.name, 'Adi Perlov');
      assert.equal(data.userInfo.email, 'adiper8@gmail.com');
    });
    it('should update stats information after getStats', function() {
      getStatsHandler({users: 1, messages:2});
      let statsUsers =  document.getElementById('stats-users').innerHTML;
      let statsMessages =  document.getElementById('stats-messages').innerHTML;
      assert.equal(statsUsers, 1);
      assert.equal(statsMessages, 2);
    });
    it('should create message to display', function() {
      assert.equal(document.getElementById('msg3'), null)
      let name = 'Adi Perlov';
      let email = 'adiper8@gmail.com';
      let avatar = 'd6093d9baa9f1da78355ee40b28a7281';
      let msgString = 'This is example message';
      let timestampe = Date.now();
      let id = 3;

      createMessage(name, email, avatar, msgString, timestampe, id);
      assert.notEqual(document.getElementById('msg3'), null)
    });
    it('should remove message from display according to id', function() {
      let msgList = document.getElementById('id-msgList');
      let msg = document.createElement('li');
      msg.setAttribute('id', 'msg4');
      msgList.appendChild(msg);
      assert.notEqual(document.getElementById('msg4'), null)
      removeMessage(4);
      assert.equal(document.getElementById('msg4'), null);
    });
    it('should display modal', function() {
      displaymaodal();
      assert.equal(document.querySelector('.js-Modal-overlay').style.display, 'block');
      assert.equal(document.querySelector('.js-Modal').style.display, 'block');
    });
    it('should close modal display', function() {
        closemaodal();
        assert.equal(document.querySelector('.js-Modal-overlay').style.display, 'none');
        assert.equal(document.querySelector('.js-Modal').style.display, 'none');
    });
  });
});