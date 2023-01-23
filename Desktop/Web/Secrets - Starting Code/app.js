//jshint esversion:6
require('dotenv').config();
const bodyParser = require('body-parser');
const ejs = require('ejs');
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const findOrCreate=require('mongoose-findorcreate');
const { log } = require('console');
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;



const saltRounds = 10;
const app = express()


app.use(express.static("public"))
mongoose.set("strictQuery", true)
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({extended:true}))

app.use(session({
    secret: "process.env.SECREAT",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use((passport.session()));

mongoose.connect(process.env.URL, {useNewUrlParser: true});

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("user", userSchema)

passport.use(User.createStrategy());

passport.serializeUser(function(user, done){
    done(null, user.id);
})

passport.deserializeUser(function(id, done){
    User.findById(id, function(err, user){
        done(err,user);
    })
})

//////////////Google Strategy///////////////////

passport.use(new GoogleStrategy({
    clientID:     process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    passReqToCallback   : true
  },
  function(request, accessToken, refreshToken, profile, done) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));

//////////////End Strategy/////////////////

app.post("/register", function(req, res){
   User.register({username: req.body.username},req.body.password, function(err, user){
    if(err){
        console.log(err);
        res.redirect("/register");
    }else{
        passport.authenticate("local")(req,res, function(){
            res.redirect("/secrets");
        })
    }
   })
})
    

app.post("/login", function(req, res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req,res, function(){
                res.redirect("/secrets");
            })
        }
    })
});

app.get('/', (req, res) => res.render("home"))
app.get('/login', (req, res) => res.render("login"))
app.get('/register', (req, res) => res.render("register"))
app.get('/submit', (req, res) => res.render("submit"))
app.get('/auth/google',
  passport.authenticate('google', { scope:
      [ 'email', "profile" ] }
));

app.get( '/auth/google/secrets',
    passport.authenticate( 'google', {
        successRedirect: '/secrets',
        failureRedirect: '/login'
}));

app.get('/logout', function(req, res, next){
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
  });

app.get('/secrets', function(req, res) {
    if(req.isAuthenticated()){
        res.render("secrets")
    }else{
        res.redirect("/login")
    }
    
})


app.listen(process.env.PORT, () => console.log(`Example app listening on port ${process.env.PORT}!`))