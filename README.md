# portfolio

Portfólio de Leon Bruchmann Ronchi. ASP.NET Core Razor Pages (.NET 10), publicado como site estático no GitHub Pages.

## Rodando local

```bash
dotnet run
```

Ou F5 no Visual Studio.

## Fotos de perfil

O carrossel da página inicial mostra todas as imagens de `wwwroot/profilepics`
(`.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, `.gif`), em ordem alfabética do nome do arquivo.
Para adicionar ou remover uma foto, basta mexer na pasta, sem alterar código.
Fotos quadradas (ou com o rosto centralizado) ficam melhores no recorte circular.

## Publicação no GitHub Pages

O GitHub Pages só serve arquivos estáticos, então o workflow `.github/workflows/pages.yml`
renderiza a página uma vez e publica o HTML junto com o `wwwroot`. Ele roda a cada push na `main`.

Configuração única no repositório: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

Para gerar o mesmo resultado localmente (pasta `_site/`):

```bash
dotnet run -- --export _site
```

Como o site fica em `https://<usuario>.github.io/portfolio/`, todos os caminhos de
`Pages/Index.cshtml` são relativos (`css/...`, não `/css/...` nem `~/css/...`).
