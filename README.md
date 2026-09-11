# Braza Burguer

Site de apresentação com animação por rolagem, hambúrguer em camadas, combo e caixa articulada.

## Organização

- public/index.html — estrutura da página, textos, produtos e preços.
- public/assets/css/styles.css — estilos e adaptação para celular.
- public/assets/js/main.js — rolagem, navegação e interações.
- public/assets/js/scene.mjs — cena 3D, materiais e animação da caixa.
- public/assets/images/ — imagens utilizadas no site.
- public/assets/vendor/ — biblioteca Three.js e sua licença.
- scripts/ — servidor local e verificação dos arquivos.
- tests/motion.cjs — verificações da sequência de animação.
- vercel.json — configuração de publicação na Vercel.

## Executar

Instale Node.js 18 ou superior. Dentro desta pasta, execute:

```sh
npm run dev
```

Abra http://127.0.0.1:5173/. Não é necessário instalar dependências: a biblioteca usada pelo navegador já está incluída.

## Verificar

```sh
npm run build
npm test
```

## Publicar

Publique o conteúdo de public/ em uma hospedagem de sites estáticos. Na Vercel, importe a pasta do projeto; vercel.json define public como diretório de saída.

## Edição

Altere textos, produtos e preços em public/index.html. Mantenha os caminhos de imagens ao substituir arquivos. Fontes Anton e DM Sans são carregadas pelo Google Fonts.

Os botões Adicionar exibem uma confirmação visual. O projeto não possui carrinho, pagamento ou envio de pedidos; essas integrações precisam ser configuradas conforme o atendimento da loja.

A licença de terceiros acompanha a biblioteca em public/assets/vendor/THREE-LICENSE.txt.
