const express = require("express");
const path = require("path")
const helmet = require("helmet")

const app = express();

const router = express.Router();

app.use(router);
router.use(helmet({
    contentSecurityPolicy: false
}))
router.get("/img/logo.png", (req,res)=>{
    res.sendFile(path.join(__dirname,"img","logo.png"))
})

router.get("/img/bg.jpg", (req,res)=>{
    res.sendFile(path.join(__dirname,"img","bg.jpg"))
})

router.get("/shared.css", (req,res)=>{
    res.sendFile(path.join(__dirname,"shared.css"))
})

router.get("/search.css", (req,res)=>{
    res.sendFile(path.join(__dirname,"search.css"))
})

router.get("/" ,(req,res) => {
    res.sendFile(path.join(__dirname, "index.html"))
});

router.get("/login" ,(req,res) => {
    res.sendFile(path.join(__dirname, "login.html"))
});

router.get("/about-us" ,(req,res) => {
    res.sendFile(path.join(__dirname,"aboutUs.html"))
});

router.get('/search', (req,res)=>{
    res.sendFile(path.join(__dirname, 'search.html'))
});

router.get("/account-management", (req,res)=>{
    res.sendFile(path.join(__dirname, "accountManagement.html"))
});

router.get("/services-management",(req,res)=>{
    res.sendFile(path.join(__dirname, "serviceManagement.html"))
})

router.get("/search-song",(req,res)=>{
    res.sendFile(path.join(__dirname, "songResult.html"))
})

app.listen(3000, ()=>{
    console.log("Listening on port 3000" )
})