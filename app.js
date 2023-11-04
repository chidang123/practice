//jshint esversion:6

require('dotenv').config();
const { QueryTypes } = require('sequelize');
const { Op } = require("sequelize");
var GoogleStrategy = require('passport-google-oauth20').Strategy;
const {sequelize, register, secret} = require("./models");
const bodyParser = require("body-parser");
const User = require('./models/register');
const express = require("express");
const passportLocal = require('passport-local');
const passport = require('passport');
const session = require('express-session');
const app = express()
const LocalStrategy = require('passport-local');
app.use(express.static("public"));
app.set('view engine', 'ejs');
const bcrypt = require('bcrypt');
app.use(bodyParser.urlencoded({
    extended:true
})); 
const port = process.env.DB_PORT;
const saltRounds = 10;

const sess = {
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true, 
    cookie:
        {
            secure: false
        }
};

app.use(session(sess));
app.use(passport.initialize());
app.use(passport.session());

// this is for login with username and
passport.use(new LocalStrategy(
    async function(username, password, done) {
        try{
            const account = await register.findOne({
                where: {
                    username: username
                }
            });
            console.log(account);
            //console.log(user);
            if (!account) { return done(null, false); }
            if (!account.verifyPassword(password)) { return done(null, false); }
            return done(null, user);
        } catch(err){
            if (err) 
            { return done(err);}
        }
        
    }));

// this is the 3rd function that is called after 2nd function
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:700/auth/google/secrets", 
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
     async function (accessToken, refreshToken, profile, cb) {
            try{

                const[account1, created] = await register.findOrCreate(
                    {attributes:['googleId'],
                        where: {googleId:profile.id}
                    }
                );

                return cb(null,account1);
                } catch(err){
                    if (err)  { return cb(err);}
                }
        }
));



passport.serializeUser(async(user, done) => {
    console.log("hello");
    if(user.googleId == undefined){
        process.nextTick(function() {
            return done(null, {
                username: user.username,
                password: user.password
              });
            });  
    }

    if (user.googleId != undefined){
        done(null, user.googleId);
    }

});

passport.deserializeUser(async(user, done) => {
    if(user.googleId == undefined){
        process.nextTick(function() {
            return done(null, user);
             });
    } 
    if (user.googleId != undefined){
        const account = await register.findOne({
            where:{googleId: user.googleId}
        });
            done(null, account);
    }
});

// serializeUser for passport-local
// passport.serializeUser(function(user, cb) {
//     process.nextTick(function() {
//         return cb(null, {
//             username: user.username,
//             password: user.password
//           });
//         });
//       });

// this is serializeUser for google 0auth
// passport.serializeUser((user, done) => {
//     done(null, user.googleId);
// });

// this is deserializeUser for passport-local
// passport.deserializeUser(function(user, cb) {
//     process.nextTick(function() {
//        return cb(null, user);
//         });
//       });


// this is deserializeUser for google 0auth
// passport.deserializeUser(async(googleId, done) => {
    // const account = await register.findOne({
    //     where:{googleId: googleId}
    // });
    //     done(null, account);
// });


app.get("/", (req, res)=>{
    res.render("home");
});

// this will call when you click on the image on sign in google on register/login page
// app.get("/auth/google",
//   passport.authenticate("google", { scope: ["profile"]})
// );
// either this one or the one below 
// this will call when you click on the image on sign in google on register/login page
app.get("/auth/google",(req, res)=>{
    console.log("autho/google");
    passport.authenticate("google", { scope: ["profile"]}) (req, res, function(){
    });
});

// this is the second function that is called after app.get("/auth/google",(req, res) for google Oauth   
app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/register", (req, res)=>{
    res.render("register");
});

app.post("/register", (req, res)=>{
    // const {username, password} = req.body;
        try{
            bcrypt.hash(req.body.password, saltRounds, async function(err, hash) {
                const account = await register.create({
                    username: req.body.username, password:hash
                });
                console.log(hash);
            });
            // const account = await register.create({
            //     username: username, password:password
            // });
            
            passport.authenticate("local") (req, res, function()/*this is the callback*/{
                // if authenticating, then callback will executing which is function() in passport.authenicate("local")(req,res,function())
                // we successfully setup a cookie that saved their current logged in session, 
                // so we wil get to check if they're logged in or not
                res.redirect("/secrets")});
           
        }catch(err){
           console.log(err); 
            res.redirect("/register");
        }
    });


app.get("/login", (req, res)=>{
    res.render("login");
});


// app.post("/login", async(req, res)=>{
//     const username = req.body.username; 
//     const password = req.body.password;
//     try{
//         const account = await register.findOne({
//             where:{username:username}
//         });
//         if(account.username === username){
//             bcrypt.compare(password, account.password, function(err, result) {
//                 if(result === true){
//                 res.render("secrets");
//                 }
//             });
//         } else {
//             res.render("home");
//         }
//     }catch(err){
//         res.status(500).json(err);
//     }
// }
// )

// when login succesfully, call authenticate() and take "local" as a argument is executing 
// to the passport.use(new LocalStrategy()) 
app.post("/login", async (req, res)=>{
    const {username, password} = req.body;
    req.login({username, password}, function(err){
        if(err){
            console.log(err);
        } else {
            passport.authenticate("local") (req, res, function(){
                // go to the passport.use(new LocalStrategy())  
                console.log("authenticated");
                res.redirect("/secrets");
        })
    }})
});

// to make sure req.isAuthenticated() work, you have to change cookie{secure:false} in the session 
// refering https://www.passportjs.org/concepts/authentication/logout/
app.get("/secrets", async (req, res)=>{
    //this method is for authenticated
    // if(req.isAuthenticated()){
    //     res.render("secrets");
    // } else {
    //     res.redirect("/login");
    // }

    // this is the method that anybody can access to "/secrets" route without authenicating 
    try{
        const secretFindtAll = await sequelize.query('SELECT submittedSecret FROM secrets WHERE submittedSecret IS NOT NULL'
        ); 
        const parseJS = JSON.parse(JSON.stringify(secretFindtAll[0]));
        res.render("secrets", {userWithSecrets:parseJS});
        
    } catch(err){
        console.log(err);
    }

    
});


//req.logout from the passport
// refering
//https://www.passportjs.org/concepts/authentication/logout/
// https://github.com/jaredhanson/passport/blob/72119401792ddda24e7c2b652d8d3e2decdbee5d/lib/http/request.js#L79
app.get("/logout", (req, res, next)=>{
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
});


app.get("/submit", (req, res)=>{
    if(req.isAuthenticated()){
        res.render("submit");
    } else {
        res.redirect("/login");
    }
});

app.post("/submit", async (req, res)=>{
    const secretCommit = req.body.secret;
    try {
        const account = await register.findOne({
            where:{id:req.user.id}
        });

        const secretBody = await secret.create({
            submittedSecret: secretCommit,
            userId: account.id
        });
       res.redirect("/secrets");

    } catch(err){
        if(err){
            console.log(err);
        }
    }
    })


app.listen(port, async()=>{
    await sequelize.authenticate();
    console.log("Listening....")
})


