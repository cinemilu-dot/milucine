const express = require('express');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const API_URL = 'https://plenoflu.com/api';
const STREAMBETTER_CATALOGO = 'https://streambetter.lol/catalogo';
const ARQUIVO_USUARIOS = path.join(__dirname, 'usuarios.json');

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const sessoesAtivas = new Map();

function carregarUsuarios() {
    try {
        if (fs.existsSync(ARQUIVO_USUARIOS)) {
            const dados = fs.readFileSync(ARQUIVO_USUARIOS, 'utf8');
            return JSON.parse(dados);
        }
    } catch (err) {
        console.error('❌ Erro ao ler o arquivo de usuários:', err);
    }
    return { "admin": "123456789101112" };
}

// Tela de Login
function telaLogin(erro = '') {
    return `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Login - MiluCine</title>
            <style>
                body { margin: 0; background-color: #0f1014; color: #fff; font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; }
                .login-card { background: #1a1c23; padding: 40px; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); width: 100%; max-width: 380px; border: 1px solid #232635; text-align: center; }
                .login-card h2 { margin-bottom: 24px; color: #e50914; font-size: 1.5rem; }
                .input-group { margin-bottom: 16px; text-align: left; }
                .input-group label { display: block; font-size: 0.85rem; color: #aaa; margin-bottom: 6px; }
                .input-group input { width: 100%; padding: 12px; background: #0f1014; border: 1px solid #232635; border-radius: 6px; color: #fff; font-size: 1rem; box-sizing: border-box; outline: none; }
                .input-group input:focus { border-color: #e50914; }
                .btn-submit { width: 100%; padding: 12px; background: #e50914; border: none; border-radius: 6px; color: #fff; font-size: 1rem; font-weight: bold; cursor: pointer; margin-top: 8px; }
                .btn-submit:hover { background: #f40612; }
                .error-msg { color: #ff4d4d; font-size: 0.85rem; margin-bottom: 16px; }
            </style>
        </head>
        <body>
            <div class="login-card">
                <h2>🎬 MiluCine</h2>
                ${erro ? `<div class="error-msg">${erro}</div>` : ''}
                <form action="/login" method="POST">
                    <div class="input-group">
                        <label>Usuário</label>
                        <input type="text" name="usuario" required autocomplete="off">
                    </div>
                    <div class="input-group">
                        <label>Senha</label>
                        <input type="password" name="senha" required>
                    </div>
                    <button type="submit" class="btn-submit">Entrar</button>
                </form>
            </div>
        </body>
        </html>
    `;
}

const verificarAutenticacao = (req, res, next) => {
    const { usuario, sessionId } = req.cookies;
    if (!usuario || !sessionId || !sessoesAtivas.has(usuario) || !sessoesAtivas.get(usuario).has(sessionId)) {
        res.clearCookie('autenticado');
        res.clearCookie('usuario');
        res.clearCookie('sessionId');
        return res.redirect('/login');
    }
    return next();
};

app.get('/login', (req, res) => {
    res.send(telaLogin());
});

app.post('/login', (req, res) => {
    const { usuario, senha } = req.body;
    const usuariosCadastrados = carregarUsuarios();

    if (!usuariosCadastrados[usuario] || usuariosCadastrados[usuario] !== senha) {
        return res.send(telaLogin('❌ Usuário ou senha incorretos!'));
    }

    if (!sessoesAtivas.has(usuario)) {
        sessoesAtivas.set(usuario, new Set());
    }
    const sessoesDoUsuario = sessoesAtivas.get(usuario);

    if (sessoesDoUsuario.size >= 2) {
        return res.send(telaLogin(`❌ Limite de 2 conexões simultâneas atingido para "${usuario}".`));
    }

    const novoSessionId = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessoesDoUsuario.add(novoSessionId);

    res.cookie('autenticado', 'true', { httpOnly: true });
    res.cookie('usuario', usuario, { httpOnly: true });
    res.cookie('sessionId', novoSessionId, { httpOnly: true });

    return res.redirect('/');
});

