// has to be fixxed. 

export const command = ['archall', 'archivia'];

export async function exec(conn, msg, { jid, sender, L }) {
    const senderNumber = sender.split('@')[0];
    
    const isOwner = Array.isArray(global.owners) && global.owners.includes(senderNumber);

    if (!isOwner) {
        return conn.sendMessage(jid, { text: L.only_owner }, { quoted: msg });
    }

    try {
        const chats = await conn.chats.all();
        for (let chat of chats) {
            await conn.chatModify({ archive: true }, chat.id);
        }
        await conn.sendMessage(jid, { text: L.archived }, { quoted: msg });
    } catch (e) {
        console.error(e);
        await conn.sendMessage(jid, { text: "⚠️ Error during archiving." }, { quoted: msg });
    }
}