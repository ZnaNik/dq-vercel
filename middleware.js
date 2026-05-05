const USERS = {
  'эльвира': '4521',
  'алена': '7834',
  'таня': '3156',
  'даня': '9042',
  'илья': '6287',
  'маша': '5903',
  'никита': '8461',
  'кирилл': '2748',
  'максим': '6319',
  'слава': '4072',
  'test': '123',
};

const COOKIE_NAME = '__m2_auth';
const COOKIE_MAX_AGE = 2592000; // 30 days

function getCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}

function loginHTML(error = '') {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>DQ Case — Вход</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;min-height:100vh;display:flex;align-items:center;justify-content:center}
.card{background:#1e293b;border:1px solid #334155;border-radius:14px;padding:44px 40px;width:100%;max-width:380px;box-shadow:0 30px 60px rgba(0,0,0,0.6)}
h1{font-size:22px;color:#f1f5f9;text-align:center;margin-bottom:6px;font-weight:700}
.sub{font-size:13px;color:#64748b;text-align:center;margin-bottom:28px}
.err{background:#450a0a;border:1px solid #7f1d1d;color:#fca5a5;padding:10px 14px;border-radius:7px;font-size:13px;margin-bottom:18px;text-align:center}
label{display:block;font-size:11px;color:#94a3b8;margin-bottom:5px;font-weight:600;text-transform:uppercase;letter-spacing:.06em}
input{width:100%;padding:11px 14px;border:1px solid #475569;border-radius:7px;background:#0f172a;color:#f1f5f9;font-size:15px;outline:none;margin-bottom:16px;transition:border-color .15s,box-shadow .15s}
input:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.18)}
button{width:100%;padding:12px;background:#2563eb;color:#fff;border:none;border-radius:7px;font-size:15px;font-weight:600;cursor:pointer;transition:background .15s}
button:hover{background:#1d4ed8}
.foot{text-align:center;margin-top:22px;font-size:11px;color:#1e293b}
</style>
</head>
<body>
<div class="card">
  <h1>📊 DQ Case</h1>
  <div class="sub">Введите своё имя и пароль</div>
  ${error ? `<div class="err">${error}</div>` : ''}
  <form method="POST" action="/__auth">
    <label>Имя</label>
    <input type="text" name="login" placeholder="Ваше имя" autocomplete="username" required>
    <label>Пароль</label>
    <input type="password" name="password" placeholder="Пароль" autocomplete="current-password" required>
    <button type="submit">Войти →</button>
  </form>
  <div class="foot">Доступ ограничен</div>
</div>
</body>
</html>`;
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const cookieHeader = request.headers.get('cookie') || '';

  // POST /__auth — validate credentials
  if (url.pathname === '/__auth' && request.method === 'POST') {
    const text = await request.text();
    const params = new URLSearchParams(text);
    const login = (params.get('login') || '').trim().toLowerCase();
    const password = (params.get('password') || '').trim();

    if (USERS[login] && USERS[login] === password) {
      return new Response(null, {
        status: 302,
        headers: {
          'Location': '/',
          'Set-Cookie': `${COOKIE_NAME}=${encodeURIComponent(login)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`,
        },
      });
    }

    return new Response(loginHTML('Неверное имя или пароль'), {
      status: 401,
      headers: { 'Content-Type': 'text/html;charset=UTF-8' },
    });
  }

  // /__logout — clear cookie
  if (url.pathname === '/__logout') {
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/',
        'Set-Cookie': `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
      },
    });
  }

  // Check auth cookie
  const raw = getCookie(cookieHeader, COOKIE_NAME);
  const user = raw ? decodeURIComponent(raw) : '';

  if (!user || !USERS[user]) {
    return new Response(loginHTML(), {
      status: 200,
      headers: { 'Content-Type': 'text/html;charset=UTF-8' },
    });
  }

  // Authenticated — pass through to static files
  return undefined;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
