const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Function to convert media to sticker
const convertToSticker = async (msg) => {
    try {
        const media = await msg.downloadMedia();
        await msg.reply(media, msg.from, { sendMediaAsSticker: true });
    } catch (error) {
        console.error('Failed to convert to sticker:', error);
        await msg.reply('Gagal mengonversi ke stiker.');
    }
};

const client = new Client({
    authStrategy: new LocalAuth(),
    webVersion: '2.2412.54',
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
    },
});

// Event listener for QR code
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

// Event listener when client is ready
client.on('ready', () => {
    console.log('Client is ready!');
});

// Event listener when client is authenticated
client.on('authenticated', () => {
    console.log('Client authenticated!');
});

// Event listener if authentication fails
client.on('auth_failure', msg => {
    console.error('Authentication failure', msg);
});

// Event listener for incoming messages
client.on('message', async (msg) => {
    try {
        // Handling command !all (tag all members in group chat)
        if (msg.body.toLowerCase() === '!all') {
            const chat = await msg.getChat();
            let mentions = chat.participants.map(participant => `${participant.id.user}@c.us`);
            await chat.sendMessage('@all', { mentions });
        }

        // Handling command !sticker (convert image whatsapp to sticker)
        if (msg.body.toLowerCase() === '!sticker') {
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
        }
    } catch (error) {
        console.error('Error handling message:', error);
    }
});

// Initialize the client
client.initialize();