// Página Principal (Catálogo com margin-top ajustado para -190px)
app.get('/', verificarAutenticacao, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>MiluCine - Portal</title>
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    background-color: #0f1014;
                    color: #fff;
                    font-family: Arial, sans-serif;
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                    overflow: hidden;
                }
                .header-bar {
                    width: 100%;
                    background: #1a1c23;
                    padding: 10px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-sizing: border-box;
                    border-bottom: 1px solid #232635;
                    z-index: 10;
                }
                .header-title {
                    font-size: 1rem;
                    font-weight: bold;
                    color: #e50914;
                }
                .btn-logout {
                    background: transparent;
                    border: 1px solid #232635;
                    color: #aaa;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    text-decoration: none;
                    font-size: 0.85rem;
                }
                .btn-logout:hover {
                    border-color: #e50914;
                    color: #fff;
                }
                .portal-container {
                    width: 100%;
                    flex: 1;
                    background: #0f1014;
                    position: relative;
                    overflow: hidden;
                }
                iframe {
                    width: 100%;
                    height: calc(100% + 280px);
                    border: none;
                    margin-top: -190px;
                    margin-bottom: -160px;
                }
            </style>
        </head>
        <body>
            <div class="header-bar">
                <span class="header-title">🎬 MiluCine</span>
                <a href="/logout" class="btn-logout">Sair</a>
            </div>
            <div class="portal-container">
                <iframe src="${STREAMBETTER_CATALOGO}" allowfullscreen allow="autoplay; encrypted-media; picture-in-picture; fullscreen"></iframe>
            </div>
        </body>
        </html>
    `);
});

// Rota Dinâmica para Extrair e Reproduzir Episódios por ID (Ex: /player/248147)
app.get('/player/:id', verificarAutenticacao, async (req, res) => {
    const episodeId = req.params.id;
    try {
        const paramsOptions = new URLSearchParams({ action: 'getOptions', contentid: episodeId });
        const resOptions = await fetch(API_URL, {
            method: 'POST',
            headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://plenoflu.com/', 'X-Requested-With': 'XMLHttpRequest' },
            body: paramsOptions
        });
        const dataOptions = await resOptions.json();

        if (!dataOptions.data || !dataOptions.data.options || dataOptions.data.options.length === 0) {
            return res.send(`<h3 style="color:#fff;font-family:sans-serif;text-align:center;margin-top:20vh;">❌ Nenhum canal encontrado para o ID: ${episodeId}</h3>`);
        }

        const opcoes = dataOptions.data.options;
        let listaCanaisHtml = '';

        for (let i = 0; i < opcoes.length; i++) {
            const canal = opcoes[i];
            const paramsPlayer = new URLSearchParams({ action: 'getPlayer', video_id: canal.ID });
            const resPlayer = await fetch(API_URL, {
                method: 'POST',
                headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://plenoflu.com/', 'X-Requested-With': 'XMLHttpRequest' },
                body: paramsPlayer
            });
            const dataPlayer = await resPlayer.json();

            if (dataPlayer.data && dataPlayer.data.video_url) {
                let streamUrl = Buffer.from(dataPlayer.data.video_url, 'base64').toString('utf-8');
                if (streamUrl.includes('streambetter.lol')) {
                    const match = streamUrl.match(/\/serie\/(\d+\/\d+\/\d+)/);
                    if (match) streamUrl = `https://streambetter.lol/serie/${match[1]}`;
                }
                const tipoAudio = canal.type === 1 ? 'Dublado' : 'Legendado';
                listaCanaisHtml += `
                    <div style="margin-bottom: 20px;">
                        <h4 style="color: #aaa; margin-bottom: 8px;">Opção ${i + 1} (${tipoAudio})</h4>
                        <iframe src="${streamUrl}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen style="width:100%; aspect-ratio:16/9; border:0; border-radius:12px; background:#000;"></iframe>
                    </div>
                `;
            }
        }

        res.send(`
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head><meta charset="UTF-8"><title>Player - ID ${episodeId}</title></head>
            <body style="background:#0f1014; color:#fff; font-family:sans-serif; padding:20px; max-width:900px; margin:auto;">
                <h2>📺 Reprodutor de Episódio (ID: ${episodeId})</h2>
                <a href="/" style="color:#e50914; text-decoration:none; display:inline-block; margin-bottom:20px;">← Voltar ao Início</a>
                ${listaCanaisHtml || '<p>Nenhum link gerado com sucesso.</p>'}
            </body>
            </html>
        `);
    } catch (err) {
        res.status(500).send(`<h3 style="color:red;text-align:center;">Erro ao processar: ${err.message}</h3>`);
    }
});

app.get('/logout', (req, res) => {
    const { usuario, sessionId } = req.cookies;
    if (usuario && sessoesAtivas.has(usuario)) sessoesAtivas.get(usuario).delete(sessionId);
    res.clearCookie('autenticado');
    res.clearCookie('usuario');
    res.clearCookie('sessionId');
    res.redirect('/login');
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor web rodando na porta ${PORT}`);
});
