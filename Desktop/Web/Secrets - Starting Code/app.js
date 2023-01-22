//jshint esversion:6
require('dotenv').config();
const bodyParser = require('body-parser')
const { log } = require('console')
const ejs = require('ejs')
const express = require('express')
const mongoose = require('mongoose')
const md5 = require('md5')

const app = express()

app.use(express.static("public"))
mongoose.set("strictQuery", true)
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({extended:true}))

mongoose.connect(process.env.URL, {useNewUrlParser: true});

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const User = new mongoose.model("user", userSchema)

app.post("/register", function(req, res){
    const newUser = new User({
        email: req.body.username,
        password: md5(req.body.password)
    })
    newUser.save(function(err){
        if(err){
            console.log(err);
        }else{
            res.render("secrets");
        }
    });
})

app.post("/login", function(req, res){
    const username = req.body.username;
    const password = req.body.password;
    User.findOne({email: username},function(err, foundUser){
        if(err){
            console.log(err);
        }else{
            if(md5(password)===foundUser.password){
                res.render("secrets");
            }else{
                res.redirect("/")
            }
        }
    });
})

app.get('/', (req, res) => res.render("home"))
app.get('/login', (req, res) => res.render("login"))
app.get('/logout', (req, res) => res.redirect("/login"))
app.get('/register', (req, res) => res.render("register"))


app.listen(process.env.PORT, () => console.log(`Example app listening on port ${process.env.PORT}!`))