const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth(),
    webVersion: '2.2412.54',
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
    },
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('authenticated', () => {
    console.log('Client authenticated!');
});

client.on('auth_failure', msg => {
    console.error('Authentication failure', msg);
});

client.on('message', async (msg) => {
    if (msg.body.toLocaleLowerCase() === '!all') {
        const chat = await msg.getChat();

        let mentions = [];

        for (let participant of chat.participants) {
            mentions.push(`${participant.id.user}@c.us`);
        }

        await chat.sendMessage('@all', { mentions });
    }
});
client.on('message', async (msg) => {
    // Convert to sticker
    const convertToSticker = async (mediaMsg) => {
        const media = await mediaMsg.downloadMedia();
        await msg.reply(media, msg.from, { sendMediaAsSticker: true });
    }

    if (msg.body.toLocaleLowerCase() === '!sticker') {
        // If message is reply
        if (msg.hasQuotedMsg) {
            const quotedMessage = await msg.getQuotedMessage();

            // If replied message is an image
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
    }
});

client.initialize();