#!/usr/bin/env nodejs
var sqlCall = require('./dataAPI');
var responses = require('./responseProcessor')
var bodyParser = require('body-parser')
var express = require('express');
var request = require('request');
var app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

var PAGE_ACCESS_TOKEN = "EAAReZBl5ZCcsgBAGKreHyR1Cjn4a0cdqrC4tCmoRNY9TSnNo48f6axka10rDXbb5guPTI8wADbOOGjiGdblRTm8rp3BA7PHvRAH8ZBDpyltyN2nyY5d6xOuSAG5Fj8PZC4Hk3ZAP1aJRzhCzZBGTCrDMHVwPrbhRSXZBn0AKlJeWwZDZD";

app.get('/adviceHook', function (req, res) {
   if (req.query['hub.verify_token'] === 'love') {
        res.send(req.query['hub.challenge'])
    }
    else {
        res.send('Hello World')
    };
})

app.post('/adviceHook', function (req, res) {
  var data = req.body;
  // Make sure this is a page subscription
  if (data.object === 'page') {
    
    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          console.log(event.message);
          receivedMessage(event);
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    res.sendStatus(200);
  }
});

function receivedMessage(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfMessage = event.timestamp;
    var message = event.message;
    
    console.log("Received message for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);
    console.log(JSON.stringify(message));

    var messageId = message.mid;

    var messageText = message.text;
    var messageAttachments = message.attachments;

    if (messageText) {
        sqlCall.notInUser(senderID,function(){
            console.log("first use of bot")
            sqlCall.insertToUser(senderID,String(0),String(0),String(0))
            sendTextMessage(senderID, responses.firstGreeting);
            return 0;
        })
        //isQuestionResponse() TODO
        //isAnswerRequest() TODO
        sendTextMessage(senderID, messageText);
        
    } else if (messageAttachments) {
        sendTextMessage(senderID, "Message with attachment received");
    }
}
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
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s", 
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });  
}

var server = app.listen(8080, function (req,res) {
   var host = server.address().address
   var port = server.address().port

   
   console.log("Example app listening at http://%s:%s", host, port)
})

