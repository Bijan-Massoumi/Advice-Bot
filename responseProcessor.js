module.exports = {
    firstGreeting:"Hello, welcome to the Vent Network! If you want\
    some honest advice or just want someone to vent to, you can do it!\
    i'll match you with a someone else via this thread to chit chat, all anonymously.\
    Now, to business! Would you like to ask a question or answer a question?", 
    cannedResponse: "Oh your so funny! Whenever you're ready,\
    just select on of the options below.",
    questionConfirmation: "Ok great. I will distribute your writing to potential listeners;\
    I'll get back to you shortly!\
    Would you like to answer a question in the meantime?",
    questionRedo: "Can you please create a longer query?",
    maxQuestions: "You already have the maximum number of questions!",
    answerRequest: "Would you like to be a listener while waiting on your advice?",
    noAvailableQuestion: "Sorry, no outstanding questions at this time. try again in a bit.",
    responseInstructions: "OK, whenever your ready, write out your response or issue one the\
    following commands (will insert commands)  before your response.",
    foundAnswer: "Hey, I found you a response to your open question:",
    canceledQuestions: "Your old questions are out the window! feel free to ask away!",
    
    isValidQuery: function(text,other,next){ //add more sophisticated check later
        var n = text.length;
        if(n > 5){
            next()
        } else {
            other()
        }
    }
}