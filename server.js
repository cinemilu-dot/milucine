const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rota de Proxy para destravar os sites no iframe
app.use('/proxy', (req, res, next) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).send('URL não fornecida');
    }

    try {
        const parsedUrl = new URL(targetUrl);
        
        const proxy = createProxyMiddleware({
            target: parsedUrl.origin,
            changeOrigin: true,
            pathRewrite: () => parsedUrl.pathname + parsedUrl.search,
            onProxyRes: (proxyRes, req, res) => {
                // Remove os bloqueios de iframe dos servidores externos
                delete proxyRes.headers['x-frame-options'];
                delete proxyRes.headers['content-security-policy'];
                delete proxyRes.headers['frame-options'];
            },
            onError: (err, req, res) => {
                res.status(500).send('Erro ao carregar o canal no proxy.');
            }
        });

        return proxy(req, res, next);
    } catch (e) {
        return res.status(400).send('URL inválida.');
    }
});

// Rota coringa para o frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`MiluCine rodando na porta ${PORT}`);
});
