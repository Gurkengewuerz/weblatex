const passport = require("passport");
const { validationResult } = require("express-validator");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const db = require("../database");
const { hashPassword, generateJWT } = require("../models/user");

module.exports.signUp = (req, res) => {
  if (validationResult(req).array().length > 0) return res.sendStatus(400);

  try {
    const user = db.get("user").find({ username: req.body.username }).value();

    if (user)
      return res
        .status(409)
        .send(`Username ${req.body.username} already exists`);

    const salt = crypto.randomBytes(16).toString("hex");
    const newUser = {
      _id: uuidv4(),
      username: req.body.username,
      salt,
      hash: hashPassword(req.body.password, salt),
    };

    db.get("user").push(newUser).write();

    res.json({ token: generateJWT(newUser) });
  } catch (err) {
    res.sendStatus(500);
  }
};

module.exports.signIn = (req, res) => {
  if (validationResult(req).array().length > 0) return res.sendStatus(400);

  passport.authenticate("local", (err, user, info) => {
    if (err) return res.status(500).send(err);
    if (!user) return res.status(401).send(info);

    res.json({ token: generateJWT(user) });
  })(req, res);
};
