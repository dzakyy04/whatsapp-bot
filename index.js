const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const khodams = require('./khodams');

// Constants
const COMMANDS = {
    ALL: '!all',
    STICKER: '!sticker',
    KHODAM: '!khodam',
    RANK: '!rank',
    MENU: '!menu'
};

// Chat count storage
let chatCounts = {};

// Helper functions
const convertToSticker = async (msg) => {
    try {
        const media = await msg.downloadMedia();
        await msg.reply(media, msg.from, { sendMediaAsSticker: true });
    } catch (error) {
        console.error('Failed to convert to sticker:', error);
        await msg.reply('Gagal mengonversi ke stiker.');
    }
};

const getRandomKhodam = () => {
    const randomIndex = Math.floor(Math.random() * khodams.length);
    return khodams[randomIndex];
};

const updateChatCount = (groupId, senderId) => {
    if (!chatCounts[groupId]) {
        chatCounts[groupId] = {};
    }
    chatCounts[groupId][senderId] = (chatCounts[groupId][senderId] || 0) + 1;
};

const getTopMembers = async (chat, limit = 10) => {
    const groupId = chat.id._serialized;
    const participants = await chat.participants;
    const topMembers = participants
        .map(participant => ({
            id: participant.id._serialized,
            count: chatCounts[groupId]?.[participant.id._serialized] || 0
        }))
        .filter(member => member.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

    return topMembers;
};

// Client configuration
const client = new Client({
    authStrategy: new LocalAuth(),
    webVersion: '2.2412.54',
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
    },
});

// Event handlers
const handleQR = (qr) => {
    qrcode.generate(qr, { small: true });
};

const handleReady = () => {
    console.log('Client is ready!');
};

const handleAuthenticated = () => {
    console.log('Client authenticated!');
};

const handleAuthFailure = (msg) => {
    console.error('Authentication failure', msg);
};

const handleMessage = async (msg) => {
    try {
        const chat = await msg.getChat();
        if (chat.isGroup) {
            updateChatCount(chat.id._serialized, msg.author || msg.from);
        }

        const command = msg.body.toLowerCase();

        if (command === COMMANDS.ALL) {
            await handleAllCommand(msg);
        } else if (command === COMMANDS.STICKER) {
            await handleStickerCommand(msg);
        } else if (command === COMMANDS.KHODAM) {
            await handleKhodamCommand(msg);
        } else if (command.startsWith(`${COMMANDS.KHODAM} `)) {
            await handleNamedKhodamCommand(msg);
        } else if (command === COMMANDS.RANK) {
            await handleRankCommand(msg);
        } else if (command === COMMANDS.MENU) {
            await handleMenuCommand(msg);
        }
    } catch (error) {
        console.error('Error handling message:', error);
    }
};

// Command handlers
const handleAllCommand = async (msg) => {
    const chat = await msg.getChat();
    if (!chat.isGroup) {
        await msg.reply('Command ini hanya bisa digunakan dalam grup');
        return;
    }

    let mentions = chat.participants.map(participant => `${participant.id.user}@c.us`);
    await chat.sendMessage('@all', { mentions });
};

const handleStickerCommand = async (msg) => {
    if (msg.hasQuotedMsg) {
        const quotedMessage = await msg.getQuotedMessage();
        if (quotedMessage.type === 'image') {
            await convertToSticker(quotedMessage);
        } else {
            await msg.reply('Balas ke sebuah gambar dengan command !sticker');
        }
    } else if (msg.type === 'image') {
        await convertToSticker(msg);
    } else {
        await msg.reply('Kirim atau balas ke sebuah gambar dengan command !sticker');
    }
};

const handleKhodamCommand = async (msg) => {
    const contact = await msg.getContact();
    const senderName = contact.name || contact.pushname || contact.id.user;
    const khodam = getRandomKhodam();
    await msg.reply(`Khodam ${senderName} adalah *${khodam}*`);
};

const handleNamedKhodamCommand = async (msg) => {
    const name = msg.body.slice(COMMANDS.KHODAM.length + 1).trim();
    const khodam = getRandomKhodam();
    await msg.reply(`Khodam ${name} adalah *${khodam}*`);
};

const handleRankCommand = async (msg) => {
    const chat = await msg.getChat();
    if (!chat.isGroup) {
        await msg.reply('Command ini hanya bisa digunakan dalam grup');
        return;
    }

    const topMembers = await getTopMembers(chat);

    if (topMembers.length === 0) {
        await msg.reply('Belum ada anggota yang mengirim chat.');
        return;
    }

    let rankMessage = '*Top anggota grup:*\n';

    for (let i = 0; i < topMembers.length; i++) {
        const member = topMembers[i];
        const contact = await client.getContactById(member.id);
        const name = contact.pushname || contact.name || member.id.split('@')[0];
        rankMessage += `${i + 1}. ${name}: ${member.count} chat\n`;
    }

    await msg.reply(rankMessage);
};

const handleMenuCommand = async (msg) => {
    const menuMessage = `*Daftar Command:*\n
    1. ${COMMANDS.ALL} - Tag semua anggota grup.
    2. ${COMMANDS.STICKER} - Mengonversi gambar menjadi stiker.
    3. ${COMMANDS.KHODAM} - Cek khodam untuk pengirim.
    4. ${COMMANDS.KHODAM} [nama] - Cek khodam untuk nama yang disebut.
    5. ${COMMANDS.RANK} - Menampilkan top anggota grup berdasarkan jumlah chat.
    6. ${COMMANDS.MENU} - Menampilkan daftar command.`;

    await msg.reply(menuMessage);
};

// Event listeners
client.on('qr', handleQR);
client.on('ready', handleReady);
client.on('authenticated', handleAuthenticated);
client.on('auth_failure', handleAuthFailure);
client.on('message', handleMessage);

// Initialize the client
client.initialize();
