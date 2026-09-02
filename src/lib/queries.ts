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
