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

client.initialize();