import { ApolloClient } from 'apollo-client';
import { HttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';

export default new ApolloClient({
  link: new HttpLink({
    uri: process.env.REACT_APP_GRAPHQL,
    credentials: process.env.REACT_APP_CREDENTIALS,
  }),
  cache: new InMemoryCache(),
});
