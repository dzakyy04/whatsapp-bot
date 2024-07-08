# WhatsApp Bot

A simple WhatsApp bot using [`whatsapp-web.js`](https://wwebjs.dev/).

## Features

1. `!menu` - Display the list of available commands.
2. `!all` - Mention all group members.
3. `!sticker` - Convert an image to a sticker.
4. `!khodam` - Check a khodam for the sender.
5. `!khodam [name]` - Check a khodam for the mentioned name.
6. `!rank` - Display the ranking of members based on the number of messages sent.
7. `!reminder` - Set reminder. Format: !reminder [DD-MM-YYYY] [hour:minute] [message].
8. `listreminder` - Show list of active reminders.

## Requirements

-   Node.js (version 18 or higher)
-   A WhatsApp account
-   Firebase account (for data storage)

## Installation

1.  Clone this repository:

        git clone https://github.com/dzakyy04/whatsapp-bot.git
        cd whatsapp-bot

2.  Install the dependencies:

        npm install

3.  Copy the example env file and add your Firebase configuration in the `.env` file:

        cp .env.example .env

4.  Run the bot:

        npm start

5.  Scan the QR code displayed in the terminal using the WhatsApp application on your phone.
