var mysql = require('mysql');
var keys = require('./sensitiveData')
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'bmassoumi',
  password : keys.password,
  database : 'userdb'
});
module.exports = {
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
    isInUser: function (ID,next){
        console.log("before query")
        connection.query('SELECT * FROM User WHERE ID =' + String(ID),function(err,rows){
            if(err) throw err;
            console.log("after Query")
            if (rows.length == 0) {
                console.log("in false")
                next() 
            } 
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