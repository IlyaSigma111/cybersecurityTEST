// ========================================
// КОНФИГУРАЦИЯ SUPABASE
// ========================================

const APP_SUPABASE_URL = 'https://gluqnmznmjvlyguzkdrn.supabase.co';
const APP_SUPABASE_KEY = 'sb_publishable_OUdy33oOIQlOce88IXAP9w_G74CkWr_';

// СОЗДАЁМ КЛИЕНТ С УНИКАЛЬНЫМ ИМЕНЕМ
const APP_SUPABASE = window.supabase.createClient(APP_SUPABASE_URL, APP_SUPABASE_KEY);

console.log('✅ APP_SUPABASE инициализирован');
