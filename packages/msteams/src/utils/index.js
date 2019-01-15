export * from './server';
export * from './logger';

export const ensureArray = (arr) => {
  if (Array.isArray(arr)) {
    return arr;
  }
  if (typeof arr !== 'undefined') {
    return [arr];
  }
  return [];
};
