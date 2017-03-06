module.exports = {
    firstGreeting:"Hello, welcome to the Vent Network! If you want\
    some honest advice or just want someone to vent to, you can do it!\
    i'll match you with a someone else via this thread to chit chat, all anonymously.\
    Now, to buissness! Would you like to ask a question or answer a question?", 
    cannedResponse: "Oh your so funny! Whenever you're ready, just select on of the options below.",
    questionConfirmation: "Ok great. I will distribute your writing to potential listeners; I'll get back to you shortly!\
    Would you like to answer a question in the meantime?",
    questionRedo: "Can you please create a longer query?",
    answerRequest: "Would you like to be a listener while waiting on your advice?",
    noAvailableQuestion: "Sorry, no outstanding questions at this time. try again in a bit.",
    responseInstructions: "OK, whenever your ready, respond to the question by putting 'RE:' before your response.",
    
    isValidQuery: function(text,other,next){ //add more sophisticated check later
        var n = text.length;
        if(n > 5){
            next()
        } else {
            other()
        }
    }
}