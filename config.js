import { fileURLToPath } from 'url';
import path from 'path';

global.owners = ['17789072704', '393445461546']; 
global.defaultLang = 'en'; 
global.prefix = "?";

// --- DEVICE GUESSER --- CREDITS TO VAREBOT --- 
global.devicegssr = (msgID) => {
    if (!msgID) return 'unknown';
    if (/^[a-zA-Z]+-[a-fA-F0-9]+$/.test(msgID)) return 'bot';
    if (msgID.startsWith('false_') || msgID.startsWith('true_')) return 'web';
    if (msgID.startsWith('3EB0') && /^[A-Z0-9]+$/.test(msgID)) return 'web';
    if (msgID.includes(':')) return 'desktop';
    if (/^[A-F0-9]{32}$/i.test(msgID)) return 'android';
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(msgID)) return 'ios';
    if (/^[A-Z0-9]{20,25}$/i.test(msgID) && !msgID.startsWith('3EB0')) return 'ios';
    return 'unknown';
};

export default global;