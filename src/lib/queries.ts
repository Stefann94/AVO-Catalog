export const GET_ALL_PRODUCTS_QUERY = `
  query GetAllProducts {
    products(first: 50) {
      nodes {
        id
        databaseId
        name
        slug
        type
        ... on SimpleProduct {
          price
          regularPrice
        }
        productCategories {
          nodes {
            name
            slug
          }
        }
        image {
          sourceUrl
          altText
        }
      }
    }
  }
`;

export const GET_CATEGORIES_QUERY = `
  query GetCategories {
    productCategories(first: 100) {
      nodes {
        name
        slug
        count
      }
    }
  }
`;

export const GET_CATEGORY_PAGE_QUERY = `
  query GetCategoryPage($slug: ID!, $categorySlug: String!) {
    productCategory(id: $slug, idType: SLUG) {
      name
      slug
      description
      count
    }
    products(first: 48, where: { category: $categorySlug }) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        name
        slug
        ... on SimpleProduct {
          sku
          price
          stockStatus
        }
        image {
          sourceUrl
          altText
        }
      }
    }
  }
`;

/**
 * Categoriile de nivel 1, pentru „Gama de produse".
 *
 * `where: { parent: 0 }` întoarce doar nivelul 1 — fără el ar veni și cele 19
 * subcategorii, iar secțiunea ar avea 27 de carduri.
 *
 * DE CE SE CER ȘI COPIII. `count` numără doar produsele puse DIRECT pe termen,
 * iar importul le pune pe cele mai multe în subcategorii. Verificat pe magazinul
 * real: „Invertoare" are `count: null`, iar cele 35 de produse stau în „Hibride
 * Trifazate", „Hibride Monofazate", „On-Grid" și „Off-Grid". Numărul de pe card
 * e suma dintre categorie și copiii ei.
 *
 * `menuOrder` e ordinea din WooCommerce. Ordinea cardurilor e o decizie
 * editorială — panourile primele, fiindcă de acolo începe orice sistem — și e
 * bine să poată fi schimbată din administrare, nu din cod.
 *
 * `description` și `image` sunt goale până le completează cineva în WooCommerce.
 * Componenta are rezervă pentru amândouă, deci secțiunea arată întreagă și
 * înainte, și după.
 */
export const GET_CATEGORII_GAMA_QUERY = `
  query GetCategoriiGama {
    productCategories(first: 20, where: { parent: 0, hideEmpty: true }) {
      nodes {
        name
        slug
        count
        description
        menuOrder
        image {
          sourceUrl
          altText
        }
        children(first: 30) {
          nodes {
            name
            slug
            count
          }
        }
      }
    }
  }
`;

/**
 * Prețul de pornire al fiecărei categorii, într-o singură cerere.
 *
 * Se construiește dinamic fiindcă GraphQL n-are „grupează după categorie": se
 * cere aceeași interogare de câte ori e nevoie, sub alias diferit. Patru
 * categorii înseamnă un drum până la WordPress, nu patru.
 *
 * DE CE PRIMELE CINCI, NU PRIMUL. Cel mai ieftin produs nu e întotdeauna o
 * ancoră cinstită. La „Stocare Energie", primul e o bază cu cabluri de 60 €,
 * dintr-o subcategorie de accesorii; bateria reală începe la 395 €. Se cer mai
 * multe și se alege primul care chiar reprezintă categoria — vezi lib/gama.ts.
 *
 * Aliasurile sunt curățate de tot ce nu e literă sau cifră: GraphQL nu acceptă
 * cratime în nume, iar slug-urile sunt pline de ele.
 */
export function construiestePreturiQuery(slugs: string[]): string {
  const campuri = slugs
    .map((slug, i) => {
      const alias = `c${i}`;
      return `    ${alias}: products(
      first: 5
      where: { category: "${slug}", orderby: { field: PRICE, order: ASC } }
    ) {
      nodes {
        ... on SimpleProduct { price(format: RAW) }
        productCategories(first: 3) { nodes { slug } }
        dateCatalog { unitatePret }
      }
    }`;
    })
    .join("\n");

  return `query GetPreturiCategorii {\n${campuri}\n}`;
}

