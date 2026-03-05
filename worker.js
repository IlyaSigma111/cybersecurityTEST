// ============================================
// worker.js - ПОЛНОСТЬЮ РАБОЧАЯ ВЕРСИЯ
// ============================================

// Вопросы по кибербезопасности (5 вопросов для теста)
const QUIZ_DATA = {
  questions: [
    // ВОПРОС 1
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
      explanation: "Фишинг — вид интернет-мошенничества, целью которого является получение доступа к конфиденциальным данным пользователей.",
      points: 1,
      difficulty: "easy"
    },
    // ВОПРОС 2
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
      explanation: "qwerty123 — словарный пароль, взламывается за секунды.",
      points: 1,
      difficulty: "easy"
    },
    // ВОПРОС 3
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
      explanation: "2FA (Two-Factor Authentication) — двухфакторная аутентификация, второй уровень защиты.",
      points: 1,
      difficulty: "easy"
    },
    // ВОПРОС 4
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
      explanation: "VPN (Virtual Private Network) — виртуальная частная сеть, шифрует трафик и скрывает IP.",
      points: 1,
      difficulty: "easy"
    },
    // ВОПРОС 5
    {
      id: 5,
      text: "Какой сайт помогает проверить, не взломали ли ваш email?",
      options: [
        "google.com",
        "haveibeenpwned.com",
        "yandex.ru",
        "github.com"
      ],
      correct: 1,
      explanation: "Have I Been Pwned проверяет, не было ли ваших данных в утечках.",
      points: 1,
      difficulty: "easy"
    }
  ]
};

// ============================================
// DURABLE OBJECT для комнат
// ============================================
export class QuizRoom {
  constructor(state, env) {
    this.state = state;
    this.roomId = state.id.toString();
    this.players = new Map();
    this.currentQuestion = null;
  }

  async fetch(request) {
    const url = new URL(request.url);
    
    if (url.pathname === '/ws') {
      return this.handleWebSocket(request);
    }
    
    return new Response('Not found', { status: 404 });
  }

  async handleWebSocket(request) {
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected websocket', { status: 426 });
    }

    const { searchParams } = new URL(request.url);
    const playerName = searchParams.get('name');
    
    if (!playerName) {
      return new Response('Player name required', { status: 400 });
    }

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    server.accept();
    
    this.players.set(playerName, server);

    server.addEventListener('message', async (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'answer') {
          server.send(JSON.stringify({
            type: 'answer_result',
            isCorrect: true,
            score: 100
          }));
        }
      } catch (e) {
        console.error('Error:', e);
      }
    });

    server.addEventListener('close', () => {
      this.players.delete(playerName);
    });

    return new Response(null, { status: 101, webSocket: client });
  }
}

// ============================================
// ОСНОВНОЙ WORKER
// ============================================
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS заголовки
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // ========== API: ПОЛУЧИТЬ ВОПРОСЫ ==========
      if (path === '/api/questions') {
        console.log('✅ API /api/questions вызван');
        return new Response(JSON.stringify(QUIZ_DATA.questions), {
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          }
        });
      }

      // ========== API: СОЗДАТЬ ИГРУ ==========
      if (path === '/api/games' && request.method === 'POST') {
        const code = Math.floor(10000000 + Math.random() * 90000000).toString();
        const gameId = 'game_' + code;
        
        return new Response(JSON.stringify({
          success: true,
          gameId,
          code
        }), { 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        });
      }

      // ========== СТАТИЧЕСКИЕ ФАЙЛЫ ==========
      if (path === '/' || path === '/index.html') {
        return new Response(INDEX_HTML, {
          headers: { 'Content-Type': 'text/html;charset=UTF-8' }
        });
      }
      
      if (path === '/teacher.html') {
        return new Response(TEACHER_HTML, {
          headers: { 'Content-Type': 'text/html;charset=UTF-8' }
        });
      }
      
      if (path === '/student.html') {
        return new Response(STUDENT_HTML, {
          headers: { 'Content-Type': 'text/html;charset=UTF-8' }
        });
      }

      return new Response('Not found: ' + path, { 
        status: 404,
        headers: corsHeaders 
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      });
    }
  }
};

