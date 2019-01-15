import path from 'path';
import { mergeTypes, fileLoader, mergeResolvers } from 'merge-graphql-schemas';

const resolversArray = fileLoader(path.join(__dirname, './resolvers'), {
  extensions: ['.js'],
});

const typearray = fileLoader(path.join(__dirname, './schema'), {
  extensions: ['.gql'],
  recursive: true,
});

export const typeDefs = mergeTypes(typearray);

export const resolvers = mergeResolvers(resolversArray);
