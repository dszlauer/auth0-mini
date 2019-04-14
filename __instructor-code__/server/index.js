const express = require("express");
const bodyPaser = require("body-parser");
const session = require("express-session");
const massive = require("massive");
const axios = require("axios");

require("dotenv").config();
massive(process.env.CONNECTION_STRING).then(db => app.set("db", db));

const app = express();
app.use(bodyPaser.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false
  })
);
app.use(express.static(`${__dirname}/../build`));

app.get("/auth/callback", (req, res) => {
  // STEP 1.
  // Make an object called payload with the code recieved from the clientside, client_id, client_secret, grant_type, redirect_uri
  // Hint: 'code' is recieved from client side as a query

  const payload = {
    client_id: process.env.REACT_APP_AUTH0_CLIENT_ID,
    client_secret: process.env.AUTH0_CLIENT_SECRET,
    grant_type: "authorization_code",
    code: req.query.code,
    redirect_uri: `http://${req.headers.host}/auth/callback`
  };

  // STEP 2.
  // Write a function that returns an axios POST with the payload as the body.
  function tradeCodeForAccessToken() {
    return axios.post(
      `https://${process.env.REACT_APP_AUTH0_DOMAIN}/oauth/token`,
      payload
    );
  }

  // STEP 3.
  // Write a function that accepts the access token as a parameter and returns an axios GET to Auth0 that passes the access token as a query.
  function tradeAccessTokenForUserInfo(response) {
    const accessToken = response.data.access_token;
    return axios.get(
      `https://${
        process.env.REACT_APP_AUTH0_DOMAIN
      }/userinfo/?access_token=${accessToken}`
    );
  }

  // STEP 4.
  // Write a function that accepts the userInfo as a parameter and returns a block of code.
  // Your code should set session, check your database to see if user exists and return their info or if they don't exist, insert them into the database.
  function storeUserInfoInDataBase(userInfoResponse) {
    console.log(userInfoResponse.data);
  }

  // Final code; uncomment after completing steps 1-4 above.

  tradeCodeForAccessToken()
    .then(accessToken => tradeAccessTokenForUserInfo(accessToken))
    .then(userInfo => storeUserInfoInDataBase(userInfo));
});

app.post("/api/logout", (req, res) => {
  req.session.destroy();
  res.send();
});

app.get("/api/user-data", (req, res) => {
  res.json({ user: req.session.user });
});

function checkLoggedIn(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.status(403).json({ message: "Unauthorized" });
  }
}

app.get("/api/secure-data", checkLoggedIn, (req, res) => {
  res.json({ someSecureData: 123 });
});

const SERVER_PORT = process.env.SERVER_PORT || 3040;
app.listen(SERVER_PORT, () => {
  console.log("Server listening on port " + SERVER_PORT);
});
