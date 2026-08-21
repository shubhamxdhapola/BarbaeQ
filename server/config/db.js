import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    console.log(`MongoDB Connected`);

    // Drop legacy indexes that conflict with multi-shop barbers and unique phone
    try {
      const usersCollection = conn.connection.collection('users');
      const userIndexes = await usersCollection.indexes();
      for (const idx of userIndexes) {
        if (idx.name === 'email_1_role_1' || idx.name === 'phone_1_role_1') {
          await usersCollection.dropIndex(idx.name);
          console.log(`✅ Dropped legacy index: ${idx.name}`);
        }
      }

      const barbersCollection = conn.connection.collection('barbers');
      const barberIndexes = await barbersCollection.indexes();
      for (const idx of barberIndexes) {
        if (idx.name === 'userId_1_shopId_1' || (idx.name === 'userId_1' && !idx.partialFilterExpression)) {
          await barbersCollection.dropIndex(idx.name);
          console.log(`✅ Dropped index for partial rebuild: ${idx.name}`);
        }
      }
      await barbersCollection.createIndex(
        { userId: 1 }, 
        { unique: true, partialFilterExpression: { isDeleted: false } }
      );
    } catch (indexErr) {
      // Ignore index drop errors if index doesn't exist
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};