/**
 * Ofertele lunii — produsele de pe coperta catalogului.
 *
 * `featured: true` e chiar coloana `Is featured?` din CSV-ul de import:
 * `marcheazaOferte()` pune 1 pe produsele al căror cod de model apare în textul
 * copertei (tools/catalog-import/parse-catalog.js). Deci filtrul nu e o alegere
 * editorială făcută în WooCommerce, ci pagina „OFERTELE LUNII" a furnizorului.
 *
 * `price(format: RAW)` întoarce numărul, nu „65,00 €" formatat de WooCommerce.
 * Formatarea o face front-end-ul, care știe și moneda, și locale-ul.
 *
 * FORMA CERUTĂ DE SCHEMĂ, verificată pe magazinul real — nu e evidentă:
 *
 *   `attributes` NU există pe interfața `Product`, doar pe tipurile concrete,
 *   deci stă în fragmentul `... on SimpleProduct`. Fără el, întreaga
 *   interogare pică cu „Cannot query field attributes on type Product".
 *
 *   `options` întoarce SLUG-uri („growatt", „lichidare-stoc", „15-30-kwh"),
 *   nu ce vede omul. Eticheta se ia din `terms`, care la rândul lui există
 *   doar pe `GlobalProductAttribute` — atributele din import sunt globale
 *   (coloana `Attribute N global = 1` din CSV).
 *
 *   Produsele stau DOAR în subcategorie, nu și în părinte: un acumulator e în
 *   „acumulatori-low-voltage", nu și în „stocare-energie". Cardul are nevoie de
 *   categoria de nivel 1 pentru link, de aceea se cere și `parent`.
 *
 * `first: 1` la `terms` fiindcă atributele din catalog au o singură valoare pe
 * produs — un panou are o singură putere, nu o listă.
 *
 * `dateCatalog` vine din extensia noastră (tools/wordpress), nu din WooGraphQL.
 * Cât timp plugin-ul nu e actualizat la 1.2.0, interogarea întoarce eroarea
 * „Cannot query field", `fetchGraphQL` cu `optional: true` răspunde null, iar
 * secțiunea cade pe lista scrisă în cod. De-aia se cere separat de restul.
 *
 * `first: 8` fiindcă pe coperta din septembrie sunt patru produse, iar grila are
 * patru coloane. Opt lasă loc pentru o lună mai generoasă, fără să rupă rândul.
 *
 * ORDINEA. `DATE ASC`, nu implicitul. WooCommerce întoarce implicit cele mai
 * noi produse întâi, iar importul le scrie în ordinea din CSV — deci implicitul
 * dă exact catalogul pe dos. Concret, în septembrie: lichidarea Growatt ajungea
 * primul card, iar panoul Canadian de 65 € ultimul, adică produsul cel mai
 * accesibil în colțul cel mai puțin citit.
 *
 * `DATE ASC` restituie ordinea din catalog, care e și cea editorială: panouri,
 * apoi acumulatori, apoi ce se lichidează. Se sprijină pe faptul că importul
 * scrie produsele în ordinea rândurilor din CSV; dacă vreodată n-o mai face,
 * consecința e doar o ordine diferită pe patru carduri, nu date greșite.
 */
export const GET_OFERTE_QUERY = `
  query GetOferteLunii {
    products(
      first: 8
      where: { featured: true, orderby: { field: DATE, order: ASC } }
    ) {
      nodes {
        id
        name
        slug
        productCategories(first: 3) {
          nodes {
            slug
            parent {
              node {
                slug
              }
            }
          }
        }
        ... on SimpleProduct {
          sku
          price(format: RAW)
          attributes {
            nodes {
              name
              ... on GlobalProductAttribute {
                terms(first: 1) {
                  nodes {
                    name
                  }
                }
              }
            }
          }
        }
        dateCatalog {
          pretVolum
          pragVolum
          unitatePret
          capacitateKwh
        }
      }
    }
  }
`;

/**
 * Perioada de valabilitate a catalogului curent.
 *
 * Câmpul `perioadaCatalog` nu face parte din WooGraphQL: e adăugat de extensia
 * din `tools/wordpress/avo-perioada-catalog.php`, care citește meta scrisă de
 * importator pe produse și îl expune o singură dată, la rădăcina schemei.
 *
 * Cât timp extensia nu e instalată, interogarea întoarce eroare „Cannot query
 * field", `fetchGraphQL` răspunde `null`, iar pagina cade pe perioada de
 * rezervă din cod. Motiv pentru care se cere separat, într-o interogare proprie:
 * o eroare aici nu trebuie să dărâme și restul datelor din pagină.
 */
export const GET_PERIOADA_CATALOG_QUERY = `
  query GetPerioadaCatalog {
    perioadaCatalog {
      eticheta
      valabilDe
      valabilPana
      sursaCatalog
    }
  }
`;

