const mongoose = require('mongoose');
require('dotenv').config();
const mongoURI = `mongodb://${process.env.MONGOUSER}:${process.env.MONGOPASS}@${process.env.MONGOURL}:${process.env.MONGOPORT}/?ssl=${process.env.MONGOSSL}&replicaSet=${process.env.MONGOSET}&authSource=${process.env.MONGOAUTH}&retryWrites=true&w=majority`;

const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI);

    console.log('MongoDB Connected...');
  } catch (err) {
    console.error(err.message);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
