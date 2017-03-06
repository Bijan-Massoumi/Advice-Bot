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
        globals.questionQueue.push(dict)
    },
    hasOutstandingQuestions: function(ID,other,next){
        var count = 0;
        globals.questionQueue.forEach(function(element){
            if (element['ID'] == ID){count++}
        })
        if (count >= globals.maxAllowedQuestions){
            next()
        } else {
            other()
        }
    }
};
/*
connection.connect();
connection.query('SELECT * FROM User',function(err,rows){
    if(err) throw err;
    console.log(rows);

})
connection.end();*/