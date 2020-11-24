const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const db = require("../database");
const { isValidPassword } = require("../models/user");

passport.use(
  new LocalStrategy({}, (username, password, done) => {
    try {
      const user = db.get("user").find({ username: username }).value();

      if (!user) return done(null, false, "User was not found");
      if (!isValidPassword(user.hash, password, user.salt))
        return done(null, false, "Password was incorrect");

      return done(null, user);
    } catch (error) {
      done(err);
    }
  })
);