/**
 * Fișa unui produs.
 *
 * `featured` e ce alimentează badge-ul „Ofertă specială": importatorul îl pune
 * citind pagina de oferte de pe coperta catalogului, deci nu trebuie bifat de
 * nimeni. `productTags` sunt statuturile puse de mână în WooCommerce, care
 * supraviețuiesc reimportului lunar fiindcă importatorul nu scrie coloana lor.
 *
 * `description` și `shortDescription` sunt goale pe tot catalogul — PDF-ul e o
 * listă de prețuri, nu o fișă tehnică. Se cer oricând vor fi completate; pagina
 * le afișează doar dacă există.
 *
 * `attributes` stă în fragment pe `SimpleProduct`: pe interfața `Product` nu
 * există. `terms` cere la rândul lui `GlobalProductAttribute` — atributele din
 * import sunt globale, iar `options` ar da slug-uri, nu etichete.
 */
export const GET_PRODUS_QUERY = `
  query GetProdus($slug: ID!) {
    product(id: $slug, idType: SLUG) {
      name
      slug
      description
      shortDescription
      ... on SimpleProduct {
        sku
        price(format: RAW)
        stockStatus
        featured
        attributes {
          nodes {
            name
            ... on GlobalProductAttribute {
              label
              terms(first: 1) {
                nodes {
                  name
                }
              }
            }
          }
        }
      }
      productCategories(first: 3) {
        nodes {
          name
          slug
          parent {
            node {
              name
              slug
            }
          }
        }
      }
      productTags(first: 6) {
        nodes {
          name
          slug
        }
      }
      dateCatalog {
        pretVolum
        pragVolum
        unitatePret
        pretContainer
        capacitateKwh
        sursaCatalog
      }
    }
  }
`;

/**
 * Slug-urile tuturor produselor, pentru prerandare.
 *
 * SE CERE ÎN PAGINI, nu dintr-o dată. WPGraphQL plafonează orice conexiune la
 * 100 de noduri, indiferent ce ceri: un `first: 200` întoarce tot 100, tăcut.
 * Prima încercare a prerandat exact 100 din cele 172 de produse, iar celelalte
 * 72 ar fi ajuns să se randeze la cerere — prima vizită pe ele ar fi așteptat
 * răspunsul WordPress-ului.
 *
 * `after` continuă de unde s-a oprit; bucla din lib/produs.ts se oprește când
 * `hasNextPage` devine fals.
 */
export const GET_SLUGURI_PRODUSE_QUERY = `
  query GetSluguriProduse($after: String) {
    products(first: 100, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        slug
      }
    }
  }
`;

/**
 * TOATE produsele, cu tot ce-i trebuie fișei, în pagini de 50.
 *
 * ─── DE CE NU UNA PE PAGINĂ ───────────────────────────────────────────────
 *
 * Prima versiune cerea fiecare produs separat, la randarea fișei lui. La build
 * asta însemna 172 de cereri, pornite de 9 lucrători în paralel, în câteva
 * zeci de secunde. Găzduirea WordPress a cedat: zeci de răspunsuri 500, iar
 * fișele afectate au ajuns scrise în build ca pagini de 404 — 88 din 172 la o
 * rulare. Produse reale, dispărute de pe site până la următorul deploy.
 *
 * Reîncercările singure n-au rezolvat, fiindcă serverul nu pica o clipă, ci
 * rămânea saturat cât ținea build-ul. Soluția e să nu-l mai saturăm.
 *
 * Aduse odată și ținute într-o hartă (vezi lib/produs.ts), cele 172 de produse
 * costă 4 cereri per lucrător în loc de 172 în total.
 *
 * `first: 50`, nu 100: interogarea cere atribute, categorii, etichete și meta
 * pentru fiecare produs, iar la 100 răspunsul devine destul de greu încât să
 * fie el însuși un motiv de 500.
 */
export const GET_PRODUSE_TOATE_QUERY = `
  query GetProduseToate($after: String) {
    products(first: 50, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        name
        slug
        description
        shortDescription
        ... on SimpleProduct {
          sku
          price(format: RAW)
          stockStatus
          featured
          attributes {
            nodes {
              name
              ... on GlobalProductAttribute {
                label
                terms(first: 1) {
                  nodes {
                    name
                  }
                }
              }
            }
          }
        }
        productCategories(first: 3) {
          nodes {
            name
            slug
            parent {
              node {
                name
                slug
              }
            }
          }
        }
        productTags(first: 6) {
          nodes {
            name
            slug
          }
        }
        dateCatalog {
          pretVolum
          pragVolum
          unitatePret
          pretContainer
          capacitateKwh
          sursaCatalog
        }
      }
    }
  }
`;
