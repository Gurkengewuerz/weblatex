const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const hashPassword = (password, salt) => {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
};

const isValidPassword = (hashedPassword, password, salt) => {
  return hashedPassword == hashPassword(password, salt);
};

const generateJWT = (user) => {
  let expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);

  return jwt.sign(
    {
      _id: user._id,
      username: user.username,
      exp: parseInt(expiry.getTime() / 1000),
    },
    process.env.JWT_SECRET
  );
};

module.exports = {
  hashPassword,
  isValidPassword,
  generateJWT,
};