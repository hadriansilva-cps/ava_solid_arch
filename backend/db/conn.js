const mongoose = require('mongoose');
require('dotenv').config();

async function main() {
  try {
    const mongoUri = "mongodb://127.0.0.1:27017/ava_solid_arch";

    await mongoose.connect(mongoUri);

    console.log('MongoDB conectado com sucesso!');
  } catch (error) {
    console.log('Erro ao conectar MongoDB:', error);
  }
}

main();

module.exports = mongoose;
