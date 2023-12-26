const express = require("express");
const mysql = require("mysql2");
const ex_jwt = require("express-jwt");
const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");

require("dotenv").config();

const router = express.Router();
const app = express();
const jwtVerify = ex_jwt.expressjwt;

const JWT_PUB = fs.readFileSync("./jwtRS256.key.pub");
const JWT_PRI = fs.readFileSync("./jwtRS256.key");

app.use(router);
let relativePath = "../frontend/img";
let absolutePath = path.resolve(relativePath);
app.use(express.static(absolutePath)); // point to `img` folder
relativePath = "../frontend";
absolutePath = path.resolve(relativePath);
app.use(express.static(absolutePath));

router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(cookieParser());
router.use(cors());

const connection = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});

connection.connect((err) => {
  if (err) throw err;
  console.log("Connected to DB: " + process.env.MYSQL_DATABASE);
});

router.get("/", (req, res) => {
  let relativePath = "../frontend/index.html";
  let absolutePath = path.resolve(relativePath);
  console.log(`\nrequested: '${req.originalUrl}'`);
  res.sendFile(absolutePath);
});

router.get("/about-us", (req, res) => {
  let relativePath = "../frontend/aboutUs.html";
  let absolutePath = path.resolve(relativePath);
  console.log(`\nrequested: '${req.originalUrl}'`);
  res.sendFile(absolutePath);
});

router.get("/search", (req, res) => {
  let relativePath = "../frontend/search.html";
  let absolutePath = path.resolve(relativePath);
  console.log(`\nrequested: '${req.originalUrl}'`);
  res.sendFile(absolutePath);
});

router.get("/login", (req, res) => {
  let relativePath = "../frontend/login.html";
  let absolutePath = path.resolve(relativePath);
  console.log(`\nrequested: '${req.originalUrl}'`);
  res.sendFile(absolutePath);
});

router.get("/logout", (req, res) => {
  console.log(`\nrequested: '${req.originalUrl}'`);
  res.redirect("/authen-operation");
});

router.get("/account-management", (req, res) => {
  console.log(`\nrequested: '${req.originalUrl}'`);

  if (!req.cookies["jwt"])
    return res.redirect("/login"); // not yet login redirect to login
  else {
    let relativePath = "../frontend/accountManagement.html";
    let absolutePath = path.resolve(relativePath);
    res.sendFile(absolutePath);
  }
});

router.get("/services-management", (req, res) => {
  console.log(`\nrequested: '${req.originalUrl}'`);

  if (!req.cookies["jwt"])
    return res.redirect("/login"); // not yet login redirect to login
  else {
    let relativePath = "../frontend/servicesManagement.html";
    let absolutePath = path.resolve(relativePath);
    res.sendFile(absolutePath);
  }
});

router.get("/authen-operation", (req, res) => {
  console.log(`\nrequested: '${req.originalUrl}'`);
  if (!req.cookies["jwt"]) return res.redirect("/login"); // not yet login redirect to login
  if (req.cookies["jwt"]) {
    res.clearCookie("jwt");
    res.clearCookie("me");
    res.clearCookie("adminSearchResult");
    console.log("logout completed");
    return res.redirect("/login"); // logout succes
  }
});

// Send login username and password here
router.post("/auth", (req, res) => {
  let s = `SELECT password_hash, staff_id FROM ad_min WHERE username='${req.body.username}'`;

  connection.query(s, (err, result) => {;
    if (result.length == 0) return res.status(401);
    if (err) {
      res.sendStatus(401);
    } else {
      bcrypt
        .compare(req.body.password, result[0].password_hash)
        .then((valid) => {
          if (valid) {
            let data = {
              sub: req.body.username,
              admin: true,
            };
            // Expires in 1 day
            let token = jwt.sign(data, JWT_PRI, {
              algorithm: "RS256",
              expiresIn: "24h",
            });

            res.cookie("jwt", token); // login state cookie
            res.cookie("me", result[0].staff_id); // assign staff id cookie
            console.log("login completed");
            return res.redirect("/services-management");
          } else {
            return res.status(401).redirect("/login");
          }
        })
        .catch(() => console.error());
    }
  });
});

router.get("/song", (req, res) => {
  let s = "SELECT * FROM music";

  connection.query(s, (err, result) => {
    if (err) {
      res.sendStatus(400);
    } else {
      res.send(result);
    }
  });
});

