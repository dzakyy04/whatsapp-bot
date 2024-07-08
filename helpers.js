const { db } = require('./firebase');
const {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    deleteDoc,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    increment
} = require('firebase/firestore');
const khodams = require('./khodams');

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

const addReminder = async (chatId, time, message) => {
    try {
        await addDoc(collection(db, 'reminders'), {
            chatId,
            time: time.toDate(),
            message
        });
    } catch (error) {
        console.error('Error adding reminder:', error);
    }
};

const getActiveReminders = async (chatId) => {
    const remindersRef = collection(db, 'reminders');
    const q = query(remindersRef, where('chatId', '==', chatId), where('time', '>', new Date()));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const removeReminder = async (reminderId) => {
    try {
        await deleteDoc(doc(db, 'reminders', reminderId));
    } catch (error) {
        console.error('Error removing reminder:', error);
    }
};

module.exports = {
    convertToSticker,
    getRandomKhodam,
    updateChatCount,
    getTopMembers,
    addReminder,
    getActiveReminders,
    removeReminder
};