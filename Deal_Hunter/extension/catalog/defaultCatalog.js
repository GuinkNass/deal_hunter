// Catálogo offline pré-carregado com 8 lojas e 214 categorias
const BUILTIN_CATALOG = [
  {
    "id": "amazon-br",
    "name": "Amazon Brasil",
    "domain": "amazon.com.br",
    "url": "https://www.amazon.com.br/",
    "requiresLogin": false,
    "loginUrl": null,
    "categories": [
      {
        "id": "amazon-bebidas-alcolicas",
        "name": "BEBIDAS ALCOLICAS",
        "url": "https://www.amazon.com.br/s?i=wine&rh=n%3A19778003011&s=popularity-rank&fs=true&ref=lp_19778003011_sar",
        "siteId": "amazon-br",
        "siteName": "Amazon Brasil",
        "domain": "amazon.com.br",
        "selected": false
      },
      {
        "id": "amazon-cafe-da-manha",
        "name": "CAFÉ DA MANHA",
        "url": "https://www.amazon.com.br/s?i=wine&rh=n%3A19778001011&s=popularity-rank&fs=true&ref=lp_19778001011_sar",
        "siteId": "amazon-br",
        "siteName": "Amazon Brasil",
        "domain": "amazon.com.br",
        "selected": false
      },
      {
        "id": "amazon-cereais-e-granalo",
        "name": "CEREAIS E GRANALO",
        "url": "https://www.amazon.com.br/s?i=wine&rh=n%3A118520415011&s=popularity-rank&fs=true&ref=lp_118520415011_sar",
        "siteId": "amazon-br",
        "siteName": "Amazon Brasil",
        "domain": "amazon.com.br",
        "selected": false
      },
      {
        "id": "amazon-oleos-e-azeites",
        "name": "OLEOS E AZEITES",
        "url": "https://www.amazon.com.br/s?i=wine&rh=n%3A19778017011&s=popularity-rank&fs=true&ref=lp_19778017011_sar",
        "siteId": "amazon-br",
        "siteName": "Amazon Brasil",
        "domain": "amazon.com.br",
        "selected": false
      },
      {
        "id": "amazon-automotivo",
        "name": "AUTOMOTIVO",
        "url": "https://www.amazon.com.br/s?i=automotive&rh=n%3A18914209011&s=popularity-rank&fs=true&ref=lp_18914209011_sar",
        "siteId": "amazon-br",
        "siteName": "Amazon Brasil",
        "domain": "amazon.com.br",
        "selected": false
      },
      {
        "id": "amazon-para-bebes",
        "name": "PARA BEBES",
        "url": "https://www.amazon.com.br/s?i=baby&rh=n%3A17242603011&s=popularity-rank&fs=true&ref=lp_17242603011_sar",
        "siteId": "amazon-br",
        "siteName": "Amazon Brasil",
        "domain": "amazon.com.br",
        "selected": false
      },
      {
        "id": "amazon-cuidados-corpo",
        "name": "CUIDADOS CORPO",
        "url": "https://www.amazon.com.br/s?i=beauty&rh=n%3A16194414011&s=popularity-rank&fs=true&ref=lp_16194414011_sar",
        "siteId": "amazon-br",
        "siteName": "Amazon Brasil",
        "domain": "amazon.com.br",
        "selected": false
      },
      {
        "id": "amazon-bolsas-malas-e-mochilas",
        "name": "BOLSAS MALAS E MOCHILAS",
        "url": "https://www.amazon.com.br/b?node=17934495011&discounts-widget=%2522%257B%255C%2522state%255C%2522%253A%257B%255C%2522refinementFilters%255C%2522%253A%257B%255C%2522departments%255C%2522%253A%255B%255C%252217365811011%252F17681967011%255C%2522%255D%257D%257D%252C%255C%2522version%255C%2522%253A1%257D%2522",
        "siteId": "amazon-br",
        "siteName": "Amazon Brasil",
        "domain": "amazon.com.br",
        "selected": false
      },
      {
        "id": "amazon-brinquedos",
        "name": "BRINQUEDOS",
        "url": "https://www.amazon.com.br/s?i=toys&rh=n%3A16194299011&s=popularity-rank&fs=true&ref=lp_16194299011_sar",
        "siteId": "amazon-br",
        "siteName": "Amazon Brasil",
        "domain": "amazon.com.br",
        "selected": false
      },
      {
        "id": "amazon-casa",
        "name": "CASA",
        "url": "https://www.amazon.com.br/s?i=home&rh=n%3A16191000011&s=popularity-rank&fs=true&ref=lp_16191000011_sar",
        "siteId": "amazon-br",
        "siteName": "Amazon Brasil",
        "domain": "amazon.com.br",
        "selected": false
      },
      {
        "id": "amazon-celulares-e-comunicacao",
        "name": "CELULARES E COMUNICAÇÃO",
        "url": "https://www.amazon.com.br/s?i=electronics&rh=n%3A16243803011&s=popularity-rank&fs=true&ref=lp_16243803011_sar",
        "siteId": "amazon-br",
        "siteName": "Amazon Brasil",
        "domain": "amazon.com.br",
        "selected": false
      },
      {
        "id": "amazon-informatica",
        "name": "INFORMATICA",
        "url": "https://www.amazon.com.br/s?i=computers&rh=n%3A16339926011&s=popularity-rank&fs=true&ref=lp_16339926011_sar",
        "siteId": "amazon-br",
        "siteName": "Amazon Brasil",
        "domain": "amazon.com.br",
        "selected": false
      },
      {
        "id": "amazon-cozinha",
        "name": "COZINHA",
        "url": "https://www.amazon.com.br/s?i=kitchen&rh=n%3A16957125011&s=popularity-rank&fs=true&ref=lp_16957125011_sar",
        "siteId": "amazon-br",
        "siteName": "Amazon Brasil",
        "domain": "amazon.com.br",
        "selected": false
      },
      {
        "id": "amazon-eletronicos",
        "name": "ELETRONICOS",
        "url": "https://www.amazon.com.br/s?i=electronics&rh=n%3A16209062011&s=popularity-rank&fs=true&ref=lp_16209062011_sar",
        "siteId": "amazon-br",
        "siteName": "Amazon Brasil",
        "domain": "amazon.com.br",
        "selected": false
      },
      {
        "id": "amazon-esporte",
        "name": "ESPORTE",
        "url": "https://www.amazon.com.br/s?i=sporting&rh=n%3A17349396011&s=popularity-rank&fs=true&ref=lp_17349396011_sar",
        "siteId": "amazon-br",
        "siteName": "Amazon Brasil",
        "domain": "amazon.com.br",
        "selected": false
      },
      {
        "id": "amazon-ferramentas-e-contrucao",
        "name": "FERRAMENTAS E CONTRUÇÃO",
        "url": "https://www.amazon.com.br/s?i=hi&rh=n%3A16957182011&s=popularity-rank&fs=true&ref=lp_16957182011_sar",
        "siteId": "amazon-br",
        "siteName": "Amazon Brasil",
        "domain": "amazon.com.br",
        "selected": false
      },
      {
        "id": "amazon-games-e-console",
        "name": "GAMES E CONSOLE",
        "url": "https://www.amazon.com.br/s?i=videogames&rh=n%3A7791985011&s=popularity-rank&fs=true&ref=lp_7791985011_sar",
        "siteId": "amazon-br",
        "siteName": "Amazon Brasil",
        "domain": "amazon.com.br",
        "selected": false
      },
      {
        "id": "amazon-papelaria",
        "name": "PAPELARIA",
        "url": "https://www.amazon.com.br/s?i=office-products&rh=n%3A16957239011&s=popularity-rank&fs=true&ref=lp_16957239011_sar",
        "siteId": "amazon-br",
        "siteName": "Amazon Brasil",
        "domain": "amazon.com.br",
        "selected": false
      },
      {
        "id": "amazon-petshop",
        "name": "PETSHOP",
        "url": "https://www.amazon.com.br/s?i=pets&rh=n%3A18991136011&s=popularity-rank&fs=true&ref=lp_18991136011_sar",
        "siteId": "amazon-br",
        "siteName": "Amazon Brasil",
        "domain": "amazon.com.br",
        "selected": false
      },
      {
        "id": "amazon-roupas",
        "name": "ROUPAS",
        "url": "https://amazon.com.br/gp/browse.html?node=17365811011&ref_=nav_em__fashion_all_0_2_27_2&promotionsSearchLastSeenAsin=B0GV964JLF&promotionsSearchStartIndex=120&promotionsSearchPageSize=60",
        "siteId": "amazon-br",
        "siteName": "Amazon Brasil",
        "domain": "amazon.com.br",
        "selected": false
      }
    ]
  },
  {
    "id": "magalu",
    "name": "Magazine Luiza",
    "domain": "magazineluiza.com.br",
    "url": "https://www.magazineluiza.com.br/",
    "requiresLogin": false,
    "loginUrl": null,
    "categories": [
      {
        "id": "magalu-te",
        "name": "Celulares e Smartphones",
        "url": "https://www.magazineluiza.com.br/celulares-e-smartphones/l/te/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-et",
        "name": "TV e Vídeo",
        "url": "https://www.magazineluiza.com.br/tv-e-video/l/et/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-ed",
        "name": "Eletrodomésticos",
        "url": "https://www.magazineluiza.com.br/eletrodomesticos/l/ed/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-mo",
        "name": "Móveis",
        "url": "https://www.magazineluiza.com.br/moveis/l/mo/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-in",
        "name": "Informática",
        "url": "https://www.magazineluiza.com.br/informatica/l/in/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-md",
        "name": "Moda e Acessórios",
        "url": "https://www.magazineluiza.com.br/moda-e-acessorios/l/md/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-ar",
        "name": "Ar e Ventilação",
        "url": "https://www.magazineluiza.com.br/ar-e-ventilacao/l/ar/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-am",
        "name": "Artesanato",
        "url": "https://www.magazineluiza.com.br/artesanato/l/am/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-af",
        "name": "Artigos para Festa",
        "url": "https://www.magazineluiza.com.br/artigos-para-festa/l/af/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-ea",
        "name": "Áudio",
        "url": "https://www.magazineluiza.com.br/audio/l/ea/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-au",
        "name": "Automotivo",
        "url": "https://www.magazineluiza.com.br/automotivo/l/au/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-bb",
        "name": "Bebê",
        "url": "https://www.magazineluiza.com.br/bebe/l/bb/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-pf",
        "name": "Beleza e Perfumaria",
        "url": "https://www.magazineluiza.com.br/beleza-e-perfumaria/l/pf/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-bs",
        "name": "Bem-Estar Sexual",
        "url": "https://www.magazineluiza.com.br/bem-estar-sexual/l/bs/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-br",
        "name": "Brinquedos",
        "url": "https://www.magazineluiza.com.br/brinquedos/l/br/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-cm",
        "name": "Cama, Mesa e Banho",
        "url": "https://www.magazineluiza.com.br/cama-mesa-e-banho/l/cm/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-cf",
        "name": "Câmeras e Drones",
        "url": "https://www.magazineluiza.com.br/cameras-e-drones/l/cf/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-cj",
        "name": "Casa e Construção",
        "url": "https://www.magazineluiza.com.br/casa-e-construcao/l/cj/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-ci",
        "name": "Casa Inteligente",
        "url": "https://www.magazineluiza.com.br/casa-inteligente/l/ci/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-co",
        "name": "Colchões",
        "url": "https://www.magazineluiza.com.br/colchoes/l/co/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-pi",
        "name": "Comércio e Indústria",
        "url": "https://www.magazineluiza.com.br/comercio-e-industria/l/pi/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-de",
        "name": "Decoração",
        "url": "https://www.magazineluiza.com.br/decoracao/l/de/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-ep",
        "name": "Eletroportáteis",
        "url": "https://www.magazineluiza.com.br/eletroportateis/l/ep/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-es",
        "name": "Esporte e Lazer",
        "url": "https://www.magazineluiza.com.br/esporte-e-lazer/l/es/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-fs",
        "name": "Ferramentas",
        "url": "https://www.magazineluiza.com.br/ferramentas/l/fs/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-fm",
        "name": "Filmes e Séries",
        "url": "https://www.magazineluiza.com.br/filmes-e-series/l/fm/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-fj",
        "name": "Flores e Jardim",
        "url": "https://www.magazineluiza.com.br/flores-e-jardim/l/fj/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-ga",
        "name": "Games",
        "url": "https://www.magazineluiza.com.br/games/l/ga/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-im",
        "name": "Instrumentos Musicais",
        "url": "https://www.magazineluiza.com.br/instrumentos-musicais/l/im/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-li",
        "name": "Livros",
        "url": "https://www.magazineluiza.com.br/livros/l/li/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-me",
        "name": "Mercado",
        "url": "https://www.magazineluiza.com.br/mercado/l/me/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-ms",
        "name": "Música e Shows",
        "url": "https://www.magazineluiza.com.br/musica-e-shows/l/ms/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-na",
        "name": "Natal",
        "url": "https://www.magazineluiza.com.br/natal/l/na/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-pa",
        "name": "Papelaria",
        "url": "https://www.magazineluiza.com.br/papelaria/l/pa/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-pe",
        "name": "Pet Shop",
        "url": "https://www.magazineluiza.com.br/pet-shop/l/pe/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-rg",
        "name": "Religião e Espiritualidade",
        "url": "https://www.magazineluiza.com.br/religiao-e-espiritualidade/l/rg/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-re",
        "name": "Relógios",
        "url": "https://www.magazineluiza.com.br/relogios/l/re/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-cp",
        "name": "Saúde e Cuidados Pessoais",
        "url": "https://www.magazineluiza.com.br/saude-e-cuidados-pessoais/l/cp/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-se",
        "name": "Serviços",
        "url": "https://www.magazineluiza.com.br/servicos/l/se/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-sa",
        "name": "Suplementos Alimentares",
        "url": "https://www.magazineluiza.com.br/suplementos-alimentares/l/sa/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-tb",
        "name": "Tablets, iPads e E-readers",
        "url": "https://www.magazineluiza.com.br/tablets-ipads-e-e-reader/l/tb/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-tf",
        "name": "Telefonia Fixa",
        "url": "https://www.magazineluiza.com.br/telefonia-fixa/l/tf/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      },
      {
        "id": "magalu-ud",
        "name": "Utilidades Domésticas",
        "url": "https://www.magazineluiza.com.br/utilidades-domesticas/l/ud/",
        "siteId": "magalu",
        "siteName": "Magazine Luiza",
        "domain": "magazineluiza.com.br",
        "selected": false
      }
    ]
  },
  {
    "id": "eletroclub",
    "name": "Eletroclub",
    "domain": "eletroclub.com.br",
    "url": "https://www.eletroclub.com.br/",
    "requiresLogin": false,
    "loginUrl": null,
    "categories": [
      {
        "id": "eletroclub-home",
        "name": "Página inicial / vitrines",
        "url": "https://www.eletroclub.com.br/",
        "siteId": "eletroclub",
        "siteName": "Eletroclub",
        "domain": "eletroclub.com.br",
        "selected": false
      },
      {
        "id": "eletroclub-cozinha",
        "name": "Cozinha",
        "url": "https://www.eletroclub.com.br/cozinha",
        "siteId": "eletroclub",
        "siteName": "Eletroclub",
        "domain": "eletroclub.com.br",
        "selected": false
      },
      {
        "id": "eletroclub-climatizacao",
        "name": "Climatização",
        "url": "https://www.eletroclub.com.br/climatizacao",
        "siteId": "eletroclub",
        "siteName": "Eletroclub",
        "domain": "eletroclub.com.br",
        "selected": false
      },
      {
        "id": "eletroclub-casa",
        "name": "Casa",
        "url": "https://www.eletroclub.com.br/casa",
        "siteId": "eletroclub",
        "siteName": "Eletroclub",
        "domain": "eletroclub.com.br",
        "selected": false
      },
      {
        "id": "eletroclub-cuidados-pessoais",
        "name": "Cuidados Pessoais",
        "url": "https://www.eletroclub.com.br/cuidados-pessoais",
        "siteId": "eletroclub",
        "siteName": "Eletroclub",
        "domain": "eletroclub.com.br",
        "selected": false
      },
      {
        "id": "eletroclub-audio-video",
        "name": "Áudio e Vídeo",
        "url": "https://www.eletroclub.com.br/audio-e-video",
        "siteId": "eletroclub",
        "siteName": "Eletroclub",
        "domain": "eletroclub.com.br",
        "selected": false
      },
      {
        "id": "eletroclub-outlet",
        "name": "Outlet / Ofertas",
        "url": "https://www.eletroclub.com.br/outlet",
        "siteId": "eletroclub",
        "siteName": "Eletroclub",
        "domain": "eletroclub.com.br",
        "selected": true
      }
    ]
  },
  {
    "id": "kabum",
    "name": "KaBuM!",
    "domain": "kabum.com.br",
    "url": "https://www.kabum.com.br",
    "requiresLogin": false,
    "loginUrl": null,
    "categories": [
      {
        "id": "kabum-1",
        "name": "Hardware Geral",
        "url": "https://www.kabum.com.br/hardware?page_number=1&page_size=60&facet_filters=eyJoYXNfb2ZmZXIiOlsidHJ1ZSJdfQ==&sort=most_searched",
        "siteId": "kabum",
        "siteName": "KaBuM!",
        "domain": "kabum.com.br",
        "selected": false
      },
      {
        "id": "kabum-2",
        "name": "Categoria 2",
        "url": "https://www.kabum.com.br/hardware/placa-de-video-vga?page_number=1&page_size=60&facet_filters=eyJoYXNfb2ZmZXIiOlsidHJ1ZSJdfQ==&sort=most_searched](https://www.kabum.com.br/hardware/placa-de-video-vga?page_number=1&page_size=60&facet_filters=eyJoYXNfb2ZmZXIiOlsidHJ1ZSJdfQ==&sort=most_searched",
        "siteId": "kabum",
        "siteName": "KaBuM!",
        "domain": "kabum.com.br",
        "selected": false
      },
      {
        "id": "kabum-3",
        "name": "Processadores",
        "url": "https://www.kabum.com.br/hardware/processadores?page_number=1&page_size=60&facet_filters=eyJoYXNfb2ZmZXIiOlsidHJ1ZSJdfQ==&sort=most_searched",
        "siteId": "kabum",
        "siteName": "KaBuM!",
        "domain": "kabum.com.br",
        "selected": false
      },
      {
        "id": "kabum-4",
        "name": "Placas-Mãe",
        "url": "https://www.kabum.com.br/hardware/placas-mae?page_number=1&page_size=60&facet_filters=eyJoYXNfb2ZmZXIiOlsidHJ1ZSJdfQ==&sort=most_searched",
        "siteId": "kabum",
        "siteName": "KaBuM!",
        "domain": "kabum.com.br",
        "selected": false
      },
      {
        "id": "kabum-5",
        "name": "Memória RAM",
        "url": "https://www.kabum.com.br/hardware/memoria-ram?page_number=1&page_size=60&facet_filters=eyJoYXNfb2ZmZXIiOlsidHJ1ZSJdfQ==&sort=most_searched",
        "siteId": "kabum",
        "siteName": "KaBuM!",
        "domain": "kabum.com.br",
        "selected": false
      },
      {
        "id": "kabum-6",
        "name": "SSDs e HDs",
        "url": "https://www.kabum.com.br/hardware/ssd-2-5?page_number=1&page_size=60&facet_filters=eyJoYXNfb2ZmZXIiOlsidHJ1ZSJdfQ==&sort=most_searched",
        "siteId": "kabum",
        "siteName": "KaBuM!",
        "domain": "kabum.com.br",
        "selected": false
      },
      {
        "id": "kabum-7",
        "name": "Fontes",
        "url": "https://www.kabum.com.br/hardware/fontes?page_number=1&page_size=60&facet_filters=eyJoYXNfb2ZmZXIiOlsidHJ1ZSJdfQ==&sort=most_searched",
        "siteId": "kabum",
        "siteName": "KaBuM!",
        "domain": "kabum.com.br",
        "selected": false
      },
      {
        "id": "kabum-8",
        "name": "Coolers e Water Coolers",
        "url": "https://www.kabum.com.br/hardware/coolers?page_number=1&page_size=60&facet_filters=eyJoYXNfb2ZmZXIiOlsidHJ1ZSJdfQ==&sort=most_searched](https://www.kabum.com.br/hardware/coolers?page_number=1&page_size=60&facet_filters=eyJoYXNfb2ZmZXIiOlsidHJ1ZSJdfQ==&sort=most_searched",
        "siteId": "kabum",
        "siteName": "KaBuM!",
        "domain": "kabum.com.br",
        "selected": false
      },
      {
        "id": "kabum-9",
        "name": "Computadores e PCs Gamers",
        "url": "https://www.kabum.com.br/computadores/pc/pc-gamer?page_number=1&page_size=60&facet_filters=eyJoYXNfb2ZmZXIiOlsidHJ1ZSJdfQ==&sort=most_searched",
        "siteId": "kabum",
        "siteName": "KaBuM!",
        "domain": "kabum.com.br",
        "selected": false
      },
      {
        "id": "kabum-10",
        "name": "Notebooks",
        "url": "https://www.kabum.com.br/computadores/notebooks?page_number=1&page_size=60&facet_filters=eyJoYXNfb2ZmZXIiOlsidHJ1ZSJdfQ==&sort=most_searched",
        "siteId": "kabum",
        "siteName": "KaBuM!",
        "domain": "kabum.com.br",
        "selected": false
      },
      {
        "id": "kabum-11",
        "name": "Monitores",
        "url": "https://www.kabum.com.br/computadores/monitores?page_number=1&page_size=60&facet_filters=eyJoYXNfb2ZmZXIiOlsidHJ1ZSJdfQ==&sort=most_searched",
        "siteId": "kabum",
        "siteName": "KaBuM!",
        "domain": "kabum.com.br",
        "selected": false
      },
      {
        "id": "kabum-12",
        "name": "Periféricos - Teclados e Mouses",
        "url": "https://www.kabum.com.br/perifericos/teclado-mouse?page_number=1&page_size=60&facet_filters=eyJoYXNfb2ZmZXIiOlsidHJ1ZSJdfQ==&sort=most_searched",
        "siteId": "kabum",
        "siteName": "KaBuM!",
        "domain": "kabum.com.br",
        "selected": false
      },
      {
        "id": "kabum-13",
        "name": "Headsets Gamers",
        "url": "https://www.kabum.com.br/perifericos/headset-gamer?page_number=1&page_size=60&facet_filters=eyJoYXNfb2ZmZXIiOlsidHJ1ZSJdfQ==&sort=most_searched",
        "siteId": "kabum",
        "siteName": "KaBuM!",
        "domain": "kabum.com.br",
        "selected": false
      },
      {
        "id": "kabum-14",
        "name": "Cadeiras Gamer",
        "url": "https://www.kabum.com.br/espaco-gamer/cadeiras-gamer?page_number=1&page_size=60&facet_filters=eyJoYXNfb2ZmZXIiOlsidHJ1ZSJdfQ==&sort=most_searched",
        "siteId": "kabum",
        "siteName": "KaBuM!",
        "domain": "kabum.com.br",
        "selected": false
      },
      {
        "id": "kabum-15",
        "name": "Smartphones",
        "url": "https://www.kabum.com.br/celular-smartphone?page_number=1&page_size=60&facet_filters=eyJoYXNfb2ZmZXIiOlsidHJ1ZSJdfQ==&sort=most_searched",
        "siteId": "kabum",
        "siteName": "KaBuM!",
        "domain": "kabum.com.br",
        "selected": false
      }
    ]
  },
  {
    "id": "pichau",
    "name": "Pichau",
    "domain": "pichau.com.br",
    "url": "https://www.pichau.com.br",
    "requiresLogin": false,
    "loginUrl": null,
    "categories": [
      {
        "id": "pichau-1",
        "name": "Processadores",
        "url": "https://www.pichau.com.br/hardware/processadores",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-2",
        "name": "Placa Mãe",
        "url": "https://www.pichau.com.br/hardware/placa-m-e",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-3",
        "name": "Memórias",
        "url": "https://www.pichau.com.br/hardware/memorias",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-4",
        "name": "Placa de Vídeo",
        "url": "https://www.pichau.com.br/hardware/placa-de-video",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-5",
        "name": "Disco Rígido interno (HD)",
        "url": "https://www.pichau.com.br/hardware/hard-disk-e-ssd",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-6",
        "name": "SSD",
        "url": "https://www.pichau.com.br/hardware/ssd",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-7",
        "name": "Gabinete",
        "url": "https://www.pichau.com.br/hardware/gabinete",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-8",
        "name": "Fonte",
        "url": "https://www.pichau.com.br/hardware/fonte",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-9",
        "name": "Cabos Extensores Sleeved",
        "url": "https://www.pichau.com.br/hardware/cabos-extensores-sleeved",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-10",
        "name": "Coolers e Watercoolers",
        "url": "https://www.pichau.com.br/hardware/cooler-processador",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-11",
        "name": "Ventoinhas e Casemod",
        "url": "https://www.pichau.com.br/hardware/ventoinhas-e-casemod",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-12",
        "name": "Pasta Térmica e Refrigerantes",
        "url": "https://www.pichau.com.br/hardware/pasta-termica-e-refrigerantes",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-13",
        "name": "Placas de Som",
        "url": "https://www.pichau.com.br/hardware/placas-de-som",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-14",
        "name": "Drive Óptico",
        "url": "https://www.pichau.com.br/hardware/drive-optico",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-15",
        "name": "Acessórios para Gabinete",
        "url": "https://www.pichau.com.br/hardware/acessorios-para-gabinete",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-16",
        "name": "Acessórios",
        "url": "https://www.pichau.com.br/perifericos/acessorios",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-17",
        "name": "Caixa de Som",
        "url": "https://www.pichau.com.br/perifericos/caixa-de-som",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-18",
        "name": "Teclado",
        "url": "https://www.pichau.com.br/perifericos/teclado",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-19",
        "name": "Fone de Ouvido",
        "url": "https://www.pichau.com.br/perifericos/fone-de-ouvido",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-20",
        "name": "Microfones",
        "url": "https://www.pichau.com.br/perifericos/microfones",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-21",
        "name": "Kit Teclado e Mouse",
        "url": "https://www.pichau.com.br/perifericos/kit-teclado-e-mouse",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-22",
        "name": "Kits Periféricos",
        "url": "https://www.pichau.com.br/perifericos/kit",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-23",
        "name": "Mouse",
        "url": "https://www.pichau.com.br/perifericos/mouse",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-24",
        "name": "Mousepad",
        "url": "https://www.pichau.com.br/perifericos/mousepad",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-25",
        "name": "Cabos e Adaptadores",
        "url": "https://www.pichau.com.br/perifericos/cabos-e-adaptadores",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-26",
        "name": "Impressoras",
        "url": "https://www.pichau.com.br/perifericos/impressoras",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-27",
        "name": "Armazenamento",
        "url": "https://www.pichau.com.br/perifericos/armazenamento",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-28",
        "name": "Energia",
        "url": "https://www.pichau.com.br/perifericos/energia",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-29",
        "name": "Webcam",
        "url": "https://www.pichau.com.br/perifericos/webcam",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-30",
        "name": "Pendrives",
        "url": "https://www.pichau.com.br/perifericos/pendrives",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-31",
        "name": "Mesa Digitalizadora",
        "url": "https://www.pichau.com.br/perifericos/mesa-digitalizadora",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-32",
        "name": "Simuladores",
        "url": "https://www.pichau.com.br/perifericos/simuladores",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-33",
        "name": "Óculos VR",
        "url": "https://www.pichau.com.br/perifericos/oculos",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-34",
        "name": "PC Gamer",
        "url": "https://www.pichau.com.br/computadores/pichau-gamer",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-35",
        "name": "PC Gamer Alta Performance",
        "url": "https://www.pichau.com.br/computadores/pc-gamer-alta-performance",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-36",
        "name": "Computadores Workstation",
        "url": "https://www.pichau.com.br/computadores/pichau-workstation",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-37",
        "name": "Computadores Casa e Escritório",
        "url": "https://www.pichau.com.br/computadores/pichau-home",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-38",
        "name": "Cadeiras Gamer",
        "url": "https://www.pichau.com.br/cadeiras/gamer",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-39",
        "name": "Poltronas",
        "url": "https://www.pichau.com.br/cadeiras/poltronas",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-40",
        "name": "Cadeiras Escritório",
        "url": "https://www.pichau.com.br/cadeiras/escritorio",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-41",
        "name": "Mesas Gamer",
        "url": "https://www.pichau.com.br/cadeiras/mesas-gamer",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-42",
        "name": "Mesas Escritório",
        "url": "https://www.pichau.com.br/cadeiras/mesas-escritorio",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-43",
        "name": "Acessórios para Cadeiras",
        "url": "https://www.pichau.com.br/cadeiras/acessorios-para-cadeiras",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-44",
        "name": "Notebook Gamer",
        "url": "https://www.pichau.com.br/notebooks/notebook-gamer",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-45",
        "name": "Notebooks",
        "url": "https://www.pichau.com.br/notebooks/notebooks",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-46",
        "name": "Refrigeração e Bases",
        "url": "https://www.pichau.com.br/notebooks/refrigerac-o-e-bases",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-47",
        "name": "Carregadores e Fontes",
        "url": "https://www.pichau.com.br/notebooks/carregadores-e-fontes",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-48",
        "name": "Tablets",
        "url": "https://www.pichau.com.br/notebooks/tablets-modelos-para-estudo-lazer-com-menor-preco",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-49",
        "name": "Consoles",
        "url": "https://www.pichau.com.br/video-games/consoles",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-50",
        "name": "Roteadores",
        "url": "https://www.pichau.com.br/redes-wireless/roteadores",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-51",
        "name": "Repetidor",
        "url": "https://www.pichau.com.br/redes-wireless/repetidor",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-52",
        "name": "Placas de Rede",
        "url": "https://www.pichau.com.br/redes-wireless/placas-de-rede",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-53",
        "name": "Adaptadores",
        "url": "https://www.pichau.com.br/redes-wireless/adaptadores",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-54",
        "name": "Cabos de Rede",
        "url": "https://www.pichau.com.br/redes-wireless/cabos-de-rede",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-55",
        "name": "Switches",
        "url": "https://www.pichau.com.br/redes-wireless/switches",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-56",
        "name": "Access Point",
        "url": "https://www.pichau.com.br/redes-wireless/access-point",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-57",
        "name": "Modem",
        "url": "https://www.pichau.com.br/redes-wireless/modem",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-58",
        "name": "Aspirador de Pó",
        "url": "https://www.pichau.com.br/casa-inteligente/aspirador-de-po",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-59",
        "name": "Assistente Virtual",
        "url": "https://www.pichau.com.br/casa-inteligente/assistente-virtual",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-60",
        "name": "Cameras",
        "url": "https://www.pichau.com.br/casa-inteligente/cameras",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-61",
        "name": "Campainha",
        "url": "https://www.pichau.com.br/casa-inteligente/campainha",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-62",
        "name": "Controle Smart",
        "url": "https://www.pichau.com.br/casa-inteligente/controle-smart",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-63",
        "name": "Interruptor",
        "url": "https://www.pichau.com.br/casa-inteligente/interruptor",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-64",
        "name": "Kits Smart Home",
        "url": "https://www.pichau.com.br/casa-inteligente/kits",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-65",
        "name": "Lampada LED",
        "url": "https://www.pichau.com.br/casa-inteligente/lampada-led",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-66",
        "name": "Pet Care",
        "url": "https://www.pichau.com.br/casa-inteligente/pet-care",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-67",
        "name": "Sensor",
        "url": "https://www.pichau.com.br/casa-inteligente/sensor",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-68",
        "name": "Tomada Inteligente",
        "url": "https://www.pichau.com.br/casa-inteligente/tomada-inteligente",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-69",
        "name": "Video Porteiro",
        "url": "https://www.pichau.com.br/casa-inteligente/video-porteiro",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-70",
        "name": "Fechadura Inteligente",
        "url": "https://www.pichau.com.br/casa-inteligente/fechadura-inteligente",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-71",
        "name": "Balança",
        "url": "https://www.pichau.com.br/casa-inteligente/balanca",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-72",
        "name": "Energia Solar",
        "url": "https://www.pichau.com.br/casa-inteligente/energia-solar",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-73",
        "name": "Controle de acesso e reconhecimento",
        "url": "https://www.pichau.com.br/casa-inteligente/controle-de-acesso-e-reconhecimento",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-74",
        "name": "Recipientes Térmicos",
        "url": "https://www.pichau.com.br/casa-e-lazer/recipientes-termicos",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-75",
        "name": "Veículos Motorizados",
        "url": "https://www.pichau.com.br/casa-e-lazer/veiculos-motorizados",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-76",
        "name": "Projetores",
        "url": "https://www.pichau.com.br/casa-e-lazer/projetores",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-77",
        "name": "Móveis",
        "url": "https://www.pichau.com.br/casa-e-lazer/moveis",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-78",
        "name": "Utilidades",
        "url": "https://www.pichau.com.br/casa-e-lazer/utilidades",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-79",
        "name": "Iluminação",
        "url": "https://www.pichau.com.br/casa-e-lazer/iluminac-o",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-80",
        "name": "Cartas Colecionáveis",
        "url": "https://www.pichau.com.br/casa-e-lazer/cartas-colecionaveis",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-81",
        "name": "Coleiras, Guias e Peitorais",
        "url": "https://www.pichau.com.br/pets/coleiras-guias-e-peitorais",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-82",
        "name": "Higiene e Limpeza",
        "url": "https://www.pichau.com.br/pets/higiene-e-limpeza",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      },
      {
        "id": "pichau-83",
        "name": "Acessórios para Alimentação",
        "url": "https://www.pichau.com.br/pets/acessorios-para-alimentac-o",
        "siteId": "pichau",
        "siteName": "Pichau",
        "domain": "pichau.com.br",
        "selected": false
      }
    ]
  },
  {
    "id": "renner",
    "name": "Lojas Renner",
    "domain": "lojasrenner.com.br",
    "url": "https://www.lojasrenner.com.br",
    "requiresLogin": false,
    "loginUrl": null,
    "categories": [
      {
        "id": "renner-1",
        "name": "Moda Feminina",
        "url": "https://www.lojasrenner.com.br/c/feminino/-/N-4zo6za?s_icid=230228_MENU_FEM_VERTUDO&sortBy=mostDiscount",
        "siteId": "renner",
        "siteName": "Lojas Renner",
        "domain": "lojasrenner.com.br",
        "selected": false
      },
      {
        "id": "renner-2",
        "name": "Moda Masculina",
        "url": "https://www.lojasrenner.com.br/c/masculino/-/N-1xeiyoy?s_icid=230228_MENU_MASC_GERAL&sortBy=mostDiscount",
        "siteId": "renner",
        "siteName": "Lojas Renner",
        "domain": "lojasrenner.com.br",
        "selected": false
      },
      {
        "id": "renner-3",
        "name": "Moda Infantil",
        "url": "https://www.lojasrenner.com.br/c/infantil/-/N-10xdweq?s_icid=230228_MENU_INF_GERAL&sortBy=mostDiscount",
        "siteId": "renner",
        "siteName": "Lojas Renner",
        "domain": "lojasrenner.com.br",
        "selected": false
      },
      {
        "id": "renner-4",
        "name": "Produtos de Beleza",
        "url": "https://www.lojasrenner.com.br/d/perfumaria-e-cosmeticos/-/N-y9o0ku?s_icid=241007_MENU_BEL_GERAL&sortBy=mostDiscount",
        "siteId": "renner",
        "siteName": "Lojas Renner",
        "domain": "lojasrenner.com.br",
        "selected": false
      },
      {
        "id": "renner-5",
        "name": "Roupa Basica",
        "url": "https://www.lojasrenner.com.br/lista/-/N-sjesl1?sortBy=mostDiscount",
        "siteId": "renner",
        "siteName": "Lojas Renner",
        "domain": "lojasrenner.com.br",
        "selected": false
      },
      {
        "id": "renner-7",
        "name": "Acessorios",
        "url": "https://www.lojasrenner.com.br/lista/bolsas-e-acessorios/-/N-16mv3qt?s_icid=230228_MENU_ACESSORIOS_GERAL&sortBy=mostDiscount",
        "siteId": "renner",
        "siteName": "Lojas Renner",
        "domain": "lojasrenner.com.br",
        "selected": false
      },
      {
        "id": "renner-8",
        "name": "Calçados",
        "url": "https://www.lojasrenner.com.br/lista/-/N-qjg8ik?sortBy=mostDiscount",
        "siteId": "renner",
        "siteName": "Lojas Renner",
        "domain": "lojasrenner.com.br",
        "selected": false
      },
      {
        "id": "renner-9",
        "name": "Espotivos",
        "url": "https://www.lojasrenner.com.br/lista/-/N-7kpw7w?sortBy=mostDiscount",
        "siteId": "renner",
        "siteName": "Lojas Renner",
        "domain": "lojasrenner.com.br",
        "selected": false
      },
      {
        "id": "renner-10",
        "name": "Moda Praia",
        "url": "https://www.lojasrenner.com.br/lst/-/N-8cpphn?sortBy=mostDiscount",
        "siteId": "renner",
        "siteName": "Lojas Renner",
        "domain": "lojasrenner.com.br",
        "selected": false
      },
      {
        "id": "renner-11",
        "name": "Moda Intima",
        "url": "https://www.lojasrenner.com.br/lista/-/N-1a0l30y?s_icid=230405_MENU_INTIMA_GERAL&sortBy=mostDiscount",
        "siteId": "renner",
        "siteName": "Lojas Renner",
        "domain": "lojasrenner.com.br",
        "selected": false
      },
      {
        "id": "renner-12",
        "name": "Multi Marcas",
        "url": "https://www.lojasrenner.com.br/lst/-/N-kk57ib?s_icid=231020_MENU_ALAMEDA_GERAL&sortBy=mostDiscount",
        "siteId": "renner",
        "siteName": "Lojas Renner",
        "domain": "lojasrenner.com.br",
        "selected": false
      },
      {
        "id": "renner-13",
        "name": "Ashua (Moda Plus Size)",
        "url": "https://www.lojasrenner.com.br/lst/-/N-1xvqrun?s_icid=240904_MENU_ASHUA_GERAL&sortBy=mostDiscount",
        "siteId": "renner",
        "siteName": "Lojas Renner",
        "domain": "lojasrenner.com.br",
        "selected": false
      }
    ]
  },
  {
    "id": "shein",
    "name": "Shein Brasil",
    "domain": "shein.com",
    "url": "https://br.shein.com",
    "requiresLogin": false,
    "loginUrl": null,
    "categories": [
      {
        "id": "shein-1",
        "name": "Roupas Femininas (Plus Size / Curve)",
        "url": "https://br.shein.com/Women-Plus-Clothing-c-1888.html",
        "siteId": "shein",
        "siteName": "Shein Brasil",
        "domain": "shein.com",
        "selected": false
      },
      {
        "id": "shein-2",
        "name": "Vestidos Plus Size",
        "url": "https://br.shein.com/Plus-Size-Dresses-c-1889.html",
        "siteId": "shein",
        "siteName": "Shein Brasil",
        "domain": "shein.com",
        "selected": false
      },
      {
        "id": "shein-3",
        "name": "Promoção Geral",
        "url": "https://br.shein.com/sale/All-Sale-sc-0051884505.html",
        "siteId": "shein",
        "siteName": "Shein Brasil",
        "domain": "shein.com",
        "selected": false
      },
      {
        "id": "shein-4",
        "name": "Roupas Masculinas",
        "url": "https://br.shein.com/RecommendSelection/Men-Clothing-sc-017172963.html",
        "siteId": "shein",
        "siteName": "Shein Brasil",
        "domain": "shein.com",
        "selected": false
      },
      {
        "id": "shein-5",
        "name": "Casa e Decoração",
        "url": "https://br.shein.com/RecommendSelection/Home-Kitchen-sc-017185546.html",
        "siteId": "shein",
        "siteName": "Shein Brasil",
        "domain": "shein.com",
        "selected": false
      }
    ]
  },
  {
    "id": "shopee",
    "name": "Shopee Brasil",
    "domain": "shopee.com.br",
    "url": "https://shopee.com.br",
    "requiresLogin": true,
    "loginUrl": "https://shopee.com.br/buyer/login",
    "categories": [
      {
        "id": "shopee-1",
        "name": "Roupas Femininas",
        "url": "https://shopee.com.br/Roupas-Femininas-cat.11059998?fe_filter_options=%5B%7B%22group_name%22%3A%22SERVICE_AND_PROMOTION%22%2C%22values%22%3A%5B%22WITH_DISCOUNT%22%5D%7D%5D&page=0&sortBy=pop",
        "siteId": "shopee",
        "siteName": "Shopee Brasil",
        "domain": "shopee.com.br",
        "selected": false
      },
      {
        "id": "shopee-2",
        "name": "Casa e Construção",
        "url": "https://shopee.com.br/Casa-e-Constru%C3%A7%C3%A3o-cat.11059983?fe_filter_options=%5B%7B%22group_name%22%3A%22SERVICE_AND_PROMOTION%22%2C%22values%22%3A%5B%22WITH_DISCOUNT%22%5D%7D%5D&page=0&sortBy=pop",
        "siteId": "shopee",
        "siteName": "Shopee Brasil",
        "domain": "shopee.com.br",
        "selected": false
      },
      {
        "id": "shopee-3",
        "name": "Roupas Plus Size",
        "url": "https://shopee.com.br/Roupas-Plus-Size-cat.11116689?fe_filter_options=%5B%7B%22group_name%22%3A%22SERVICE_AND_PROMOTION%22%2C%22values%22%3A%5B%22WITH_DISCOUNT%22%5D%7D%5D&page=0&sortBy=pop",
        "siteId": "shopee",
        "siteName": "Shopee Brasil",
        "domain": "shopee.com.br",
        "selected": false
      },
      {
        "id": "shopee-4",
        "name": "Beleza",
        "url": "https://shopee.com.br/Beleza-cat.11059974?fe_filter_options=%5B%7B%22group_name%22%3A%22SERVICE_AND_PROMOTION%22%2C%22values%22%3A%5B%22WITH_DISCOUNT%22%5D%7D%5D&page=0&sortBy=pop",
        "siteId": "shopee",
        "siteName": "Shopee Brasil",
        "domain": "shopee.com.br",
        "selected": false
      },
      {
        "id": "shopee-5",
        "name": "Roupas Masculinas",
        "url": "https://shopee.com.br/Roupas-Masculinas-cat.11059986?fe_filter_options=%5B%7B%22group_name%22%3A%22SERVICE_AND_PROMOTION%22%2C%22values%22%3A%5B%22WITH_DISCOUNT%22%5D%7D%5D&page=0&sortBy=pop",
        "siteId": "shopee",
        "siteName": "Shopee Brasil",
        "domain": "shopee.com.br",
        "selected": false
      },
      {
        "id": "shopee-6",
        "name": "Sapatos Femininos",
        "url": "https://shopee.com.br/Sapatos-Femininos-cat.11059999?fe_filter_options=%5B%7B%22group_name%22%3A%22SERVICE_AND_PROMOTION%22%2C%22values%22%3A%5B%22WITH_DISCOUNT%22%5D%7D%5D&page=0&sortBy=pop",
        "siteId": "shopee",
        "siteName": "Shopee Brasil",
        "domain": "shopee.com.br",
        "selected": false
      },
      {
        "id": "shopee-7",
        "name": "Sapatos Masculinos",
        "url": "https://shopee.com.br/Sapatos-Masculinos-cat.11059987?fe_filter_options=%5B%7B%22group_name%22%3A%22SERVICE_AND_PROMOTION%22%2C%22values%22%3A%5B%22WITH_DISCOUNT%22%5D%7D%5D&page=0&sortBy=pop",
        "siteId": "shopee",
        "siteName": "Shopee Brasil",
        "domain": "shopee.com.br",
        "selected": false
      },
      {
        "id": "shopee-8",
        "name": "Moda Infantil",
        "url": "https://shopee.com.br/Moda-Infantil-cat.11059973?fe_filter_options=%5B%7B%22group_name%22%3A%22SERVICE_AND_PROMOTION%22%2C%22values%22%3A%5B%22WITH_DISCOUNT%22%5D%7D%5D&page=0&sortBy=pop",
        "siteId": "shopee",
        "siteName": "Shopee Brasil",
        "domain": "shopee.com.br",
        "selected": false
      },
      {
        "id": "shopee-9",
        "name": "Acessórios de Moda",
        "url": "https://shopee.com.br/Acess%C3%B3rios-de-Moda-cat.11059978?fe_filter_options=%5B%7B%22group_name%22%3A%22SERVICE_AND_PROMOTION%22%2C%22values%22%3A%5B%22WITH_DISCOUNT%22%5D%7D%5D&page=0&sortBy=pop",
        "siteId": "shopee",
        "siteName": "Shopee Brasil",
        "domain": "shopee.com.br",
        "selected": false
      },
      {
        "id": "shopee-10",
        "name": "Relógios",
        "url": "https://shopee.com.br/Rel%C3%B3gios-cat.11059996?fe_filter_options=%5B%7B%22group_name%22%3A%22SERVICE_AND_PROMOTION%22%2C%22values%22%3A%5B%22WITH_DISCOUNT%22%5D%7D%5D&page=0&sortBy=pop",
        "siteId": "shopee",
        "siteName": "Shopee Brasil",
        "domain": "shopee.com.br",
        "selected": false
      },
      {
        "id": "shopee-11",
        "name": "Celulares e Dispositivos",
        "url": "https://shopee.com.br/Celulares-e-Dispositivos-cat.11059988?fe_filter_options=%5B%7B%22group_name%22%3A%22SERVICE_AND_PROMOTION%22%2C%22values%22%3A%5B%22WITH_DISCOUNT%22%5D%7D%5D&page=0&sortBy=pop",
        "siteId": "shopee",
        "siteName": "Shopee Brasil",
        "domain": "shopee.com.br",
        "selected": false
      },
      {
        "id": "shopee-12",
        "name": "Esportes e Lazer",
        "url": "https://shopee.com.br/Esportes-e-Lazer-cat.11059992?fe_filter_options=%5B%7B%22group_name%22%3A%22SERVICE_AND_PROMOTION%22%2C%22values%22%3A%5B%22WITH_DISCOUNT%22%5D%7D%5D&page=0&sortBy=pop",
        "siteId": "shopee",
        "siteName": "Shopee Brasil",
        "domain": "shopee.com.br",
        "selected": false
      },
      {
        "id": "shopee-13",
        "name": "Eletrodomésticos",
        "url": "https://shopee.com.br/Eletrodom%C3%A9sticos-cat.11059984?fe_filter_options=%5B%7B%22group_name%22%3A%22SERVICE_AND_PROMOTION%22%2C%22values%22%3A%5B%22WITH_DISCOUNT%22%5D%7D%5D&page=0&sortBy=pop",
        "siteId": "shopee",
        "siteName": "Shopee Brasil",
        "domain": "shopee.com.br",
        "selected": false
      },
      {
        "id": "shopee-14",
        "name": "Brinquedos e Hobbies",
        "url": "https://shopee.com.br/Brinquedos-e-Hobbies-cat.11059982?fe_filter_options=%5B%7B%22group_name%22%3A%22SERVICE_AND_PROMOTION%22%2C%22values%22%3A%5B%22WITH_DISCOUNT%22%5D%7D%5D&page=0&sortBy=pop",
        "siteId": "shopee",
        "siteName": "Shopee Brasil",
        "domain": "shopee.com.br",
        "selected": false
      },
      {
        "id": "shopee-15",
        "name": "Acessórios para Veículos",
        "url": "https://shopee.com.br/Acess%C3%B3rios-para-Ve%C3%ADculos-cat.11117089?fe_filter_options=%5B%7B%22group_name%22%3A%22SERVICE_AND_PROMOTION%22%2C%22values%22%3A%5B%22WITH_DISCOUNT%22%5D%7D%5D&page=0&sortBy=pop",
        "siteId": "shopee",
        "siteName": "Shopee Brasil",
        "domain": "shopee.com.br",
        "selected": false
      },
      {
        "id": "shopee-16",
        "name": "Saúde",
        "url": "https://shopee.com.br/Sa%C3%BAde-cat.11059981?fe_filter_options=%5B%7B%22group_name%22%3A%22SERVICE_AND_PROMOTION%22%2C%22values%22%3A%5B%22WITH_DISCOUNT%22%5D%7D%5D&page=0&sortBy=pop",
        "siteId": "shopee",
        "siteName": "Shopee Brasil",
        "domain": "shopee.com.br",
        "selected": false
      },
      {
        "id": "shopee-17",
        "name": "Motocicletas",
        "url": "https://shopee.com.br/Motocicletas-cat.11059990?fe_filter_options=%5B%7B%22group_name%22%3A%22SERVICE_AND_PROMOTION%22%2C%22values%22%3A%5B%22WITH_DISCOUNT%22%5D%7D%5D&page=0&sortBy=pop",
        "siteId": "shopee",
        "siteName": "Shopee Brasil",
        "domain": "shopee.com.br",
        "selected": false
      },
      {
        "id": "shopee-18",
        "name": "Áudio",
        "url": "https://shopee.com.br/%C3%81udio-cat.11059971?fe_filter_options=%5B%7B%22group_name%22%3A%22SERVICE_AND_PROMOTION%22%2C%22values%22%3A%5B%22WITH_DISCOUNT%22%5D%7D%5D&page=0&sortBy=pop",
        "siteId": "shopee",
        "siteName": "Shopee Brasil",
        "domain": "shopee.com.br",
        "selected": false
      },
      {
        "id": "shopee-19",
        "name": "Mãe e Bebê",
        "url": "https://shopee.com.br/M%C3%A3e-e-Beb%C3%AA-cat.11059989?fe_filter_options=%5B%7B%22group_name%22%3A%22SERVICE_AND_PROMOTION%22%2C%22values%22%3A%5B%22WITH_DISCOUNT%22%5D%7D%5D&page=0&sortBy=pop",
        "siteId": "shopee",
        "siteName": "Shopee Brasil",
        "domain": "shopee.com.br",
        "selected": false
      },
      {
        "id": "shopee-20",
        "name": "Bolsas Femininas",
        "url": "https://shopee.com.br/Bolsas-Femininas-cat.11059997?fe_filter_options=%5B%7B%22group_name%22%3A%22SERVICE_AND_PROMOTION%22%2C%22values%22%3A%5B%22WITH_DISCOUNT%22%5D%7D%5D&page=0&sortBy=pop",
        "siteId": "shopee",
        "siteName": "Shopee Brasil",
        "domain": "shopee.com.br",
        "selected": false
      },
      {
        "id": "shopee-21",
        "name": "Bolsas Masculinas",
        "url": "https://shopee.com.br/Bolsas-Masculinas-cat.11059985?fe_filter_options=%5B%7B%22group_name%22%3A%22SERVICE_AND_PROMOTION%22%2C%22values%22%3A%5B%22WITH_DISCOUNT%22%5D%7D%5D&page=0&sortBy=pop",
        "siteId": "shopee",
        "siteName": "Shopee Brasil",
        "domain": "shopee.com.br",
        "selected": false
      },
      {
        "id": "shopee-22",
        "name": "Animais Domésticos / Pets",
        "url": "https://shopee.com.br/Animais-Dom%C3%A9sticos-cat.11059991?fe_filter_options=%5B%7B%22group_name%22%3A%22SERVICE_AND_PROMOTION%22%2C%22values%22%3A%5B%22WITH_DISCOUNT%22%5D%7D%5D&page=0&sortBy=pop",
        "siteId": "shopee",
        "siteName": "Shopee Brasil",
        "domain": "shopee.com.br",
        "selected": false
      },
      {
        "id": "shopee-23",
        "name": "Papelaria",
        "url": "https://shopee.com.br/Papelaria-cat.11059993?fe_filter_options=%5B%7B%22group_name%22%3A%22SERVICE_AND_PROMOTION%22%2C%22values%22%3A%5B%22WITH_DISCOUNT%22%5D%7D%5D&page=0&sortBy=pop",
        "siteId": "shopee",
        "siteName": "Shopee Brasil",
        "domain": "shopee.com.br",
        "selected": false
      },
      {
        "id": "shopee-24",
        "name": "Computadores e Acessórios",
        "url": "https://shopee.com.br/Computadores-e-Acess%C3%B3rios-cat.11059977?fe_filter_options=%5B%7B%22group_name%22%3A%22SERVICE_AND_PROMOTION%22%2C%22values%22%3A%5B%22WITH_DISCOUNT%22%5D%7D%5D&page=0&sortBy=pop",
        "siteId": "shopee",
        "siteName": "Shopee Brasil",
        "domain": "shopee.com.br",
        "selected": false
      },
      {
        "id": "shopee-25",
        "name": "Alimentos e Bebidas",
        "url": "https://shopee.com.br/Alimentos-e-Bebidas-cat.11059979?fe_filter_options=%5B%7B%22group_name%22%3A%22SERVICE_AND_PROMOTION%22%2C%22values%22%3A%5B%22WITH_DISCOUNT%22%5D%7D%5D&page=0&sortBy=pop",
        "siteId": "shopee",
        "siteName": "Shopee Brasil",
        "domain": "shopee.com.br",
        "selected": false
      },
      {
        "id": "shopee-26",
        "name": "Jogos e Consoles",
        "url": "https://shopee.com.br/Jogos-e-Consoles-cat.11059980?fe_filter_options=%5B%7B%22group_name%22%3A%22SERVICE_AND_PROMOTION%22%2C%22values%22%3A%5B%22WITH_DISCOUNT%22%5D%7D%5D&page=0&sortBy=pop",
        "siteId": "shopee",
        "siteName": "Shopee Brasil",
        "domain": "shopee.com.br",
        "selected": false
      },
      {
        "id": "shopee-27",
        "name": "Câmeras e Drones",
        "url": "https://shopee.com.br/C%C3%A2meras-e-Drones-cat.11059976?fe_filter_options=%5B%7B%22group_name%22%3A%22SERVICE_AND_PROMOTION%22%2C%22values%22%3A%5B%22WITH_DISCOUNT%22%5D%7D%5D&page=0&sortBy=pop",
        "siteId": "shopee",
        "siteName": "Shopee Brasil",
        "domain": "shopee.com.br",
        "selected": false
      },
      {
        "id": "shopee-28",
        "name": "Viagens e Bagagens",
        "url": "https://shopee.com.br/Viagens-e-Bagagens-cat.11059995?fe_filter_options=%5B%7B%22group_name%22%3A%22SERVICE_AND_PROMOTION%22%2C%22values%22%3A%5B%22WITH_DISCOUNT%22%5D%7D%5D&page=0&sortBy=pop",
        "siteId": "shopee",
        "siteName": "Shopee Brasil",
        "domain": "shopee.com.br",
        "selected": false
      },
      {
        "id": "shopee-29",
        "name": "Livros e Revistas",
        "url": "https://shopee.com.br/Livros-e-Revistas-cat.11059975?fe_filter_options=%5B%7B%22group_name%22%3A%22SERVICE_AND_PROMOTION%22%2C%22values%22%3A%5B%22WITH_DISCOUNT%22%5D%7D%5D&page=0&sortBy=pop",
        "siteId": "shopee",
        "siteName": "Shopee Brasil",
        "domain": "shopee.com.br",
        "selected": false
      }
    ]
  }
];

if (typeof module !== "undefined") {
  module.exports = { BUILTIN_CATALOG };
}
