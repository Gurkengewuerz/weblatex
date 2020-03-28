let passport = require("passport");
let { validationResult } = require("express-validator");
let mongoose = require("mongoose");
let User = mongoose.model("User");

module.exports.signUp = (req, res) => {
  if (validationResult(req).array().length > 0) return res.sendStatus(400);

  User.findOne({ username: req.body.username })
    .then(user => {
      if (user)
        return res
          .status(409)
          .send(`Username ${req.body.username} already exists`);

      let newUser = new User();
      newUser.username = req.body.username;
      newUser.setPassword(req.body.password);

      newUser.save(err => res.json({ token: newUser.generateJWT() }));
    })
    .catch(err => res.sendStatus(500));
};

module.exports.signIn = (req, res) => {
  if (validationResult(req).array().length > 0) return res.sendStatus(400);

  passport.authenticate("local", (err, user, info) => {
    if (err) return res.status(404).send(err);
    if (!user) return res.status(401).send(info);

    res.json({ token: user.generateJWT() });
  })(req, res);
};
