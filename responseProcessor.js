module.exports = {
    firstGreeting:"Hello, welcome to the Vent Network! If you want\
    some honest advice or just want someone to vent to, you can do it!\
    i'll match you with a someone else via this thread to chit chat, all anonymously.\
    Now, to buissness! Would you like to ask a question or answer a question?",  

    questionConfirmation: "Ok great. I will distribute your question to potential listeners; I'll get back to you shortly!\
    Would you like to answer a question in the meantime?",
    questionRedo: "Can you please rephrase that as a question?",
    
    isValidQuestion: function(text,other,next){ //add more sophisticated check later
        var n = text.endsWith("?");
        if(n){
            next()
        } else {
            other()
        }
    }
}