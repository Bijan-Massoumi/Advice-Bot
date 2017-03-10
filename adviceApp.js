#!/usr/bin/env nodejs
var dataHelp = require('./dataAPI');
var responses = require('./responseProcessor')
var bodyParser = require('body-parser')
var express = require('express');
var request = require('request');
var globals = require('./globals')
var app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

var PAGE_ACCESS_TOKEN = 'EAAReZBl5ZCcsgBAGKreHyR1Cjn4a0cdqrC4tCmoRNY9TSnNo48' +
            'f6axka10rDXbb5guPTI8wADbOOGjiGdblRTm8rp3BA7PHvRAH8Z' +
            'BDpyltyN2nyY5d6xOuSAG5Fj8PZC4Hk3ZAP1aJRzhCzZBGTCrDM' +
            'HVwPrbhRSXZBn0AKlJeWwZDZD';

app.get('/adviceHook', function (req, res) {
   if (req.query['hub.verify_token'] === 'love') {
    res.send(req.query['hub.challenge'])
  } else {
    res.send('Webhook for advice bot')
  };
})

app.post('/adviceHook', function (req, res) {
  var data = req.body;
  
  if (data.object === 'page') {
  
    // iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var senderID = event.sender.id;
      var timeOfEvent = entry.time;
      
    // iterate over each messaging event
    entry.messaging.forEach(function(event) {
      // if new user
      dataHelp.notInUser(senderID, function() {
        console.log('first use of bot');
        dataHelp.insertToUser(senderID, String(0), String(0), String(0));
        sendOptionButtons(senderID, responses.firstGreeting, true);
      });
      
      // normal text message
      if (event.message) {   
        console.log(event.message);
        receivedTextMessage(event);
      // button press events
      } else if (event.postback) {  
        var choice = event.postback.payload;
        switch(choice) {
          case 'answer':
            serveQuestion(senderID);
            break;
          case 'question':
            takeQuestion(senderID);
            break;
          case 'cancel':
            deleteQuestions(senderID);
            break;
          case 'block':
            var callback = function() {
              sendTextMessage(senderID, 'User has been blocked');
            };
            dataHelp.blockUser(senderID,
                               globals.isConsideringPenPals[senderID],
                               callback);
            globals.isConsideringPenPals[senderID] = '';
            break;
        };
      } else {
        console.log('Webhook received attachment event: ', event);
      };
    });
  });
    res.sendStatus(200);
  };
});

function receivedTextMessage(event) {
  var message = event.message;
  var messageAttachments = message.attachments;
  var messageID = message.mid;
  var messageText = message.text;
  var recipientID = event.recipient.id;
  var senderID = event.sender.id;
  var timeOfMessage = event.timestamp;
  
  console.log('Received message for user %d and page %d at %d with message:', 
        senderID,
        recipientID,
        timeOfMessage);
  console.log(JSON.stringify(message));

  if (globals.expectingAnswer[senderID]) {

    var cancelResponse = function() {
      sendTextMessage(senderID, responses.questionerCanceled)
    };

    var sendResponse = function(row) {
      var responseText = '\'%s\'\n\n\'%s\''.format(row['text'],
                                                   messageText);
      sendAnswerButtons(row['qID'], responseText);
      var elseCallBack = function() {
        sendTextMessage(senderID, 'Message sent.');
      };

      dataHelp.hasOutstandingQuestions(senderID,
                                       elseCallBack,
                                       elseCallBack);

      dataHelp.removeRandoConnection(senderID, row['qID']);

      globals.expectingAnswer[senderID] = false;
      globals.isConsideringPenPals[row['qID']] = senderID;

    };

    dataHelp.isAnsweringRando(senderID,
                  cancelResponse,
                  sendResponse);

  };

  // TODO: need to add penpal stuff
  if (!globals.expectingQuestion[senderID]) { 

    var sendCannedResponse = function() {
      sendOptionButtons(senderID,responses.cannedResponse, true);
    };

    var sendAnswerRequest = function() {
      sendOptionButtons(senderID, responses.answerRequest, false);
    };

    dataHelp.hasOutstandingQuestions(senderID,
                     sendCannedResponse,
                     sendAnswerRequest);

  } else if (globals.expectingQuestion[senderID]) {

    var sendRedoQuestion = function() { 
      sendTextMessage(senderID, responses.questionRedo);
    };

    var sendOptions = function() {
      dataHelp.addQuestion(senderID, messageText, 0);
      sendOptionButtons(senderID, responses.questionConfirmation, false);
      globals.expectingQuestion[senderID] = false;
    };

    responses.isValidQuery(messageText,
                 sendRedoQuestion,
                 sendOptions);

  } else if (messageAttachments) {
    sendTextMessage(senderID, 'Wowza!');
  } else {
    sendTextMessage(senderID, 'Sorry, I\'m not sure how to \
                   respond to that.')
  };
};

