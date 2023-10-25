"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");


/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
  // headers section: authorization : tokentokentoken
  const authHeader = req.headers?.authorization;
  console.log();
  console.log('USER=', res.locals.user);
  if (authHeader) {
    const token = authHeader.replace(/^[Bb]earer /, "").trim();

    try {
      res.locals.user = jwt.verify(token, SECRET_KEY);
      console.log("in login, res locals user", res.locals.user);
      // return next();
    } catch (err) {
      /* ignore invalid tokens (but don't store user!) */
      console.log('in login catch');
      // return next();
    }
  }
  return next();

}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
  console.log("in ensure login res locals user", res.locals.user);
  if (res.locals.user?.username) return next();
  throw new UnauthorizedError();
}


module.exports = {
  authenticateJWT,
  ensureLoggedIn,
};
