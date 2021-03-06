require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, {polling: true});
var api_request = require('request');

// ---------- LOGGIN FEATURES ----------
var fs = require('fs');
var util = require('util');
var log_file = fs.createWriteStream(__dirname + '/debug.log', {flags : 'a'});
var feedback_file = fs.createWriteStream(__dirname + '/feedback.log', {flags : 'a'});
var log_stdout = process.stdout;

console.log = function(d) { //
  log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};

console.feeback = function(d) {
    feedback_file.write(util.format(d) + '\n');
}
// ---------- LOGGIN FEATURES END ----------

// ---------- FAST ANSWERS ----------
var fastAnswers = JSON.parse(fs.readFileSync('./answers.json', 'utf8'));
// ---------- FAST ANSWERS END ----------

console.log("[DEBUG] Bot is starting...");

disclaimer = "Nota: Le risposte sono tratte dal sito del Ministero della Salute (salute.gov.it) e dal sito dell'Istituto Superiore di Sanità (iss.it)";


keyboard = function(array_of_tags) {
    let markup = {
        "reply_markup": {
            "keyboard": [array_of_tags],
            "resize_keyboard": true,
            "one_time_keyboard": true
        }
    }
    return markup;
}

bot.on('message', (msg) => {
     //bot.sendMessage(msg.chat.id, "Hello dear user");
     //console.log(msg);
     if(msg.text == "/start") return;
     if(msg.text == "Ciao" || msg.text == "ciao") {
         bot.sendMessage(msg.chat.id, "Ciao " + msg.from.first_name + ", chiedi quello che vuoi sul Coronavirus.");
         return;
     }
     if(msg.text == "Buongiorno" || msg.text == "buongiorno") {
         bot.sendMessage(msg.chat.id, "Buongiorno anche a te " + msg.from.first_name + ", chiedi quello che vuoi sul Coronavirus.");
         return;
     }
     if(msg.text == "Buonasera" || msg.text == "buonasera") {
         bot.sendMessage(msg.chat.id, "Buonasera anche a te " + msg.from.first_name + ", chiedi quello che vuoi sul Coronavirus.");
         return;
     }

     if(msg.text == "Grazie" || msg.text == "grazie") {
         bot.sendMessage(msg.chat.id, "Prego " + msg.from.first_name);
         return;
     }

     if(msg.text == "Arrivederci" || msg.text == "arrivederci") {
         bot.sendMessage(msg.chat.id, "Arrivederci " + msg.from.first_name + ", è stato un piacere rispondere alle tue domande.\nSe hai altri dubbi, sai dove trovarmi 😉");
         return;
     }



     let date = new Date(msg.date * 1000);
     let timestamp = date.getDate() + "/" + (date.getMonth()+1) + "/" + date.getFullYear() + "@" + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();


    let msgFromInfo = "";
    if(msg.chat.type == "private"){
        msgFromInfo = msg.from.first_name + "(" + msg.from.id + ")";
    }else if(msg.chat.type == "group"){
        msgFromInfo = msg.from.first_name + "(" + msg.from.id + "/" + msg.chat.title + ")";
    }

     console.log("[INFO](" + timestamp + ") Msg from " + msgFromInfo + ": " + msg.text);

     if(msg.text != null){
        // let mex = controlMessage(msg.text);
        let results = advancedControlMessage(msg.text); // bool, array

        if(results[0]) {
            let mex = results[1];
            if(mex.length > 1) {
                bot.sendMessage(msg.chat.id, "Scusa non capisco quali di questi argomenti ti interessino", keyboard(mex));
            } else {
                mex = mex[0];
                // console.log(util.inspect(mex, false, null, true /* enable colors */));
                if(mex.type == "text"){
                    bot.sendMessage(msg.chat.id, mex.reply + "\n\n" + disclaimer);
                    // console.feeback("Q:" + msg.text + "\tA:" + mex.reply);
                }else if(mex.type == "image"){
                    if(mex.reply.includes("gif")){
                        bot.sendVideo(msg.chat.id, mex.reply);
                    }else{
                        bot.sendPhoto(msg.chat.id, mex.reply);
                    }
                }else if(mex.type == "audio"){
                    //bot.sendAudio(msg.chat.id, mex.reply, "Xfox Assistant Bot", "Title", "Caption");
                    bot.sendVoice(msg.chat.id, mex.reply);
                }else if(mex.type == "api"){
                    api_request.get(mex.api, (error, response, body) => {
                        data = JSON.parse(body);
                        var reply = global[mex.parser](data);
                        // var reply = parseProtezioneCivileApi(data);
                        bot.sendMessage(msg.chat.id, reply + "\n\n" + mex.ref);
                    });
                }
            }
        }else{
            console.feeback("Q:" + msg.text + "\tA: NOANSWER");
            bot.sendMessage(msg.chat.id, "Al momento non sono in grado di rispondere alla tua domanda, ma mi informerò!\nNel frattempo ti consiglio di visitare i siti salute.gov.it e iss.it");
        }
     }
});


