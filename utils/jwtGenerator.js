const jwt = require('jsonwebtoken');
require('dotenv').config();

function jwtGen(id) {
  const payload = {
    user: id,
  };

  return jwt.sign(payload, process.env.JWT_TOKEN, { expiresIn: 3600000 });
}

module.exports = jwtGen;
