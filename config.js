// ========================================
// КОНФИГУРАЦИЯ SUPABASE
// ========================================

// Создаем клиент через глобальный объект
const { createClient } = window.supabase;

const SUPABASE_URL = 'https://gluqnmznmjvlyguzkdrn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_OUdy33oOIQlOce88IXAP9w_G74CkWr_';

// СОЗДАЁМ КЛИЕНТ
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('✅ Supabase инициализирован');
