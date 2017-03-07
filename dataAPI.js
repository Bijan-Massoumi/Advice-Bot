var mysql = require('mysql'); 
var keys = require('./sensitiveData') /*Where my passwords are stored*/
var globals = require('./globals')
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'bmassoumi',
  password : keys.password,
  database : 'userdb'
});
function generateUUID () { 
    var d = new Date().getTime();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
        d += performance.now(); //use high-precision timer if available
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}
module.exports = {  //adds a new user to the database
    connection: connection,
    insertToUser: function (ID,numQuestion,numAnswer,numBlocks) {
        var dict = {
            ID: ID,
            numQuestions: numQuestion,
            numAnswers:numAnswer,
            numBlocks: numBlocks,
        };
        console.log(dict)
        connection.query('INSERT INTO User SET ?',dict,function(err,res){
            if(err) throw err;
        }); 
    },
    notInUser: function (ID,next){  //checks if user exists
        connection.query('SELECT * FROM User WHERE ID =' + String(ID),function(err,rows){
            if(err) throw err;
            if (rows.length == 0) {
                console.log("in false")
                next() 
            } 
        });
    },
    addQuestion: function (ID,question,next){
        var dict = {
            ID:ID,
            questionText: question,
            questionIndex: 0,
            timesDistributed: 0,
            questionID: generateUUID()
        }
        connection.query('INSERT INTO Questions SET ?',dict,function(err,res){
            if (err) throw err;
        })
                  
    },
    hasOutstandingQuestions: function(ID,other,next){
        connection.query('SELECT * FROM Questions WHERE ID =' + String(ID),function(err,rows){            
            if (rows.length >= globals.maxAllowedQuestions){
                next()
            } else {
                other()
            }
        })
    },
    getQuestion: function(senderID,other,next){
        var questionText = "SELECT ID,questionText FROM ((SELECT *  FROM Questions WHERE ID != " + String(senderID) + ") AS T) WHERE  timesDistributed = (SELECT MIN(timesDistributed) FROM Questions)limit 1;"
        connection.query(questionText,function(err,row){
            if (row.length > 0){
               next(row[0]) 
            } else {
                other()
            }   
        })
    },
    addContactPair: function(aID,qID){
        var dict = {
            aID: aID,
            qID: qID
        }
        connection.query("SELECT * FROM CurrentlyAnswering WHERE aID = " + aID + " AND qID = " + qID,function(err,row){
            if (row.length == 0){
                console.log("in addcontactpair")
                connection.query('INSERT INTO CurrentlyAnswering SET ?',dict,function(err,res){
                    if(err) throw err;
                }); 
            }
        })
    },
    isAnsweringRando: function(aID,next){
        returnDict = {}
        queryText = "SELECT qID FROM CurrentlyAnswering WHERE aID = "+ aID + ";";
        connection.query(queryText,function(err,row){
            if(row.length > 0){
                returnDict['qID'] = row[0]['qID']
                connection.query("SELECT questionText FROM Questions WHERE ID = " + returnDict['qID'],function(err,row){
                    returnDict['text'] = row[0]['questionText']
                    next(returnDict)
                })
            }
        })
    },
    removeRandoConnection: function(aID,qID){
        connection.query("DELETE FROM CurrentlyAnswering WHERE aID = "+aID+" And qID = " + qID+ ";",function(err,row){
            if(err) throw err;
        })
    },
    deleteOpenQuestions: function(senderID,next){
        connection.query("DELETE FROM Questions WHERE ID = " + senderID,function(err,res){
            next()
        })
    }
}
/*
connection.connect();
connection.query('SELECT * FROM User',function(err,rows){
    if(err) throw err;
    console.log(rows);

})
connection.end();*/