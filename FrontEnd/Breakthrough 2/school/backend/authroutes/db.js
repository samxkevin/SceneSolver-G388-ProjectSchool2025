const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017/Scenesolver'; // Replace with your MongoDB connection URI and database name
const client = new MongoClient(uri);

async function connect() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    return client.db(); // Return the database object
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

module.exports = { connect };