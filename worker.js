// ============================================
// worker.js - МИНИМАЛЬНАЯ РАБОЧАЯ ВЕРСИЯ
// ============================================

// Вопросы (5 штук)
const questions = [
    {
        id: 1,
        text: "Что такое фишинг?",
        options: [
            "Вид рыбалки",
            "Метод кражи данных через поддельные сайты/письма",
            "Антивирусная программа",
            "Тип шифрования"
        ],
        correct: 1,
        explanation: "Фишинг — вид интернет-мошенничества.",
        points: 1,
        difficulty: "easy"
    },
    {
        id: 2,
        text: "Какой пароль считается самым ненадежным?",
        options: [
            "G7$k2!mN9",
            "Tr0ub4dor&3",
            "qwerty123",
            "P@ssw0rd!$"
        ],
        correct: 2,
        explanation: "qwerty123 — словарный пароль.",
        points: 1,
        difficulty: "easy"
    },
    {
        id: 3,
        text: "Что такое 2FA?",
        options: [
            "Второй аккаунт",
            "Двухфакторная аутентификация",
            "Файловая система",
            "Тип вируса"
        ],
        correct: 1,
        explanation: "2FA — двухфакторная аутентификация.",
        points: 1,
        difficulty: "easy"
    },
    {
        id: 4,
        text: "Что такое VPN?",
        options: [
            "Вирусная программа",
            "Виртуальная частная сеть",
            "Тип пароля",
            "Антивирус"
        ],
        correct: 1,
        explanation: "VPN — виртуальная частная сеть.",
        points: 1,
        difficulty: "easy"
    },
    {
        id: 5,
        text: "Какой сайт помогает проверить утечки данных?",
        options: [
            "google.com",
            "haveibeenpwned.com",
            "yandex.ru",
            "github.com"
        ],
        correct: 1,
        explanation: "Have I Been Pwned проверяет утечки.",
        points: 1,
        difficulty: "easy"
    }
];

// ============================================
// ОСНОВНОЙ WORKER
// ============================================
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;
        
        // CORS заголовки
        const headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        // OPTIONS запрос
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers });
        }

        // API: получить вопросы
        if (path === '/api/questions') {
            console.log('✅ API /api/questions вызван');
            return new Response(JSON.stringify(questions), {
                headers: { 
                    'Content-Type': 'application/json',
                    ...headers
                }
            });
        }

        // API: создать игру
        if (path === '/api/games' && request.method === 'POST') {
            const code = Math.floor(10000000 + Math.random() * 90000000).toString();
            return new Response(JSON.stringify({
                success: true,
                code: code,
                gameId: 'game_' + code
            }), { 
                headers: { 
                    'Content-Type': 'application/json',
                    ...headers
                } 
            });
        }

        // Главная страница
        if (path === '/' || path === '/index.html') {
            return new Response('Кибер Кахут API работает!', { 
                headers: { 'Content-Type': 'text/plain' } 
            });
        }

        // teacher.html перенаправляем на отдельный файл
        if (path === '/teacher.html') {
            return fetch('https://raw.githubusercontent.com/ilyasigma111/cybersecurityTEST/main/teacher.html');
        }

        return new Response('Not found: ' + path, { status: 404, headers });
    }
};
