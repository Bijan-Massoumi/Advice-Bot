var mysql = require('mysql'); 
var keys = require('./sensitiveData') /*Where my passwords are stored*/
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'bmassoumi',
  password : keys.password,
  database : 'userdb'
});
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
    notInUser: function (ID,other,next){  //checks if user exists
        connection.query('SELECT * FROM User WHERE ID =' + String(ID),function(err,rows){
            if(err) throw err;
            if (rows.length == 0) {
                console.log("in false")
                next() 
            } else {
                other()
            } 
        });
    },
    addQuestion: function (ID,question,next){
        var dict = {
            ID:ID,
            questionText: question,
            questionIndex: 0,
            timesDistributed: 0
        }
        connection.query('INSERT INTO Questions SET ?',dict,function(err,res){
            if(err) throw err;
        });
    }

};
/*
connection.connect();
connection.query('SELECT * FROM User',function(err,rows){
    if(err) throw err;
    console.log(rows);

})
connection.end();*/