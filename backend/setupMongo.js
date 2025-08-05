
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

const startMongoDB = async () => {
  try {
    console.log('Starting MongoDB Memory Server...');
    mongod = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbName: 'laundry-app'
      }
    });
    
    const uri = mongod.getUri();
    console.log('MongoDB Memory Server started at:', uri);
    return uri;
  } catch (error) {
    console.error('Failed to start MongoDB Memory Server:', error);
    throw error;
  }
};

const stopMongoDB = async () => {
  if (mongod) {
    await mongod.stop();
    console.log('MongoDB Memory Server stopped');
  }
};

module.exports = { startMongoDB, stopMongoDB };
