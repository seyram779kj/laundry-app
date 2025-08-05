
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

const startMongoDB = async () => {
  try {
    console.log('Starting MongoDB Memory Server...');
    
    // Stop any existing instance first
    if (mongod) {
      await mongod.stop();
      mongod = null;
    }
    
    mongod = await MongoMemoryServer.create({
      instance: {
        port: 27018, // Use a different port to avoid conflicts
        dbName: 'laundry-app'
      }
    });
    
    const uri = mongod.getUri();
    console.log('MongoDB Memory Server started at:', uri);
    return uri;
  } catch (error) {
    console.error('Failed to start MongoDB Memory Server:', error);
    // If port 27018 fails, try with auto-assigned port
    try {
      console.log('Retrying with auto-assigned port...');
      mongod = await MongoMemoryServer.create({
        instance: {
          dbName: 'laundry-app'
        }
      });
      const uri = mongod.getUri();
      console.log('MongoDB Memory Server started at:', uri);
      return uri;
    } catch (retryError) {
      console.error('Failed to start MongoDB Memory Server on retry:', retryError);
      throw retryError;
    }
  }
};

const stopMongoDB = async () => {
  if (mongod) {
    await mongod.stop();
    console.log('MongoDB Memory Server stopped');
  }
};

module.exports = { startMongoDB, stopMongoDB };
