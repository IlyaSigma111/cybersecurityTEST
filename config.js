// ========================================
// КОНФИГУРАЦИЯ SUPABASE
// ========================================

const SUPABASE_URL = 'https://gluqnmznmjvlyguzkdrn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_OUdy33oOIQlOce88IXAP9w_G74CkWr_';

// Создаём клиент Supabase
const supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('✅ Supabase инициализирован');
