//jshint esversion:6

require('dotenv').config();
const {sequelize, register} = require("./models");
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
app.use(bodyParser.urlencoded({
    extended:true
})); 
const port = process.env.DB_PORT;

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


passport.use(new LocalStrategy(
    async function(username, password, done) {
        try{
            const account = await register.findOne({
                where: {
                    username: username
                }
            });
            if (!account) { return done(null, false); }
            if (!account.verifyPassword(password)) { return done(null, false); }
            return done(null, user);
        } catch(err){
            if (err) 
            { return done(err);}
        }
        
    }));

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
        return cb(null, {
            username: user.username,
            password: user.password
          });
        });
      });
      
passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
       return cb(null, user);
        });
      });

app.get("/", (req, res)=>{
    res.render("home");
});

app.get("/register", (req, res)=>{
    res.render("register");
});

app.post("/register", async (req, res)=>{
    const {username, password} = req.body;
        try{
            const account = await register.create({
                username: username, password:password
            });
            
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
app.get("/secrets", (req, res)=>{
    if(req.isAuthenticated()){
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
})

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


app.listen(port, async()=>{
    await sequelize.authenticate();
    console.log("Listening....")
})


