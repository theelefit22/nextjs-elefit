import { GraphQLClient, gql } from 'graphql-request';

const SHOPIFY_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN || '840a56-3.myshopify.com';
const SHOPIFY_ACCESS_TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN || '3476fc91bc4860c5b02aea3983766cb1';
const STOREFRONT_API_URL = `https://${SHOPIFY_DOMAIN}/api/2023-07/graphql.json`;

const shopifyClient = new GraphQLClient(STOREFRONT_API_URL, {
    headers: {
        'X-Shopify-Storefront-Access-Token': SHOPIFY_ACCESS_TOKEN,
    },
});

/**
 * Authenticate customer with Shopify and return access token
 */
export const loginShopifyCustomer = async (email: string, password: string) => {
    const mutation = gql`
    mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
      customerAccessTokenCreate(input: $input) {
        customerAccessToken {
          accessToken
          expiresAt
        }
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `;

    const variables = {
        input: { email, password },
    };

    try {
        const data: any = await shopifyClient.request(mutation, variables);
        const { customerAccessTokenCreate } = data;

        if (customerAccessTokenCreate.customerUserErrors.length > 0) {
            const error = customerAccessTokenCreate.customerUserErrors[0];
            if (error.code === 'UNIDENTIFIED_CUSTOMER') {
                throw new Error('Email or password is incorrect');
            }
            throw new Error(error.message || 'Login failed');
        }

        return customerAccessTokenCreate.customerAccessToken.accessToken;
    } catch (error: any) {
        console.error('Shopify login error:', error);
        throw error;
    }
};

/**
 * Get customer details using access token
 */
export const getCustomerByToken = async (accessToken: string) => {
    const query = gql`
    query getCustomer($customerAccessToken: String!) {
      customer(customerAccessToken: $customerAccessToken) {
        id
        email
        firstName
        lastName
        displayName
      }
    }
  `;

    const variables = { customerAccessToken: accessToken };

    try {
        const data: any = await shopifyClient.request(query, variables);
        if (!data.customer) {
            throw new Error('Customer not found');
        }
        return data.customer;
    } catch (error: any) {
        console.error('Shopify get customer error:', error);
        throw error;
    }
};

/**
 * Check if a customer exists in Shopify by email
 * (Uses a dummy login attempt to check for UNIDENTIFIED_CUSTOMER error)
 */
export const checkShopifyCustomerExists = async (email: string) => {
    const mutation = gql`
    mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
      customerAccessTokenCreate(input: $input) {
        customerUserErrors {
          code
          message
        }
      }
    }
  `;

    const variables = {
        input: {
            email,
            password: 'ThisIsADummyPassword123!',
        },
    };

    try {
        const data: any = await shopifyClient.request(mutation, variables);
        const errors = data.customerAccessTokenCreate.customerUserErrors;

        // If error is UNIDENTIFIED_CUSTOMER, user likely doesn't exist
        const hasUnidentifiedError = errors.some((e: any) => e.code === 'UNIDENTIFIED_CUSTOMER');
        return !hasUnidentifiedError;
    } catch (error) {
        console.error('Shopify existence check error:', error);
        return false;
    }
};
