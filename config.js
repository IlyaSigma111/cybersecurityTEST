// ========================================
// КОНФИГУРАЦИЯ SUPABASE
// ========================================

const SUPABASE_URL = 'https://gluqnmznmjvlyguzkdrn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_OUdy33oOIQlOce88IXAP9w_G74CkWr_';

// Создаём клиент с уникальным именем
const SUPABASE_CLIENT = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('✅ Supabase клиент создан');
