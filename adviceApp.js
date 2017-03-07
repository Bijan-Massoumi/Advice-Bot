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

var PAGE_ACCESS_TOKEN = "EAAReZBl5ZCcsgBAGKreHyR1Cjn4a0cdqrC4tCmoRNY9TSnNo48f6axka10rDXbb5guPTI8wADbOOGjiGdblRTm8rp3BA7PHvRAH8ZBDpyltyN2nyY5d6xOuSAG5Fj8PZC4Hk3ZAP1aJRzhCzZBGTCrDMHVwPrbhRSXZBn0AKlJeWwZDZD";

app.get('/adviceHook', function (req, res) {
   if (req.query['hub.verify_token'] === 'love') {
        res.send(req.query['hub.challenge'])
    }
    else {
        res.send('Webhook for advice bot')
    };
})

app.post('/adviceHook', function (req, res) {
  var data = req.body;
  
  if (data.object === 'page') {
    
    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;
      
    // Iterate over each messaging event
    entry.messaging.forEach(function(event) {
        
        dataHelp.notInUser(event.sender.id,function(){
            console.log("first use of bot")
            dataHelp.insertToUser(event.sender.id,String(0),String(0),String(0))
            sendOptionButtons(event.sender.id,responses.firstGreeting,true);
            return 0;
        })
  
        if (event.message) {   //normal text message
            console.log(event.message);
            receivedTextMessage(event);
        } else if (event.postback){  //for button presses
            var choice = event.postback.payload
            switch(choice){
                case "answer":
                    serveQuestion(event.sender.id)
                    break;
                case "question":
                    takeQuestion(event.sender.id)
                    break;
                case "cancel":
                    deleteQuestions(event.sender.id)
                    break;
            }
        } else {
            console.log("Webhook received unknown event: ", event);
        }
      });
    });
    res.sendStatus(200);
  }
});

function receivedTextMessage(event) {
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

    
    dataHelp.isAnsweringRando(event.sender.id,function(row){
        sendTextMessage(row['qID'],responses.foundAnswer + " '%s'".replace('%s',row['text']) +  "\n\n'%s'".replace('%s',messageText))
        var elseCallBack = function(){sendTextMessage(event.sender.id,"Ok,sent your response.")}
        dataHelp.hasOutstandingQuestions(event.sender.id,elseCallBack,function(){
            sendTextMessage(event.sender.id,"Ok,sent your response.")        
        })
        dataHelp.removeRandoConnection(senderID,row['qID'])
        globals.isConsideringPenPals[row['qID']] = senderID
    })
    
    //need to add penpal stuff
    if (!globals.expectingQuestion[senderID]){ 
        dataHelp.hasOutstandingQuestions(senderID,function(){sendOptionButtons(senderID,responses.cannedResponse,true)},function(){
            sendOptionButtons(senderID,responses.answerRequest,false);
            return 0
        });
    } else if (globals.expectingQuestion[senderID]) {
        responses.isValidQuery(messageText,function(){sendTextMessage(senderID,responses.questionRedo)},function(){
            dataHelp.addQuestion(senderID,messageText,0);
            sendOptionButtons(senderID,responses.questionConfirmation,false)
            globals.expectingQuestion[senderID] = false
        })
    } else if (messageAttachments) {
        sendTextMessage(senderID, "Wowza");
    }
}
function serveQuestion(senderID){
    var elseCallBack = function(){sendOptionButtons(senderID,responses.noAvailableQuestion,true)}
    var noQuestionCall = function(){dataHelp.hasOutstandingQuestions(senderID,elseCallBack,function(){
        sendOptionButtons(senderID,responses.noAvailableQuestion,false)
    }) }
    dataHelp.getQuestion(senderID,noQuestionCall,function(row){
        dataHelp.addContactPair(senderID,row["ID"])
        sendTextMessage(senderID,responses.responseInstructions + '\n\n"%s"'.replace('%s',row['questionText']))
        qAvail = true
    })
}
function takeQuestion(senderID){
    var ifNoQuestion = function(){
        sendTextMessage(senderID,"Ok, go ahead!")
        globals.expectingQuestion[senderID] = true
    }
    var ifQuestion = function(){sendOptionButtons(senderID,responses.maxQuestions,false)}
    dataHelp.hasOutstandingQuestions(senderID, ifNoQuestion,ifQuestion)
}
function deleteQuestions(senderID){
    var callback = function(){sendOptionButtons(senderID,responses.canceledQuestions,true)}
    dataHelp.deleteOpenQuestions(senderID,callback)
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
function sendOptionButtons(recipientId,desiredText,bothAllowed){
    if (bothAllowed){
        var options = [{   
            type: "postback",
            title: "Ask for Advice/Vent",
            payload: "question"
        },
        {
            type: "postback",
            title: "Give Feedback",
            payload: "answer"
        }]
    } else {
        var options = [{
            type: "postback",
            title: "Cancel Open Vents",
            payload: "cancel"
        },
        {       
            type: "postback",
            title: "Give Feedback",
            payload: "answer"
        }]
    }
    messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type:"button",
                    text: desiredText,
                    buttons: options
                }
            } 
        }   
    }
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
      //console.error(response);
      console.error(error);
    }
  });  
}

var server = app.listen(8080, function (req,res) {
   var host = server.address().address
   var port = server.address().port

   
   console.log("Example app listening at http://%s:%s", host, port)
})