// ============================================
// INDEX.HTML
// ============================================
const INDEX_HTML = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>КИБЕР КАХУТ - Викторина по безопасности</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Share Tech Mono', monospace;
            background: #0a0a0a;
            color: white;
            min-height: 100vh;
            position: relative;
            overflow-x: hidden;
        }
        
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
                radial-gradient(circle at 20% 30%, rgba(0, 255, 0, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 80% 70%, rgba(0, 255, 255, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 40% 50%, rgba(255, 0, 255, 0.05) 0%, transparent 50%);
            z-index: -1;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 30px;
            position: relative;
            z-index: 1;
        }
        
        .home-header {
            text-align: center;
            padding: 80px 30px;
            margin-bottom: 60px;
            position: relative;
        }
        
        .logo {
            font-size: 120px;
            margin-bottom: 30px;
            display: inline-block;
            animation: float 6s ease-in-out infinite;
            filter: drop-shadow(0 0 30px #0f0);
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0); filter: drop-shadow(0 0 30px #0f0); }
            50% { transform: translateY(-20px); filter: drop-shadow(0 0 50px #0f0); }
        }
        
        h1 {
            font-size: 4.5rem;
            font-weight: 900;
            background: linear-gradient(135deg, #0f0, #00ff88);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 20px;
            letter-spacing: 2px;
            text-shadow: 0 0 30px rgba(0, 255, 0, 0.3);
        }
        
        .subtitle {
            font-size: 1.4rem;
            color: #0f0;
            max-width: 800px;
            margin: 0 auto 40px;
            line-height: 1.6;
            background: rgba(0, 255, 0, 0.05);
            backdrop-filter: blur(10px);
            padding: 20px 30px;
            border-radius: 20px;
            border: 1px solid #0f0;
            box-shadow: 0 0 30px rgba(0, 255, 0, 0.2);
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 30px;
            margin: 70px 0;
        }
        
        .stat-item {
            background: rgba(0, 255, 0, 0.05);
            backdrop-filter: blur(20px);
            border: 1px solid #0f0;
            border-radius: 24px;
            padding: 40px 30px;
            text-align: center;
            transition: all 0.4s;
        }
        
        .stat-item:hover {
            transform: translateY(-10px);
            box-shadow: 0 0 50px rgba(0, 255, 0, 0.3);
        }
        
        .stat-icon {
            font-size: 60px;
            margin-bottom: 25px;
            color: #0f0;
            filter: drop-shadow(0 0 20px #0f0);
        }
        
        .stat-item h4 {
            font-size: 1.5rem;
            margin-bottom: 15px;
            color: #0f0;
        }
        
        .role-selection {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 40px;
            margin: 80px 0;
        }
        
        .role-card {
            background: rgba(0, 255, 0, 0.05);
            backdrop-filter: blur(20px);
            border-radius: 32px;
            padding: 60px 40px;
            text-align: center;
            border: 2px solid #0f0;
            transition: all 0.5s;
            box-shadow: 0 0 30px rgba(0, 255, 0, 0.2);
        }
        
        .role-card:hover {
            transform: translateY(-15px);
            box-shadow: 0 0 80px rgba(0, 255, 0, 0.4);
        }
        
        .role-icon {
            font-size: 90px;
            margin-bottom: 35px;
            color: #0f0;
            filter: drop-shadow(0 0 30px #0f0);
            animation: pulse 3s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        
        .role-card h3 {
            font-size: 2.2rem;
            margin-bottom: 25px;
            color: #0f0;
            text-shadow: 0 0 20px #0f0;
        }
        
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            padding: 22px 45px;
            font-size: 1.2rem;
            font-weight: 700;
            border: none;
            border-radius: 16px;
            cursor: pointer;
            transition: all 0.3s;
            text-decoration: none;
            width: 100%;
            background: rgba(0, 255, 0, 0.1);
            border: 2px solid #0f0;
            color: #0f0;
            font-family: 'Share Tech Mono', monospace;
        }
        
        .btn:hover {
            transform: translateY(-5px);
            box-shadow: 0 0 50px #0f0;
            background: rgba(0, 255, 0, 0.2);
        }
        
        .steps-container {
            background: rgba(0, 255, 0, 0.05);
            backdrop-filter: blur(20px);
            border-radius: 32px;
            padding: 60px 50px;
            margin: 80px 0;
            border: 1px solid #0f0;
            box-shadow: 0 0 50px rgba(0, 255, 0, 0.2);
        }
        
        .steps {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 35px;
            margin-top: 50px;
        }
        
        .step {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 24px;
            padding: 35px;
            border-left: 4px solid #0f0;
            transition: all 0.4s;
        }
        
        .step:hover {
            transform: translateY(-10px);
            box-shadow: 0 0 40px rgba(0, 255, 0, 0.3);
        }
        
        .step-number {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 60px;
            height: 60px;
            background: #0f0;
            color: black;
            border-radius: 50%;
            font-weight: 900;
            font-size: 1.8rem;
            margin-bottom: 25px;
            box-shadow: 0 0 30px #0f0;
        }
        
        .home-footer {
            text-align: center;
            padding: 60px 20px;
            margin-top: 100px;
            border-top: 1px solid #0f0;
            color: #0f0;
            background: rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(20px);
            border-radius: 40px 40px 0 0;
        }
        
        .tech-stack {
            display: flex;
            justify-content: center;
            gap: 25px;
            margin: 30px 0;
            flex-wrap: wrap;
        }
        
        .tech-item {
            background: rgba(0, 255, 0, 0.1);
            padding: 12px 24px;
            border-radius: 20px;
            border: 1px solid #0f0;
            color: #0f0;
        }
        
        .moderator-link {
            color: #ff00ff;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 12px;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            background: rgba(255, 0, 255, 0.1);
            border: 1px solid #ff00ff;
            margin-top: 20px;
        }
        
        .moderator-link:hover {
            background: rgba(255, 0, 255, 0.2);
            box-shadow: 0 0 30px #ff00ff;
        }
        
        @media (max-width: 1024px) {
            h1 { font-size: 3.5rem; }
            .role-selection { grid-template-columns: 1fr; }
        }
        
        @media (max-width: 768px) {
            h1 { font-size: 2.8rem; }
            .logo { font-size: 80px; }
            .steps { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="home-header">
            <div class="logo">🛡️</div>
            <h1>КИБЕР КАХУТ</h1>
            <p class="subtitle">Интерактивная викторина по кибербезопасности. 5 вопросов для тестирования.</p>
        </header>

        <div class="stats-grid">
            <div class="stat-item"><div class="stat-icon">🔒</div><h4>5 вопросов</h4><p>Для тестирования</p></div>
            <div class="stat-item"><div class="stat-icon">✨</div><h4>Хакерский стиль</h4><p>Glassmorphism + неон</p></div>
            <div class="stat-item"><div class="stat-icon">📱</div><h4>Адаптивный</h4><p>Телефоны, планшеты, ПК</p></div>
            <div class="stat-item"><div class="stat-icon">👥</div><h4>Мультиплеер</h4><p>Неограниченно игроков</p></div>
        </div>

        <div class="role-selection">
            <div class="role-card">
                <div class="role-icon">👨‍🏫</div>
                <h3>ПРЕПОДАВАТЕЛЬ</h3>
                <p style="margin-bottom: 35px; color: #0f0;">Запускайте викторину в классе, показывайте вопросы на экране, управляйте процессом.</p>
                <a href="/teacher.html" class="btn"><i class="fas fa-user-shield"></i> ПАНЕЛЬ УПРАВЛЕНИЯ</a>
            </div>
            <div class="role-card">
                <div class="role-icon">🧑‍🎓</div>
                <h3>УЧЕНИК</h3>
                <p style="margin-bottom: 35px; color: #0f0;">Подключайтесь с телефона или компьютера, отвечайте на вопросы, соревнуйтесь.</p>
                <a href="/student.html" class="btn"><i class="fas fa-mobile-alt"></i> ПОДКЛЮЧИТЬСЯ</a>
            </div>
        </div>

        <div class="steps-container">
            <h2 style="text-align: center; margin-bottom: 40px; color: #0f0; font-size: 2.5rem;">
                <i class="fas fa-terminal"></i> КАК ЭТО РАБОТАЕТ
            </h2>
            <div class="steps">
                <div class="step"><div class="step-number">1</div><p><strong style="color: #0f0;">Преподаватель</strong> создаёт игру и получает код</p></div>
                <div class="step"><div class="step-number">2</div><p><strong style="color: #0f0;">Ученики</strong> подключаются по коду</p></div>
                <div class="step"><div class="step-number">3</div><p><strong style="color: #0f0;">Вопросы</strong> показываются на экране</p></div>
                <div class="step"><div class="step-number">4</div><p><strong style="color: #0f0;">Статистика</strong> в реальном времени</p></div>
            </div>
        </div>

        <footer class="home-footer">
            <p style="font-size: 1.2rem; margin-bottom: 20px;">Викторина по кибербезопасности: 5 вопросов</p>
            <div class="tech-stack">
                <span class="tech-item"><i class="fas fa-cloud"></i> Cloudflare</span>
                <span class="tech-item"><i class="fab fa-html5"></i> HTML5</span>
                <span class="tech-item"><i class="fab fa-js"></i> JavaScript</span>
                <span class="tech-item"><i class="fas fa-shield-alt"></i> Glassmorphism</span>
            </div>
            <p style="margin-top: 30px;">© 2026 Кибер Кахут</p>
        </footer>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            console.log("🚀 Кибер Кахут загружен");
        });
    </script>
</body>
</html>`;

// ============================================
// TEACHER.HTML (ИСПРАВЛЕННЫЙ)
// ============================================
const TEACHER_HTML = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Преподаватель - Кибер Кахут</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Share Tech Mono', monospace;
            background: #0a0a0a;
            color: #0f0;
            min-height: 100vh;
            overflow: hidden;
        }
        
        #mainInterface {
            display: flex;
            flex-direction: column;
            height: 100vh;
            width: 100vw;
        }
        
        .teacher-header {
            background: rgba(0, 255, 0, 0.05);
            backdrop-filter: blur(20px);
            padding: 15px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #0f0;
            flex-shrink: 0;
        }
        
        .header-left h1 {
            margin: 0;
            font-size: 1.5rem;
            color: #0f0;
            text-shadow: 0 0 10px #0f0;
        }
        
        .game-code-box {
            background: rgba(0,0,0,0.5);
            border: 1px solid #0f0;
            border-radius: 12px;
            padding: 10px 20px;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .code-display {
            font-family: monospace;
            font-size: 1.8rem;
            font-weight: 900;
            color: #0f0;
            letter-spacing: 2px;
            min-width: 150px;
            text-align: center;
        }
        
        .glass-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 10px 20px;
            font-size: 0.9rem;
            border: 2px solid #0f0;
            border-radius: 10px;
            cursor: pointer;
            background: rgba(0,255,0,0.1);
            color: #0f0;
            font-family: 'Share Tech Mono', monospace;
            text-decoration: none;
            transition: all 0.3s;
        }
        
        .glass-btn:hover {
            background: rgba(0,255,0,0.2);
            box-shadow: 0 0 20px #0f0;
            transform: translateY(-2px);
        }
        
        .glass-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        
        .main-content {
            display: flex;
            flex: 1;
            padding: 20px;
            gap: 20px;
            overflow: hidden;
            min-height: 0;
        }
        
        .left-column {
            width: 35%;
            display: flex;
            flex-direction: column;
            gap: 20px;
            overflow: hidden;
        }
        
        .right-column {
            width: 65%;
            display: flex;
            flex-direction: column;
            gap: 20px;
            overflow: hidden;
        }
        
        .glass-panel {
            background: rgba(0, 255, 0, 0.05);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            padding: 20px;
            border: 1px solid #0f0;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        .glass-panel h2 {
            color: #0f0;
            margin-bottom: 15px;
            font-size: 1.3rem;
            display: flex;
            align-items: center;
            gap: 10px;
            flex-shrink: 0;
        }
        
        .control-buttons {
            display: grid;
            grid-template-columns: 1fr;
            gap: 10px;
        }
        
        .control-buttons .glass-btn {
            padding: 15px;
            font-size: 1rem;
            justify-content: flex-start;
        }
        
        .info-block {
            background: rgba(0,0,0,0.3);
            border: 1px solid #0f0;
            border-radius: 12px;
            padding: 15px;
            margin-top: 15px;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
        }
        
        .info-row:last-child {
            margin-bottom: 0;
        }
        
        .info-label {
            color: rgba(0,255,0,0.7);
        }
        
        .info-value {
            color: #0f0;
            font-weight: 700;
            font-size: 1.2rem;
        }
        
        .players-container {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            padding-right: 5px;
            min-height: 0;
        }
        
        .players-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: 12px;
        }
        
        .player-card {
            background: rgba(0, 0, 0, 0.5);
            border: 2px solid #0f0;
            border-radius: 16px;
            padding: 15px;
            text-align: center;
            transition: all 0.3s;
        }
        
        .player-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 0 20px rgba(0,255,0,0.3);
        }
        
        .player-avatar {
            width: 50px;
            height: 50px;
            background: #0f0;
            color: black;
            border-radius: 50%;
            margin: 0 auto 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            font-weight: 900;
        }
        
        .player-name {
            font-size: 1rem;
            font-weight: 700;
            margin-bottom: 5px;
            word-break: break-word;
        }
        
        .player-score {
            color: #0f0;
            font-size: 0.9rem;
        }
        
        .questions-container {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            padding-right: 5px;
            min-height: 0;
        }
        
        .questions-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 10px;
        }
        
        .question-item {
            background: rgba(0,0,0,0.3);
            border: 2px solid #0f0;
            border-radius: 12px;
            padding: 12px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .question-item:hover {
            transform: scale(1.05);
            box-shadow: 0 0 20px rgba(0,255,0,0.3);
        }
        
        .question-item.active { 
            border-color: #ff00ff; 
            box-shadow: 0 0 20px #ff00ff;
            background: rgba(255,0,255,0.1);
        }
        
        .question-item.completed { 
            border-color: #00ffff;
            opacity: 0.7;
        }
        
        .question-number {
            font-size: 1.3rem;
            margin-bottom: 5px;
        }
        
        .question-difficulty {
            font-size: 0.7rem;
            margin-bottom: 5px;
        }
        
        .question-status {
            font-size: 0.9rem;
        }
        
        .empty-state {
            text-align: center;
            padding: 30px 20px;
            color: rgba(0,255,0,0.5);
        }
        
        .empty-icon {
            font-size: 50px;
            margin-bottom: 15px;
        }
        
        #presentationMode {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: #0a0a0a;
            z-index: 1000;
            display: none;
            flex-direction: column;
        }
        
        #presentationMode.active { 
            display: flex;
            animation: fadeIn 0.3s;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .presentation-header {
            background: rgba(0,255,0,0.1);
            backdrop-filter: blur(20px);
            padding: 15px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #0f0;
        }
        
        .presentation-info {
            display: flex;
            align-items: center;
            gap: 20px;
        }
        
        .answers-stats {
            display: flex;
            gap: 15px;
        }
        
        .answer-stat-box {
            background: rgba(0,0,0,0.5);
            border: 1px solid #0f0;
            border-radius: 10px;
            padding: 8px 15px;
            text-align: center;
            min-width: 90px;
        }
        
        .answer-stat-box .label {
            font-size: 0.7rem;
            color: rgba(0,255,0,0.7);
        }
        
        .answer-stat-box .value {
            font-size: 1.3rem;
            font-weight: 900;
            color: #0f0;
        }
        
        .presentation-content {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 30px;
            overflow-y: auto;
        }
        
        .presentation-question {
            max-width: 900px;
            width: 100%;
            background: rgba(0,0,0,0.7);
            border: 2px solid #0f0;
            border-radius: 30px;
            padding: 40px;
            box-shadow: 0 0 80px rgba(0,255,0,0.3);
        }
        
        .presentation-question h2 {
            color: white;
            font-size: 2.2rem;
            text-align: center;
            line-height: 1.4;
            margin-bottom: 30px;
        }
        
        .presentation-controls {
            padding: 15px;
            text-align: center;
            border-top: 1px solid #0f0;
        }
        
        .presentation-controls .glass-btn {
            display: inline-flex;
            width: auto;
            padding: 12px 30px;
            margin: 0 8px;
        }
        
        .answer-block {
            margin-top: 30px;
            padding: 25px;
            background: rgba(0,255,0,0.1);
            border: 1px solid #0f0;
            border-radius: 16px;
            animation: slideUp 0.5s;
        }
        
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .correct-answer {
            color: #0f0;
            font-size: 1.8rem;
            margin: 15px 0;
            text-align: center;
        }
        
        .explanation {
            color: rgba(255,255,255,0.8);
            font-size: 1rem;
            line-height: 1.5;
        }
        
        ::-webkit-scrollbar {
            width: 6px;
        }
        
        ::-webkit-scrollbar-track {
            background: rgba(0, 255, 0, 0.05);
        }
        
        ::-webkit-scrollbar-thumb {
            background: #0f0;
            border-radius: 3px;
        }
        
        @media (max-width: 1200px) {
            .main-content {
                flex-direction: column;
            }
            .left-column, .right-column {
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <div id="mainInterface">
        <header class="teacher-header">
            <div class="header-left">
                <h1>👨‍🏫 ПАНЕЛЬ ПРЕПОДАВАТЕЛЯ</h1>
            </div>
            <div class="game-code-box">
                <span>КОД:</span>
                <div id="gameCode" class="code-display">----</div>
                <a href="/" class="glass-btn">
                    <i class="fas fa-home"></i> Главная
                </a>
            </div>
        </header>

        <div class="main-content">
            <div class="left-column">
                <div class="glass-panel">
                    <h2><i class="fas fa-gamepad"></i> УПРАВЛЕНИЕ</h2>
                    
                    <div id="startSection">
                        <button onclick="startNewGame()" class="glass-btn control-buttons">
                            <i class="fas fa-plus-circle"></i> СОЗДАТЬ ВИКТОРИНУ
                        </button>
                    </div>

                    <div id="gameControls" style="display: none;">
                        <div class="control-buttons">
                            <button onclick="startNextQuestion()" id="startQuestionBtn" class="glass-btn">
                                <i class="fas fa-play"></i> ПОКАЗАТЬ ВОПРОС
                            </button>
                            <button onclick="showAnswer()" id="showAnswerBtn" class="glass-btn" disabled>
                                <i class="fas fa-check-circle"></i> ПОКАЗАТЬ ОТВЕТ
                            </button>
                            <button onclick="nextQuestion()" id="nextQuestionBtn" class="glass-btn" disabled>
                                <i class="fas fa-forward"></i> СЛЕДУЮЩИЙ ВОПРОС
                            </button>
                            <button onclick="resetGame()" class="glass-btn">
                                <i class="fas fa-redo"></i> СБРОСИТЬ
                            </button>
                        </div>
                        
                        <div class="info-block">
                            <div class="info-row">
                                <span class="info-label">Текущий вопрос:</span>
                                <span class="info-value" id="currentQ">0/5</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Игроков онлайн:</span>
                                <span class="info-value" id="playerCount">0</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="glass-panel" style="flex: 1;">
                    <h2><i class="fas fa-users"></i> УЧАСТНИКИ <span id="playersCount" style="color:#0f0; margin-left:auto;">0</span></h2>
                    <div class="players-container" id="playersContainer">
                        <div id="playersList" class="players-list">
                            <div class="empty-state">
                                <div class="empty-icon">👤</div>
                                <p>Ожидание игроков...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="right-column">
                <div class="glass-panel" style="flex: 1;">
                    <h2><i class="fas fa-list-ol"></i> ВОПРОСЫ (5)</h2>
                    <div class="questions-container">
                        <div id="questionsList" class="questions-list">
                            <div class="empty-state">
                                <div class="empty-icon">📚</div>
                                <p>Загрузка вопросов...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div id="presentationMode">
        <div class="presentation-header">
            <div class="presentation-info">
                <span style="font-size: 1.1rem; color: #0f0;">🎯 РЕЖИМ ПРЕЗЕНТАЦИИ</span>
                <span style="font-size: 1rem;">Вопрос <span id="presentationQNum">1</span>/5</span>
            </div>
            
            <div class="answers-stats">
                <div class="answer-stat-box">
                    <div class="label">Ответили</div>
                    <div class="value" id="answeredCount">0</div>
                </div>
                <div class="answer-stat-box">
                    <div class="label">Правильно</div>
                    <div class="value" id="correctCount">0</div>
                </div>
            </div>
        </div>

        <div class="presentation-content">
            <div id="presentationQuestion" class="presentation-question">
                <h2>Вопрос появится здесь</h2>
            </div>
        </div>

        <div class="presentation-controls">
            <button onclick="exitPresentation()" class="glass-btn">
                <i class="fas fa-times"></i> ВЕРНУТЬСЯ
            </button>
            <button onclick="showAnswer()" class="glass-btn">
                <i class="fas fa-check-circle"></i> ПОКАЗАТЬ ОТВЕТ
            </button>
        </div>
    </div>

    <script>
        // Конфигурация
        const API_BASE = window.location.origin;
        
        // Глобальные переменные
        let currentGameId = null;
        let currentQuestionIndex = 0;
        let questions = [];
        
        // Элементы DOM
        const startSection = document.getElementById('startSection');
        const gameControls = document.getElementById('gameControls');
        const gameCodeDisplay = document.getElementById('gameCode');
        const playersList = document.getElementById('playersList');
        const playerCount = document.getElementById('playerCount');
        const playersCount = document.getElementById('playersCount');
        const questionsList = document.getElementById('questionsList');
        const currentQ = document.getElementById('currentQ');
        const presentationMode = document.getElementById('presentationMode');
        const presentationQNum = document.getElementById('presentationQNum');
        const presentationQuestion = document.getElementById('presentationQuestion');
        const answeredCount = document.getElementById('answeredCount');
        const correctCount = document.getElementById('correctCount');
        const startQuestionBtn = document.getElementById('startQuestionBtn');
        const showAnswerBtn = document.getElementById('showAnswerBtn');
        const nextQuestionBtn = document.getElementById('nextQuestionBtn');

        // Загружаем вопросы с сервера (ВЫЗЫВАЕТСЯ АВТОМАТИЧЕСКИ ПРИ ЗАГРУЗКЕ)
        async function loadQuestions() {
            try {
                console.log('📥 Загружаем вопросы с /api/questions...');
                const response = await fetch('/api/questions');
                
                if (!response.ok) {
                    throw new Error('Сервер вернул ошибку ' + response.status);
                }
                
                questions = await response.json();
                console.log('✅ Загружено вопросов:', questions.length);
                
                if (questions.length === 0) {
                    throw new Error('Нет вопросов');
                }
                
                // Обновляем интерфейс
                updateQuestionsList();
                currentQ.textContent = '0/' + questions.length;
                
            } catch (error) {
                console.error('❌ Ошибка загрузки вопросов:', error);
                questionsList.innerHTML = \`
                    <div class="empty-state">
                        <div class="empty-icon">⚠️</div>
                        <p>Ошибка загрузки: \${error.message}</p>
                        <button onclick="loadQuestions()" class="glass-btn" style="margin-top: 15px;">Повторить</button>
                    </div>
                \`;
            }
        }

        // Создать новую игру
        window.startNewGame = async function() {
            console.log('🎮 Создание новой игры...');
            
            try {
                const response = await fetch('/api/games', {
                    method: 'POST'
                });
                
                const data = await response.json();
                
                if (!data.success) {
                    throw new Error('Ошибка создания игры');
                }
                
                currentGameId = data.gameId;
                currentQuestionIndex = 0;
                
                startSection.style.display = 'none';
                gameControls.style.display = 'block';
                gameCodeDisplay.textContent = data.code;
                
                alert(\`✅ Викторина создана!\\nКод: \${data.code}\`);
                
            } catch (error) {
                console.error('❌ Ошибка:', error);
                alert("Ошибка создания: " + error.message);
            }
        };

        // Показать следующий вопрос
        window.startNextQuestion = function() {
            if (!questions || questions.length === 0) {
                alert("Вопросы еще не загрузились");
                return;
            }
            
            if (currentQuestionIndex >= questions.length) {
                alert("🎉 Все вопросы пройдены!");
                return;
            }
            
            const question = questions[currentQuestionIndex];
            
            // Показываем вопрос в режиме презентации
            presentationQuestion.innerHTML = \`<h2>\${question.text}</h2>\`;
            
            // Удаляем старые блоки ответов
            const oldAnswers = presentationQuestion.querySelectorAll('.answer-block');
            oldAnswers.forEach(el => el.remove());
            
            presentationMode.classList.add('active');
            presentationQNum.textContent = (currentQuestionIndex + 1) + '/' + questions.length;
            
            // Обновляем индекс
            currentQuestionIndex++;
            currentQ.textContent = currentQuestionIndex + '/' + questions.length;
            updateQuestionsList();
            
            // Активируем кнопки
            showAnswerBtn.disabled = false;
            nextQuestionBtn.disabled = true;
        };

        // Показать правильный ответ
        window.showAnswer = function() {
            const q = questions[currentQuestionIndex - 1];
            if (!q) return;
            
            const correctAnswer = q.options[q.correct];
            
            // Удаляем старый блок ответа
            const oldAnswer = presentationQuestion.querySelector('.answer-block');
            if (oldAnswer) oldAnswer.remove();
            
            // Создаём новый блок
            const answerBlock = document.createElement('div');
            answerBlock.className = 'answer-block';
            answerBlock.innerHTML = \`
                <h3 style="color: #0f0; margin-bottom: 15px;">✅ ПРАВИЛЬНЫЙ ОТВЕТ:</h3>
                <div class="correct-answer">\${correctAnswer}</div>
                <div class="explanation">\${q.explanation || ''}</div>
            \`;
            
            presentationQuestion.appendChild(answerBlock);
            
            // Обновляем кнопки
            showAnswerBtn.disabled = true;
            nextQuestionBtn.disabled = false;
        };

        // Следующий вопрос
        window.nextQuestion = function() {
            presentationMode.classList.remove('active');
            
            // Если есть еще вопросы, можно начинать следующий
            if (currentQuestionIndex < questions.length) {
                startQuestionBtn.disabled = false;
            }
        };

        // Выйти из режима презентации
        window.exitPresentation = function() {
            presentationMode.classList.remove('active');
        };

        // Сбросить игру
        window.resetGame = function() {
            if (confirm("Сбросить викторину и начать заново?")) {
                currentGameId = null;
                currentQuestionIndex = 0;
                questions = [];
                
                startSection.style.display = 'block';
                gameControls.style.display = 'none';
                gameCodeDisplay.textContent = '----';
                playerCount.textContent = '0';
                playersCount.textContent = '0';
                currentQ.textContent = '0/5';
                
                playersList.innerHTML = '<div class="empty-state"><div class="empty-icon">👤</div><p>Ожидание игроков...</p></div>';
                updateQuestionsList();
                exitPresentation();
                
                // Загружаем вопросы заново
                loadQuestions();
            }
        };

        // Обновить список вопросов в интерфейсе
        function updateQuestionsList() {
            if (!questions || questions.length === 0) {
                questionsList.innerHTML = '<div class="empty-state"><div class="empty-icon">📚</div><p>Загрузка вопросов...</p></div>';
                return;
            }
            
            questionsList.innerHTML = questions.map((q, i) => {
                const isCurrent = i === currentQuestionIndex - 1;
                const isCompleted = i < currentQuestionIndex - 1;
                
                let statusClass = '';
                if (isCurrent) statusClass = 'active';
                else if (isCompleted) statusClass = 'completed';
                
                let difficultyColor = q.difficulty === 'easy' ? '#0f0' : q.difficulty === 'medium' ? 'yellow' : 'red';
                let difficultyText = q.difficulty === 'easy' ? 'ЛЁГКИЙ' : q.difficulty === 'medium' ? 'СРЕДНИЙ' : 'СЛОЖНЫЙ';
                
                return \`
                    <div class="question-item \${statusClass}" onclick="jumpToQuestion(\${i})">
                        <div class="question-number">\${i + 1}</div>
                        <div class="question-difficulty" style="color: \${difficultyColor};">\${difficultyText}</div>
                        <div class="question-status">
                            \${isCurrent ? '🔴' : isCompleted ? '✅' : '⏳'}
                        </div>
                    </div>
                \`;
            }).join('');
        }

        // Перейти к конкретному вопросу
        window.jumpToQuestion = function(index) {
            if (!currentGameId) {
                alert("Сначала создайте викторину!");
                return;
            }
            currentQuestionIndex = index;
            startNextQuestion();
        };

        // Загружаем вопросы сразу при открытии страницы
        document.addEventListener('DOMContentLoaded', function() {
            console.log("✅ Teacher panel загружен, начинаем загрузку вопросов...");
            loadQuestions();
        });
    </script>
</body>
</html>`;

// ============================================
// STUDENT.HTML
// ============================================
const STUDENT_HTML = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ученик - Кибер Кахут</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Share Tech Mono', monospace;
            background: #0a0a0a;
            color: #0f0;
            min-height: 100vh;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .container {
            width: 100%;
            max-width: 500px;
            background: rgba(0, 255, 0, 0.05);
            backdrop-filter: blur(20px);
            border: 2px solid #0f0;
            border-radius: 30px;
            padding: 30px;
            box-shadow: 0 0 50px rgba(0, 255, 0, 0.2);
        }
        
        .screen { display: none; }
        .screen.active { display: block; }
        
        h1 { 
            font-size: 2rem; 
            text-align: center; 
            margin-bottom: 30px;
            color: #0f0;
            text-shadow: 0 0 20px #0f0;
        }
        
        .logo { 
            font-size: 60px; 
            text-align: center; 
            margin-bottom: 20px;
            filter: drop-shadow(0 0 20px #0f0);
        }
        
        input {
            width: 100%;
            padding: 18px;
            background: rgba(0, 0, 0, 0.5);
            border: 2px solid #0f0;
            border-radius: 16px;
            color: #0f0;
            font-size: 1.2rem;
            font-family: 'Share Tech Mono', monospace;
            margin: 10px 0;
        }
        
        input:focus {
            outline: none;
            box-shadow: 0 0 30px #0f0;
        }
        
        .btn {
            width: 100%;
            padding: 18px;
            background: rgba(0, 255, 0, 0.1);
            border: 2px solid #0f0;
            border-radius: 16px;
            color: #0f0;
            font-size: 1.2rem;
            font-family: 'Share Tech Mono', monospace;
            cursor: pointer;
            margin: 10px 0;
            transition: all 0.3s;
        }
        
        .btn:hover {
            background: rgba(0, 255, 0, 0.2);
            box-shadow: 0 0 30px #0f0;
            transform: translateY(-2px);
        }
        
        .info-box {
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid #0f0;
            border-radius: 16px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .info-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid rgba(0, 255, 0, 0.2);
        }
        
        .info-item:last-child {
            border-bottom: none;
        }
        
        .question-header {
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid #0f0;
            border-radius: 16px;
            padding: 15px;
            margin-bottom: 25px;
            display: flex;
            justify-content: space-between;
        }
        
        .question-text {
            font-size: 1.5rem;
            margin: 30px 0;
            text-align: center;
            line-height: 1.5;
        }
        
        .options {
            display: flex;
            flex-direction: column;
            gap: 15px;
            margin: 30px 0;
        }
        
        .option {
            background: rgba(0, 0, 0, 0.5);
            border: 2px solid #0f0;
            border-radius: 16px;
            padding: 18px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 20px;
            transition: all 0.3s;
        }
        
        .option:hover {
            background: rgba(0, 255, 0, 0.1);
            box-shadow: 0 0 20px #0f0;
            transform: translateX(5px);
        }
        
        .option.selected {
            background: rgba(0, 255, 0, 0.2);
            border-color: #fff;
        }
        
        .option-letter {
            width: 40px;
            height: 40px;
            background: #0f0;
            color: black;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 1.2rem;
        }
        
        .status {
            text-align: center;
            padding: 20px;
            margin-top: 20px;
            border-radius: 16px;
            font-size: 1.2rem;
            font-weight: bold;
        }
        
        .status.correct { 
            background: rgba(0, 255, 0, 0.2);
            border: 1px solid #0f0;
            color: #0f0;
        }
        
        .status.wrong { 
            background: rgba(255, 0, 0, 0.2);
            border: 1px solid #ff4444;
            color: #ff4444;
        }
        
        .status.waiting {
            background: rgba(255, 255, 0, 0.1);
            border: 1px solid yellow;
            color: yellow;
        }
        
        .error {
            background: rgba(255, 0, 0, 0.2);
            border: 1px solid #ff0000;
            color: #ff0000;
            padding: 12px;
            border-radius: 12px;
            margin: 10px 0;
            text-align: center;
        }
        
        .loader {
            width: 50px;
            height: 50px;
            border: 3px solid rgba(0, 255, 0, 0.3);
            border-top: 3px solid #0f0;
            border-radius: 50%;
            margin: 20px auto;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 600px) {
            .container {
                padding: 20px;
            }
            
            h1 {
                font-size: 1.6rem;
            }
            
            .question-text {
                font-size: 1.2rem;
            }
            
            .option {
                padding: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div id="joinScreen" class="screen active">
            <div class="logo">🛡️</div>
            <h1>КИБЕР КАХУТ</h1>
            <div id="errorContainer"></div>
            <input type="text" id="playerName" placeholder="Твоё имя" maxlength="15">
            <input type="text" id="gameCode" placeholder="Код викторины" maxlength="8">
            <button id="joinButton" class="btn">🔌 ПОДКЛЮЧИТЬСЯ</button>
            <a href="/" class="btn" style="text-align: center;">← На главную</a>
        </div>

        <div id="waitingScreen" class="screen">
            <div class="logo">⏳</div>
            <h2 style="text-align: center;">ОЖИДАНИЕ...</h2>
            <div class="loader"></div>
            <div class="info-box">
                <div class="info-item"><span>Участник:</span> <strong id="displayName">-</strong></div>
                <div class="info-item"><span>Код:</span> <strong id="displayCode">-</strong></div>
                <div class="info-item"><span>Очки:</span> <strong id="displayScore">0</strong></div>
            </div>
            <button onclick="leaveGame()" class="btn">🚪 ВЫЙТИ</button>
        </div>

        <div id="questionScreen" class="screen">
            <div class="question-header">
                <span>КИБЕРБЕЗОПАСНОСТЬ</span>
                <span id="questionCounter">1/5</span>
            </div>
            <div class="question-text" id="questionText">Загрузка...</div>
            <div class="options" id="optionsContainer"></div>
            <div class="status waiting" id="answerStatus">⏳ Выбери ответ</div>
        </div>
    </div>

    <script>
        let currentGameId = null;
        let playerName = null;
        let currentQuestion = null;
        let hasAnswered = false;

        const joinScreen = document.getElementById('joinScreen');
        const waitingScreen = document.getElementById('waitingScreen');
        const questionScreen = document.getElementById('questionScreen');
        const joinButton = document.getElementById('joinButton');
        const errorContainer = document.getElementById('errorContainer');
        const playerNameInput = document.getElementById('playerName');
        const gameCodeInput = document.getElementById('gameCode');
        const displayName = document.getElementById('displayName');
        const displayCode = document.getElementById('displayCode');
        const displayScore = document.getElementById('displayScore');
        const questionText = document.getElementById('questionText');
        const optionsContainer = document.getElementById('optionsContainer');
        const answerStatus = document.getElementById('answerStatus');
        const questionCounter = document.getElementById('questionCounter');

        function showError(msg) {
            errorContainer.innerHTML = `<div class="error">${msg}</div>`;
            setTimeout(() => errorContainer.innerHTML = '', 3000);
        }

        function switchScreen(screen) {
            [joinScreen, waitingScreen, questionScreen].forEach(s => s.classList.remove('active'));
            document.getElementById(screen + 'Screen').classList.add('active');
        }

        window.joinGame = async function() {
            const name = playerNameInput.value.trim();
            const code = gameCodeInput.value.trim();
            
            if (!name || name.length < 2) return showError("Введите имя");
            if (!code || code.length !== 8) return showError("Введите 8 цифр кода");
            
            playerName = name;
            currentGameId = "game_" + code;
            
            try {
                const response = await fetch(\`/api/games/\${currentGameId}/players\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        name: playerName,
                        device: /Mobi|Android/i.test(navigator.userAgent) ? "📱 Телефон" : "💻 Компьютер"
                    })
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Ошибка подключения');
                }
                
                displayName.textContent = playerName;
                displayCode.textContent = code;
                switchScreen('waiting');
                
            } catch (error) {
                showError(error.message);
            }
        };

        window.leaveGame = function() {
            currentGameId = null;
            playerName = null;
            switchScreen('join');
            playerNameInput.value = '';
            gameCodeInput.value = '';
        };

        joinButton.addEventListener('click', joinGame);
    </script>
</body>
</html>`;
