const { default: open } = require('open');
const readline = require('readline');

const API_URL = 'https://plenoflu.com/api';
const EPISODE_ID = 248147; // ID do episódio atual

// ==========================================
// PERSONALIZAÇÃO DO PLAYER / IFRAME DO STREAMBETTER
// ==========================================
const CONFIG_IFRAME = {
    width: "100%",       // Largura do player (ex: "100%", "640px")
    height: "100%",      // Altura do player (ex: "100%", "360px")
    allowAutoplay: true  // Iniciar reprodução automaticamente
};

// Configuração para ler a entrada do terminal
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const perguntar = (pergunta) => {
    return new Promise((resolve) => {
        rl.question(pergunta, (resposta) => resolve(resposta));
    });
};

async function iniciarExtrator() {
    try {
        console.log(`\n🔍 A procurar canais para o conteúdo ID: ${EPISODE_ID}...\n`);

        const paramsOptions = new URLSearchParams({
            action: 'getOptions',
            contentid: EPISODE_ID
        });

        const resOptions = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://plenoflu.com/',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: paramsOptions
        });

        const dataOptions = await resOptions.json();

        if (!dataOptions.data || !dataOptions.data.options || dataOptions.data.options.length === 0) {
            console.log('❌ Nenhum canal encontrado para este ID.');
            rl.close();
            return;
        }

        const opcoes = dataOptions.data.options;
        const listaCanais = [];

        console.log('--------------------------------------------------');
        console.log('📋 CANAIS DISPONÍVEIS:');
        console.log('--------------------------------------------------');

        for (let i = 0; i < opcoes.length; i++) {
            const canal = opcoes[i];
            const videoId = canal.ID;
            const tipoAudio = canal.type === 1 ? 'Dublado' : 'Legendado';

            const paramsPlayer = new URLSearchParams({
                action: 'getPlayer',
                video_id: videoId
            });

            const resPlayer = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': 'https://plenoflu.com/',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: paramsPlayer
            });

            const dataPlayer = await resPlayer.json();

            if (dataPlayer.data && dataPlayer.data.video_url) {
                const rawBase64 = dataPlayer.data.video_url;
                let streamUrl = Buffer.from(rawBase64, 'base64').toString('utf-8');

                // Se o link for do StreamBetter, padroniza conforme a documentação oficial para embedar via iframe
                if (streamUrl.includes('streambetter.lol')) {
                    const match = streamUrl.match(/\/serie\/(\d+\/\d+\/\d+)/);
                    if (match) {
                        // Formato oficial do embed: https://streambetter.lol/serie/{tmdb_id}/{temporada}/{episodio}
                        streamUrl = `https://streambetter.lol/serie/${match[1]}`;
                    } else {
                        streamUrl = streamUrl.split('?')[0].replace(/\/docs$/, '');
                    }
                }

                listaCanais.push({
                    id: videoId,
                    tipo: tipoAudio,
                    url: streamUrl
                });

                console.log(`[${listaCanais.length}] Canal ${listaCanais.length} (${tipoAudio})`);
            }
        }

        console.log('--------------------------------------------------');

        if (listaCanais.length === 0) {
            console.log('❌ Nenhum link de vídeo válido foi retornado.');
            rl.close();
            return;
        }

        // Pergunta ao utilizador qual canal ele deseja gerar o Iframe
        const escolha = await perguntar('\n👉 Digite o número do canal para gerar o código Iframe do StreamBetter (ou 0 para sair): ');
        const indexEscolhido = parseInt(escolha) - 1;

        if (escolha === '0') {
            console.log('👋 A encerrar...');
            rl.close();
            return;
        }

        if (indexEscolhido >= 0 && indexEscolhido < listaCanais.length) {
            const canalSelecionado = listaCanais[indexEscolhido];
            
            // Atributos de permissão recomendados pela documentação oficial
            const allowPermissions = CONFIG_IFRAME.allowAutoplay 
                ? "autoplay; encrypted-media; picture-in-picture; fullscreen" 
                : "encrypted-media; picture-in-picture; fullscreen";

            // Montagem do Iframe seguindo o padrão oficial da documentação
            const codigoIframe = `<iframe\n  src="${canalSelecionado.url}"\n  width="${CONFIG_IFRAME.width}"\n  height="${CONFIG_IFRAME.height}"\n  frameborder="0"\n  allowfullscreen\n  allow="${allowPermissions}"></iframe>`;

            console.log('\n==================================================');
            console.log(`✨ CÓDIGO DO IFRAME OFICIAL GERADO (Canal ${indexEscolhido + 1} - ${canalSelecionado.tipo}):`);
            console.log('==================================================');
            console.log(codigoIframe);
            console.log('==================================================\n');

            // Pergunta se deseja testar abrindo direto no navegador
            const abrirBrowser = await perguntar('Deseja abrir esta URL do embed no navegador para testar? (s/n): ');
            if (abrirBrowser.toLowerCase() === 's') {
                await open(canalSelecionado.url);
                console.log('🚀 A abrir no navegador...');
            }

        } else {
            console.log('❌ Opção inválida.');
        }

        rl.close();

    } catch (err) {
        console.error('❌ Ocorreu um erro:', err.message);
        rl.close();
    }
}

iniciarExtrator();