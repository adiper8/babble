'use strict';

let assert = require('assert');
let messages = require('../../server/messages-util');
let main = require('../../server/main.js');
let chai = require('chai'),
    expect = chai.expect;
let chaihttp = require('chai-http');

chai.use(chaihttp);

describe('Message', function () {
  it('should load the messages module', function () {
    assert.notEqual(null, messages);
  });
  it('should be able to add a new message and return id', function () {
    let message = { message: '1' };
    let id = messages.addMessage(message);
    assert.notEqual(null, id);
  });
  it('should return new messages', function () {
    let all = messages.getMessages(0);
    let newMessage = { message: '2' };
    messages.addMessage(newMessage);
    let newMessages = messages.getMessages(all.length);
    assert.deepEqual(newMessages, [newMessage]);
  });
  it('should be able to delete a message', function () {
    let message = { message: '3' };
    let id = messages.addMessage(message);
    messages.deleteMessage(id);
    assert.equal(null, messages.getMessages(0).find(m => m.id === id));
  });
});

describe('Server errors handling', function () {
  it('Should return error status 404 (not found)', function (done) {
    chai.request(main.server)
      .get('/Adi')
      .end(function (err, res) {
        expect(res).to.have.status(404);
        done();
      });
  });
  it('Should return error status 400 (bad request)', function (done) {
    chai.request(main.server)
      .get('/messages?counter=hello')
      .end(function (err, res) {
        expect(res).to.have.status(400);
        done();
      });
  });
  it('Should return error status 400 (bad request 2)', function (done) {
    chai.request(main.server)
      .get('/messages?shuki=5')
      .end(function (err, res) {
        expect(res).to.have.status(400);
        done();
      });
  });
  it('Should return error status 400 (missing property)', function (done) {
    //email property is missing
    let message = {
      name: 'Alex Krul',
      message: 'Hi from mocha',
      timestamp: Date.now()
    };
    chai.request(main.server)
      .post('/messages')
      .send(message)
      .end(function (err, res) {
        expect(res).to.have.status(400);
        done();
      });
  });
  it('Should return error status 405 (method not allowed)', function (done) {
    chai.request(main.server)
      .post('/stats')
      .end(function (err, res) {
        expect(res).to.have.status(405);
        done();
      });
  });

  it('Should return status 204', function (done) {
    chai.request(main.server)
      .options('/messages')
      .end(function (err, res) {
        expect(res).to.have.status(204);
        done();
      });
  });
});

describe('Additional', function () {
  it('Should add the user to clients list', function (done) {
    let loginInfo = {
      name: 'Adi Perlov',
      email: 'adiper8@gmail.com'
    };
    chai.request(main.server)
      .post('/login')
      .send(loginInfo)
      .end(function (err, res) {
        expect(res).to.have.status(200);
        expect(res.body).to.eql({status: true});
        done();
      });
  });
  it('Should remove the user from clients list', function (done) {
    let logoutInfo = {
      name: 'Adi Perlov',
      email: 'adiper8@gmail.com'
    };
    chai.request(main.server)
      .post('/logout')
      .send(logoutInfo)
      .end(function (err, res) {
        expect(res).to.have.status(200);
        expect(res.body).to.eql({status: true});
        done();
      });
  });
  it('should return number of messages', function () {
    let message = { message: '3' };
    let before = messages.getMsgsLength();
    messages.addMessage(message);
    let after = messages.getMsgsLength();
    assert.equal(before + 1, after);
  });
});