function controlMessage(message){

    /*
    for (const [key, phrases] of Object.entries(fastAnswers)) { //Check for fast answers
        if(message.toLowerCase().includes(key)){
            let rnd = Math.floor((Math.random() * (phrases.length-1)) + 0);
            return phrases[rnd];
        }
    }
    */

    // let found = null;
    // //TODO: Should substitute forEach with for (const [triggers, oneFastAnswer] of Object.entries(fastAnswers)), in order to use return inside the loop
    // fastAnswers.forEach(function(fastAnswer){ //For every fast answer
    //     fastAnswer.triggers.forEach(function(trigger){ //Check among all triggers
    //         let regex = new RegExp("\\b"+trigger+"\\b", "gi");//Search global and case insenstive
    //         let regexResult = message.match(regex);

    //         //console.log("Regex result: " + regexResult);

    //         if((regexResult != null) && !found){ //If RegEx matches and wasn't previously found
    //             let rnd = Math.floor((Math.random() * (fastAnswer.replies.length)) + 0);
    //             found = fastAnswer.replies[rnd];
    //             //return fastAnswer.replies[rnd]; //Can't do this with forEach (ahw man, that sucks), see comment above, substitute forEach with for
    //         }
    //     });
    // });

    return found;
}

function advancedControlMessage(message){
    let found = false;
    let found_tags = [];
    let reply = '';
    //TODO: Should substitute forEach with for (const [triggers, oneFastAnswer] of Object.entries(fastAnswers)), in order to use return inside the loop
    fastAnswers.forEach(function(fastAnswer){ //For every fast answer
        fastAnswer.triggers.forEach(function(trigger){ //Check among all triggers
            let regex = new RegExp("\\b"+trigger+"\\b", "gi");//Search global and case insenstive
            let regexResult = message.match(regex);

            if(regexResult != null){
                found = true;
                found_tags.push(regexResult[0])

                let rnd = Math.floor((Math.random() * (fastAnswer.replies.length)) + 0);
                reply = fastAnswer.replies[rnd]
            }
        });
    });

    if(found && found_tags.length === 1) {
        return [true, [reply]];
    }

    return [found, found_tags];   // values.first, values.second
}


function addZero(digit) {
    return ('0' + digit).slice(-2);
}

global.parseProtezioneCivileApi = function(data) {
    var last = data[data.length - 1];
    var last_date = new Date(last["data"]);
    var update_date = addZero(last_date.getDate()) + "/" + addZero(last_date.getMonth()) + "/" + last_date.getFullYear() + " alle ore "+ addZero(last_date.getHours()) + ":" + addZero(last_date.getMinutes());
    var reply = "Ultimo aggiornamento " + update_date + "\n\n";
    reply +=  "Positivi: " + last["totale_attualmente_positivi"] + "\n";
    reply +=  "Deceduti: " + last["deceduti"] + "\n";
    reply +=  "Guariti:  " + last["dimessi_guariti"] + "\n";

    return reply;
}
