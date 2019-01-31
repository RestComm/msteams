import { CouchDatabase } from '../../../models';

const db = new CouchDatabase().useDb();

export const saveUserAddressToDb = async (session, phoneNumber) => {
  if (!phoneNumber) {
    throw new Error('No phone number provided');
  }
  try {
    const { address } = session.message;
    const { id } = address.user;
    const doc = { address, phoneNumber };
    await db.insert(doc, id);
  } catch (error) {
    throw error;
  }
};

export const getUserAddressFromDb = async (session) => {
  const { address } = session.message;
  const { id } = address.user;
  if (!id) {
    throw new Error('Unknow user');
  }
  try {
    return await db.get(id);
  } catch (error) {
    return null;
  }
};