router.get("/searchSong", (req, res) => {
  let s = `SELECT * FROM music WHERE title LIKE '%${
    req.query.title
  }%' OR artist LIKE '%${req.query.artist}%' ${
    req.query.year ? "OR YEAR(updated_date)=" + req.query.year : ""
  }`;

  connection.query(s, (err, result) => {
    if (err) {
      res.sendStatus(400);
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

//! Protected resources
router.post(
  "/insertSong",
  jwtVerify({
    secret: JWT_PUB,
    algorithms: ["RS256"],
  }),
  (req, res) => {
    if (!req.auth.admin) return res.sendStatus(401);

    let s = `INSERT INTO music (link,artist,title, updated_date) VALUE ('${req.body.link}','${req.body.artist}','${req.body.title}','${req.body.updatedDate}')`;

    connection.query(s, (err, result) => {
      if (err) {
        res.sendStatus(400);
        console.log(err);
      } else {
        res.sendStatus(200);
      }
    });
  }
);

router.delete(
  "/deleteSong",
  jwtVerify({
    secret: JWT_PUB,
    algorithms: ["RS256"],
  }),
  (req, res) => {
    if (!req.auth.admin) return res.sendStatus(401);

    let s = `DELETE FROM music WHERE song_id=${req.body.songID}`;

    connection.query(s, (err, result) => {
      if (err) {
        res.sendStatus(400);
      } else {
        res.sendStatus(200);
      }
    });
  }
);

router.post(
  "/updateSong",
  jwtVerify({
    secret: JWT_PUB,
    algorithms: ["RS256"],
  }),
  (req, res) => {
    if (!req.auth.admin) return res.sendStatus(401);

    let s = `UPDATE music SET title='${req.body.title}', artist='${req.body.artist}', updated_date='${req.body.updatedDate}' WHERE song_id=${req.body.songID}`;

    connection.query(s, (err, result) => {
      if (err) {
        res.sendStatus(400);
      } else {
        res.sendStatus(200);
      }
    });
  }
);

router.get(
  "/getAdmins",
  jwtVerify({
    secret: JWT_PUB,
    algorithms: ["RS256"],
  }),
  (req, res) => {
    if (!req.auth.admin) return res.sendStatus(401);

    let s = `SELECT * FROM ad_min `;

    connection.query(s, (err, result) => {
      if (err) {
        res.sendStatus(400);
        console.log(err);
      } else {
        res.send(result);
      }
    });
  }
);

router.get(
  "/getAdmins",
  jwtVerify({
    secret: JWT_PUB,
    algorithms: ["RS256"],
  }),
  (req, res) => {
    if (!req.auth.admin) return res.sendStatus(401);

    let s = `SELECT * FROM ad_min `;

    connection.query(s, (err, result) => {
      if (err) {
        res.sendStatus(400);
        console.log(err);
      } else {
        res.send(result);
      }
    });
  }
);

// search admin
router.post(
  "/search-admin",
  jwtVerify({
    secret: JWT_PUB,
    algorithms: ["RS256"],
    getToken: function fromCookie(req) {
      var token = req.cookies["jwt"];
      if (token) {
        return token;
      }
      return null;
    },
  }),
  (req, res) => {
    if (!req.auth.admin) return res.sendStatus(401);
    let sql;
    const searchC = req.body.admin_search_choice; // `search_choice` name attribute in the html form
    const searchV = req.body.admin_search_value; // `search_value` name attribute in the html form
    console.log(`search by ${searchC}`);
    if (searchC == "id") {
      sql = `SELECT staff_id, first_name, last_name, username FROM ad_min WHERE staff_id like '%${searchV}%'`;
    } else if (searchC == "first") {
      sql = `SELECT staff_id, first_name, last_name, username FROM ad_min WHERE first_name like '%${searchV}%'`;
    } else if (searchC == "username") {
      sql = `SELECT staff_id, first_name, last_name, username FROM ad_min WHERE username like '%${searchV}%'`;
    } else {
      sql = `SELECT staff_id, first_name, last_name, username FROM ad_min WHERE first_name LIKE '%${searchV}%' OR last_name LIKE '%${searchV}}%' OR username LIKE '%${searchV}%'`;
    }

    connection.query(sql, (err, result) => {
      if (err) {
        res.sendStatus(400);
        console.log(err);
      } else {
        // console.log(result);
        res.cookie("adminSearchResult", result);
        console.log("admin search results returned");
        return res.status(200).redirect("/account-management");
      }
    });
  }
);

// add admin
router.post(
  "/add-admin",
  jwtVerify({
    secret: JWT_PUB,
    algorithms: ["RS256"],
    getToken: function fromCookie(req) {
      var token = req.cookies["jwt"];
      if (token) {
        return token;
      }
      return null;
    },
  }),
  (req, res) => {
    if (!req.auth.admin) return res.sendStatus(401);
    bcrypt.genSalt(10).then((salt) =>
      bcrypt.hash(req.body.password, salt).then((hash) => {
        let s = `INSERT INTO ad_min (first_name,last_name, username,password_hash) VALUES ('${req.body.fname}','${req.body.lname}','${req.body.username}','${hash}')`;

        connection.query(s, (err, result) => {
          if (err) {
            res.sendStatus(400);
            console.log(err);
          } else {
            console.log("new record added");
            res.status(200).redirect("/account-management");
          }
        });
      })
    );
  }
);

router.delete(
  "/delete-admin",
  jwtVerify({
    secret: JWT_PUB,
    algorithms: ["RS256"],
  }),
  (req, res) => {
    if (!req.auth.admin) return res.sendStatus(401);
    let s = `DELETE FROM ad_min WHERE staff_id=${req.body.staffID}`;

    connection.query(s, (err, result) => {
      if (err) {
        console.log(err);
        res.sendStatus(400);
      } else {
        res.sendStatus(200);
      }
    });
  }
);

// edit admin info
router.post(
  "/update-admin",
  jwtVerify({
    secret: JWT_PUB,
    algorithms: ["RS256"],
    getToken: function fromCookie(req) {
      var token = req.cookies["jwt"];
      if (token) {
        return token;
      }
      return null;
    },
  }),

  (req, res) => {
    if (!req.auth.admin) return res.status(401).redirect("/account-management"); // not admin go login

    let s = `update ad_min set first_name = "${req.body.fname}", last_name = "${
      req.body.lname
    }" where username=${req.body.username}`;

    connection.query(s, (err, result) => {
      if (err) {
        res.sendStatus(400);
        console.log(err);
      } else {
        // res.sendStatus(200);
        console.log(
          `info of whose staff id is ${req.cookies["me"]} update completed`
        );
        return res.status(200).redirect("/account-management");
      }
    });
  }
);

// edit account password
router.post(
  "/update-password",
  jwtVerify({
    secret: JWT_PUB,
    algorithms: ["RS256"],
    getToken: function fromCookie(req) {
      var token = req.cookies["jwt"];
      if (token) {
        return token;
      }
      return null;
    },
  }),

  (req, res) => {
    if (!req.auth.admin) return res.status(401).redirect("/login"); // not admin go login
    connection.query(
      `SELECT password_hash FROM ad_min WHERE staff_id='${req.cookies["me"]}'`,
      (err, result) => {
        // get hashed password from database
        if (err) {
          console.error();
        } // if error log it
        const hashedPassword = result[0].password_hash;
        bcrypt
          .compare(req.body.currentPassword, hashedPassword)
          .then((valid) => {
            if (valid) {
              // if what user entered match what in database
              if (req.body.newPassword == req.body.confirmNewPassword) {
                // new passwords are match
                bcrypt.genSalt(10).then((salt) =>
                  bcrypt.hash(req.body.newPassword, salt).then((hash) => {
                    let s = `update ad_min set password_hash = "${hash}" where staff_id = ${Number(
                      req.cookies["me"]
                    )}`; // generated hash password for new one and update in database

                    connection.query(s, (err, result) => {
                      if (err) {
                        res.sendStatus(400);
                        console.log(err);
                      } else {
                        // res.sendStatus(200);
                        console.log(
                          `password of whose staff id is ${req.cookies["me"]} update completed`
                        );
                        return res.status(200).redirect("/account-management");
                      }
                    });
                  })
                );
              } else {
                return res.redirect("/account-management"); // update failed
              }
            }
          });
      }
    );
  }
);

// return an object contains [first_name,last_name,staff_id,username]
router.get(
  "/return-my-info",
  jwtVerify({
    secret: JWT_PUB,
    algorithms: ["RS256"],
    getToken: function fromCookie(req) {
      var token = req.cookies["jwt"];
      if (token) {
        return token;
      }
      return null;
    },
  }),
  function (req, res) {
    if (!req.auth.admin) return res.sendStatus(400); // bad request due to not admin
    if (!req.cookies["me"]) return res.sendStatus(400); // bad request
    let s = `SELECT staff_id, first_name, last_name, username FROM ad_min where staff_id = ${req.cookies["me"]} `;

    connection.query(s, (err, result) => {
      if (err) {
        res.sendStatus(400);
        console.log(err);
      } else {
        res.send(result);
        console.log("my-info returned");
        return result; // return just actual data
      }
    });
  }
);

// return an object contains admin_search_result
router.get(
  "/return-admin-search-result",
  jwtVerify({
    secret: JWT_PUB,
    algorithms: ["RS256"],
    getToken: function fromCookie(req) {
      var token = req.cookies["jwt"];
      if (token) {
        return token;
      }
      return null;
    },
  }),
  function (req, res) {
    if (!req.auth.admin) return res.sendStatus(400); // bad request due to not admin
    if (!req.cookies["me"]) return res.sendStatus(400); // bad request
    if (!req.cookies["adminSearchResult"]) return res.sendStatus(400);
    // bad request due to admin search not performed
    else {
      const result = req.cookies["adminSearchResult"];
      res.send(result);
      console.log("search result returned");
      return result; // return just actual data
    }
  }
);

/* Handle any unspecified paths */
app.use((req, res, next) => {
  console.log("");
  console.log(`404: Invalid accessed at URL: '${req.url}' `);
  res.status(404).send("Error 404: NOT FOUND");
});

app.listen(process.env.PORT, () => {
  console.log("Listening on http://127.0.0.1:" + process.env.PORT);
});