function serveQuestion(senderID){

  var sendNoQuestionAvailable = function() {
    sendOptionButtons(senderID, responses.noAvailableQuestion, true)
  };

  // TODO: very confusing function names
  var noQuestionCall = function() {
    var x = function() {
      sendOptionButtons(senderID, responses.noAvailableQuestion, false);
    }
    dataHelp.hasOutstandingQuestions(senderID, sendNoQuestionAvailable, x);
  };

  var sendQuestion = function(row) {
    dataHelp.addContactPair(senderID, row['ID']);
    dataHelp.addHasRead(senderID, row['questionID']);
    globals.expectingAnswer[senderID] = true;

    var responseText = '%s\n\n\'%s\''.format(responses.responseInstructions,
                         row['questionText']);

    sendTextMessage(senderID, responseText);     
  };

  dataHelp.getQuestion(senderID, noQuestionCall, sendQuestion);
  
};

function takeQuestion(senderID){

  var ifNoQuestion = function() {
    sendTextMessage(senderID,'Ok, go ahead!')
    globals.expectingQuestion[senderID] = true
  };

  var ifQuestion = function() {
    sendOptionButtons(senderID, responses.maxQuestions, false);
  };

  dataHelp.hasOutstandingQuestions(senderID, ifNoQuestion,ifQuestion);

};

function deleteQuestions(senderID){

  var callback = function() {
    sendOptionButtons(senderID, responses.canceledQuestions, true)
  };

  dataHelp.deleteOpenQuestions(senderID, callback);
};

function sendTextMessage(recipientId, messageText) {
  var messageData = {
  recipient: {
    id: recipientId
  },
  message: {
    text: messageText
  }
  };
  callSendAPI(messageData);
};

// TODO: rework this function
function sendOptionButtons(recipientId, desiredText, bothAllowed){
  if (bothAllowed) {
    var options = [{   
      type: 'postback',
      title: 'Ask for Advice/Vent',
      payload: 'question'
    },
    {
      type: 'postback',
      title: 'Give Feedback',
      payload: 'answer'
    }]
  } else {
    var options = [{
      type: 'postback',
      title: 'Cancel Open Vents',
      payload: 'cancel'
    },
    {       
      type: 'postback',
      title: 'Give Feedback',
      payload: 'answer'
    }]
  };

  messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type:'button',
          text: desiredText,
          buttons: options
        }
      }
    }
  };
  callSendAPI(messageData);
};

function sendAnswerButtons(recipientId, desiredText){
  var options = [{
    type: 'postback',
    title: 'Block Writer',
    payload: 'block'
  },
  {       
    type: 'postback',
    title: 'Add As PenPal',
    payload: 'PenPal'
  }];

  messageData = {
  recipient: {
    id: recipientId
  },
  message: {
    attachment: {
      type: 'template',
      payload: {
        template_type:'button',
        text: desiredText,
        buttons: options
        }
      }
    }
  };
  callSendAPI(messageData); 
};

function callSendAPI(messageData) {
  var options = {uri: 'https://graph.facebook.com/v2.6/me/messages',
           qs: {access_token: PAGE_ACCESS_TOKEN},
           method: 'POST',
           json: messageData};
  request(options, 
      function (error, response, body) {
        if (!error && response.statusCode == 200) {
          var recipientId = body.recipient_id;
          var messageId = body.message_id;
          console.log('Successfully sent generic message with id %s' +
                ' to recipient %s', 
                messageId,
                recipientId);
        } else {
          console.error('Unable to send message.');
          console.error(error);
        };
      });  
};

var server = app.listen(8080, function (req, res) {
   var host = server.address().address
   var port = server.address().port 
   console.log('Example app listening at http://%s:%s', host, port)
});
