const moment = require('moment');
const COMMANDS = require('../commands');
const { convertToSticker, getRandomKhodam, getTopMembers } = require('../helpers');
const client = require('../client');

const handleMenuCommand = async (msg) => {
    const menuMessage = `*Daftar Command:*
    1. *${COMMANDS.MENU}* - Menampilkan daftar command.
    2. *${COMMANDS.ALL}* - Tag semua anggota grup.
    3. *${COMMANDS.STICKER}* - Mengonversi gambar menjadi stiker.
    4. *${COMMANDS.KHODAM}* - Cek khodam untuk pengirim.
    5. *${COMMANDS.KHODAM} [nama]* - Cek khodam untuk nama yang disebut.
    6. *${COMMANDS.RANK}* - Menampilkan top anggota grup berdasarkan jumlah chat.
    7. *${COMMANDS.REMINDER}* - Mengatur pengingat. Format: !reminder [hari ini/besok/tanggal DD-MM-YYYY] [jam:menit] [pesan]`;

    await msg.reply(menuMessage);
};

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

module.exports = {
    handleAllCommand,
    handleStickerCommand,
    handleKhodamCommand,
    handleNamedKhodamCommand,
    handleRankCommand,
    handleMenuCommand,
    handleReminderCommand
};