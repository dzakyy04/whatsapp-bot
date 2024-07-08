const COMMANDS = require('../commands');
const { updateChatCount } = require('../helpers');
const {
    handleAllCommand,
    handleStickerCommand,
    handleKhodamCommand,
    handleNamedKhodamCommand,
    handleRankCommand,
    handleMenuCommand,
    handleReminderCommand,
    handleListReminderCommand
} = require('./commandHandlers');

const handleMessage = async (msg) => {
    try {
        const chat = await msg.getChat();
        if (chat.isGroup) {
            await updateChatCount(chat.id._serialized, msg.author || msg.from);
        }

        const command = msg.body.toLowerCase();

        if (command === COMMANDS.MENU) {
            await handleMenuCommand(msg);
        } else if (command === COMMANDS.ALL) {
            await handleAllCommand(msg);
        } else if (command === COMMANDS.STICKER) {
            await handleStickerCommand(msg);
        } else if (command === COMMANDS.KHODAM) {
            await handleKhodamCommand(msg);
        } else if (command.startsWith(`${COMMANDS.KHODAM} `)) {
            await handleNamedKhodamCommand(msg);
        } else if (command === COMMANDS.RANK) {
            await handleRankCommand(msg);
        } else if (command.startsWith(COMMANDS.REMINDER)) {
            await handleReminderCommand(msg);
        } else if (command === COMMANDS.LISTREMINDER) {
            await handleListReminderCommand(msg);
        }
    } catch (error) {
        console.error('Error handling message:', error);
    }
};

module.exports = { handleMessage };