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
