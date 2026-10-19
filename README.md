# Sabor da Casa — Cardápio PWA

Cardápio digital estático com identidade visual inspirada no template Sarab, navegação inferior, favoritos, dados de conta salvos localmente, carrinho, checkout, consulta de CEP e geração de pedido para WhatsApp. Construído com HTML semântico, CSS e JavaScript nativo, sem dependências ou etapa de build.

## Executar localmente

```bash
python3 -m http.server 8000
```

Abra http://localhost:8000. Para testar recursos de PWA e cache, use localhost ou publique em HTTPS.

## Personalização

- `app.js`: catálogo, estado da aplicação, persistência local, eventos, carrinho, checkout, CEP e instalação do PWA.
- `index.html`: conteúdo, textos, formulários e estrutura acessível das seções.
- `style.css`: tokens de design, componentes e regras responsivas.
- `manifest.webmanifest`: nome e aparência de instalação do PWA.
- `service-worker.js`: arquivos pré-cacheados e versão do cache.
- `img/menu/`: imagens de demonstração do catálogo.

O JavaScript está organizado em funções por responsabilidade e inicializado em escopo local, sem variáveis globais da aplicação. A renderização do catálogo e do carrinho usa elementos DOM e conteúdo textual. Os favoritos e os dados da conta (nome, telefone e endereço) são armazenados no `localStorage` do navegador e não são enviados a um servidor. Os dados da conta podem ser alterados pelo botão **Conta** na navegação inferior.

## Atenção

Este projeto é uma demonstração: não processa pagamentos nem registra pedidos em servidor. O cliente precisa enviar a mensagem no WhatsApp. Confirme o número de WhatsApp em `app.js` antes de publicar.

## Créditos do design

A direção visual foi adaptada a partir do template Sarab, distribuído pela ThemeWagon e atribuído à Bestwpware. O pacote original informa licença MIT; consulte o README e os termos do pacote original ao redistribuir os respectivos recursos. Imagens do template foram incluídas como imagens demonstrativas.

## Publicação

Envie os arquivos para a raiz do branch `main` e configure GitHub Pages em **Settings → Pages → Deploy from a branch → main → /(root)**.
