const dotenv = require('dotenv');
dotenv.config();

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const khodams = require('./khodams');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc, updateDoc, increment } = require('firebase/firestore');
const moment = require('moment');

// Firebase configuration
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Constants
const COMMANDS = {
    ALL: '!all',
    STICKER: '!sticker',
    KHODAM: '!khodam',
    RANK: '!rank',
    MENU: '!menu',
    REMINDER: '!reminder'
};

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

const updateChatCount = async (groupId, senderId) => {
    const groupRef = doc(db, 'groups', groupId);
    const memberRef = doc(groupRef, 'members', senderId);

    try {
        // Ensure the group document exists
        await setDoc(groupRef, { id: groupId }, { merge: true });
        const memberDoc = await getDoc(memberRef);

        if (memberDoc.exists()) {
            await updateDoc(memberRef, {
                chatCount: increment(1)
            });
        } else {
            await setDoc(memberRef, {
                chatCount: 1
            });
        }
    } catch (error) {
        console.error('Error updating chat count:', error);
    }
};

const getTopMembers = async (chat, limit = 10) => {
    const groupId = chat.id._serialized;
    const groupRef = doc(db, 'groups', groupId);
    const participants = await chat.participants;

    const topMembers = await Promise.all(
        participants.map(async (participant) => {
            const memberId = participant.id._serialized;
            const memberRef = doc(groupRef, 'members', memberId);
            const memberDoc = await getDoc(memberRef);
            return {
                id: memberId,
                count: memberDoc.exists() ? memberDoc.data().chatCount || 0 : 0
            };
        })
    );

    return topMembers
        .filter(member => member.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
};

// Client configuration
const client = new Client({
    authStrategy: new LocalAuth(),
    webVersion: '2.2412.54',
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
            await updateChatCount(chat.id._serialized, msg.author || msg.from);
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
        } else if (command.startsWith(COMMANDS.REMINDER)) {
            await handleReminderCommand(msg);
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

    rankMessage = rankMessage.trimEnd();
    await msg.reply(rankMessage);
};

const handleMenuCommand = async (msg) => {
    const menuMessage = `*Daftar Command:*
    1. *${COMMANDS.ALL}* - Tag semua anggota grup.
    2. *${COMMANDS.STICKER}* - Mengonversi gambar menjadi stiker.
    3. *${COMMANDS.KHODAM}* - Cek khodam untuk pengirim.
    4. *${COMMANDS.KHODAM}* [nama] - Cek khodam untuk nama yang disebut.
    5. *${COMMANDS.RANK}* - Menampilkan top anggota grup berdasarkan jumlah chat.
    6. *${COMMANDS.MENU}* - Menampilkan daftar command.
    7. *${COMMANDS.REMINDER}* - Mengatur pengingat. Format: !reminder [hari ini/besok/tanggal DD-MM-YYYY] [jam:menit] [pesan]`;

    await msg.reply(menuMessage);
};

const handleReminderCommand = async (msg) => {
    const parts = msg.body.split(' ');
    if (parts.length < 4) {
        await msg.reply('Format: !reminder [hari ini/besok/tanggal DD-MM-YYYY] [jam:menit] [pesan]');
        return;
    }

    let date, time, message;

    if (parts[1].toLowerCase() === 'hari' && parts[2].toLowerCase() === 'ini') {
        date = moment().format('DD-MM-YYYY');
        time = parts[3];
        message = parts.slice(4).join(' ');
    } else if (parts[1].toLowerCase() === 'besok') {
        date = moment().add(1, 'days').format('DD-MM-YYYY');
        time = parts[2];
        message = parts.slice(3).join(' ');
    } else {
        date = parts[1];
        time = parts[2];
        message = parts.slice(3).join(' ');
    }

    const reminderTime = moment(`${date} ${time}`, 'DD-MM-YYYY HH:mm');

    if (!reminderTime.isValid()) {
        await msg.reply('Format tanggal atau waktu tidak valid.');
        return;
    }

    const now = moment();
    if (reminderTime.isBefore(now)) {
        await msg.reply('Waktu pengingat harus di masa depan.');
        return;
    }

    const delay = reminderTime.diff(now);

    setTimeout(async () => {
        await msg.reply(`Pengingat: ${message}`);
    }, delay);

    await msg.reply(`Pengingat diatur untuk ${reminderTime.format('DD-MM-YYYY HH:mm')}: ${message}`);
};

// Event listeners
client.on('qr', handleQR);
client.on('ready', handleReady);
client.on('authenticated', handleAuthenticated);
client.on('auth_failure', handleAuthFailure);
client.on('message', handleMessage);

// Initialize the client
client.initialize();