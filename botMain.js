const Discord = require('discord.js');
const requireDir = require('require-dir');
const bot = new Discord.Client();
const Logger = require("./Commands/Logger.js");
const Admin = require('./Commands/Admin.js');
const commands = requireDir('./Commands');
const fh = require('./Commands/FileHandler');

const { version } = require('./package.json');
var BotID;
var Prefixs = {};

bot.on('ready', () => { //At Startup
    init(bot); //inits some variables
});

bot.on('message', (message) => { //When Message sent

    if (message.author.bot) { return; } //If Author is a Bot, return

    let contentArgs = message.content.split(" "); //Split Message for simpler Access

    if (message.content.startsWith(Prefixs[message.guild.id])) {

        let command = message.content.substring(Prefixs[message.guild.id].length); //Get commandName
        command = command.substring(0, command.indexOf(' '));
        message.content = message.content.replace(Prefixs[message.guild.id], '!'); //Replacing Prefix for compability

        if (command.length == 0) {
            message.channel.send('No Command entered');
            return;
        }

        if (!commands.play.playKey(message, bot)) { //Checks if command is shortcut for music and plays it

            try {//Example !osurecent calls commands.osurecent.osurecent(message,bot)

                if (command.length == 1) {
                    commands['Shortcuts'][command](message, bot);
                } else {
                    commands[command][command](message, bot);
                }

            } catch (error) {
                Logger.log(error);
                message.channel.send('Command not Found, use !help for help');
            }
        }
    }

    if (contentArgs[0].startsWith('uwuadmin')) { //AdminCommands
        try {

            if (!contentArgs[1]) {
                message.channel.send('No Command entered');
                return;
            }

            if (Admin.isAdmin(message)) {
                Admin[contentArgs[1]](message, bot);
            } else {
                Logger.log(message.author.username + " executed an Admin command");
                message.channel.send('You are not an Admin');
            }

        } catch (error) {
            Logger.log(error);
            message.channel.send('Not a admin command');
        }
    }

    if (contentArgs[0].startsWith(BotID)) { //ChatBot
        commands.chat.chat(message);
    }

    if (fh.get('../Files/local/' + message.guild.id + '/settings.json')['emojiDetection']) { //Emoji detection in plain Text
        commands.emoji.emojiDetection(message, bot);
    }
});

bot.login(fh.get('../Files/local/botToken.json').token).catch(err => {
    Logger.log('botToken.json is invalid: ' + err);
    return;
}); //Starts Bot

module.exports = {
    /**
     * @param {String} prefix Any new Prefix
     * @param {Number} guildID The guildID of the Guild to change
     */
    updatePrefix: function (prefix, guildID) {
        Prefixs[guildID] = prefix;
    },
    /**
     * @param {Number} guildID The guildID of the Guild you want the Prefix from
     * @returns {Prefix} The searched Prefix
     */
    getPrefix: function (guildID) {
        return Prefixs[guildID];
    }
}

function init(bot) {

    commands.Channel.init(bot); //Init dcbot var in Channel
    fh.initSettings(bot); //Init dcbot var in fh
    BotID = '<@!' + bot.user.id + '>'; //Get BotID

    bot.user.setPresence({ game: { name: 'on ' + version }, status: 'online' }); //Set Bot as online

    for (let guild of bot.guilds) {

        let StandardChannel = commands.Channel.get('Standard', guild[1].id);//Init StandardChannels for all Guilds

        if (!StandardChannel) { //AutoPick a StandardChannel if none is set

            for (let ch of guild[1].channels) {

                if (ch[1].type == 'text') {
                    commands.Channel.set('Standard', ch[1].id, guild[1].id);
                    StandardChannel = bot.channels.get(ch[1].id);
                    break;
                }
            }
            StandardChannel.send('I have automatically picked this Channel as StandardChannel.\nYou can change it with setStandardChannel');
        }

        Prefixs[guild[0]] = fh.get('../Files/local/' + guild[0] + '/prefix.json'); //Init Prefix
        if (Prefixs[guild[0]] == '') {
            Prefixs[guild[0]] = '!';
        }
        StandardChannel.send('I am now ready to use: Prefix \'' + Prefixs[guild[0]] + '\'');
    }

    //Any Background tasks
    commands.league.checkForLOLGames(bot);
    commands.twitch.checkForStreams(bot);
    commands.Auto.goodbadBot(bot, true);
}