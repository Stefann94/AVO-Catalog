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
