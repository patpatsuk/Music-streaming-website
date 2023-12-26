const express = require("express");
const mysql = require("mysql2");
const ex_jwt = require("express-jwt");
const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const router = express.Router();
const app = express();
const jwtVerify = ex_jwt.expressjwt;

const JWT_PUB = fs.readFileSync("./jwtRS256.key.pub");
const JWT_PRI = fs.readFileSync("./jwtRS256.key");

app.use(router);

router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(cookieParser());
router.use(cors());

const connection = mysql.createConnection({
  host: "node45571-65-2-itcs212-3-7-backend.th1.proen.cloud",
  user: "web_programming",
  password: 'ThIs_1s_W3bpr0gramming',
  database: 'musik',
});

connection.connect((err) => {
  if (err) throw err;
  console.log("Connected to DB: musik");
});

/* 

Test authentication
method: post
URL: http://127.0.0.1:5000/auth
body: application/x-www-form-urlencoded

1.) username=luke&password=luke
2.) username=new&password=new

*/

// Send login username and password here
router.post("/auth", (req, res) => {
  let s = `SELECT password_hash FROM ad_min WHERE username='${req.body.username}'`;
	console.log(req.body)
  connection.query(s, (err, result) => {
    if(result.length == 0) {console.log(result); return res.sendStatus(401); }
    if (err) {
      res.sendStatus(401);
      console.log(err);
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
		let d = { jwt : token, admin: true, username: req.body.username}
            res.status(200).send(d);
            // return res.redirect("/services-management");
          } else {
		console.log("Not valid")
            res.sendStatus(401); //.redirect("/login");
          }
        })
        .catch(() => {res.sendStatus(401); console.log("Catch")});
    }
  });
});

/* 

Get all song
method: get
URL: http://127.0.0.1:5000/song

*/

router.get("/song", (req, res) => {
  let s = "SELECT * FROM music";
  console.log("Get Song")
  connection.query(s, (err, result) => {
    if (err) {
      res.sendStatus(400);
    } else {
      res.send(result);
    }
  });
});

/* 

Search Song
method: get
URL: http://127.0.0.1:5000/searchSong
Query:

1.) ?title=Queen
2.) ?artist=Rhap

*/

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

/* 

Insert New Song
method: post
URL: http://127.0.0.1:5000/auth
Header :

Authorization : "Bearer " + JWT


body: application/x-www-form-urlencoded

1.) link=www.youtube.com%2Fwatch%3Fv%3DfndMDLCYXpc&artist=Protostar&title=Galaxies&updated_date=2020-05-05
2.) link=www.youtube.com%2Fwatch%3Fv%3D2QdPxdcMhFQ&artist=TheFatRat%20%26%20NEFFEX&title=Back%20One%20Day&updated_date=2022-12-16

*/

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

/* 

Delete Song
method: delete
URL: http://127.0.0.1:5000/deleteSong
Header :

Authorization : "Bearer " + JWT


body: application/x-www-form-urlencoded

1.) songID=5
2.) songID=6

*/

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

/* 

Update Song
method: delete
URL: http://127.0.0.1:5000/updateSong
Header :

Authorization : "Bearer " + JWT

body: application/x-www-form-urlencoded

1.) songID=1&title=Song1&artist=Test2&updatedDate=2022-02-02
2.) songID=2&title=Song2&artist=Test3&updatedDate=2023-03-03

*/

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

/* 

Get all admin
method: get
URL: http://127.0.0.1:5000/getAdmins
Header :

Authorization : "Bearer " + JWT

*/

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

/* 

Get specific admin
method: get
URL: http://127.0.0.1:5000/searchAdmin
Header :

Authorization : "Bearer " + JWT

1.) ?username=new
2.) ?username=luke

*/

router.get(
  "/searchAdmin",
  jwtVerify({
    secret: JWT_PUB,
    algorithms: ["RS256"],
  }),
  (req, res) => {
    if (!req.auth.admin) return res.sendStatus(401);

    let s = `SELECT * FROM ad_min WHERE first_name LIKE '%${req.query.fname}%' OR last_name LIKE '%${req.query.lname}%' OR username LIKE '%${req.query.username}%'`;

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

/* 

Add admin
method: post
URL: http://127.0.0.1:5000/addAdmin
Header :

Authorization : "Bearer " + JWT

body: application/x-www-form-urlencoded

1.) fname=Sompong&lname=Jaidee&username=sompong&password=1234
2.) fname=Somchat&lname=Jaidee&username=somchat&password=1234


*/

router.post(
  "/addAdmin",
  jwtVerify({
    secret: JWT_PUB,
    algorithms: ["RS256"],
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
            res.sendStatus(200);
          }
        });
      })
    );
  }
);

/* 

Delete admin
method: post
URL: http://127.0.0.1:5000/deleteAdmin
Header :

Authorization : "Bearer " + JWT

body: application/x-www-form-urlencoded

1.) staffID=5
2.) staffID=6


*/

router.delete(
  "/deleteAdmin",
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

app.listen(5000, () => {
  console.log("Listening on http://127.0.0.1:" + '5000');
});
