// ========================================
// КОНФИГУРАЦИЯ SUPABASE
// ========================================

const SB_URL = 'https://gluqnmznmjvlyguzkdrn.supabase.co';
const SB_KEY = 'sb_publishable_OUdy33oOIQlOce88IXAP9w_G74CkWr_';

// УНИКАЛЬНОЕ ИМЯ КЛИЕНТА
const SB = window.supabase.createClient(SB_URL, SB_KEY);

console.log('✅ Supabase клиент готов');
