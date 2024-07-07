require('dotenv').config();
const client = require('./client');
const { handleMessage } = require('./handlers');

client.on('message', handleMessage);
client.initialize();