// routes for Google Authentication
// Packages Imported
const express = require ('express');
const router = express.Router();
const passport = require ('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// /Packages Imported

// Files Imported
const env = require('../environment')
const jwtUtil = require('../utility/jwt')
const userModel = require('../model/userModel')
// /Files Imported

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    userModel.findById(id).then((user) => {
        done(null, user);
    })
})

passport.use(new GoogleStrategy({
    clientID: env.googleClientId,
    clientSecret: env.googleClientSecret,
    callbackURL: '/googleauth/callback'
  },(accessToken, refreshToken, profile, done) => {

    //passport callback function
    //Checking if user already exists
    userModel.findOne({ googleId: profile.id }).then(currentUser => {

        //if user exists
        if(currentUser){
            done(null, currentUser);
        } else {

        //if user does not exist
        userModel.create({
            googleId: profile.id,
            emailId: profile.emails[0].value,
            profileImage: profile.photos[0].value,
            provider: profile.provider,
            gender: profile.gender,
            })
            .then(newUser => {
                    done(null, newUser);
            })
        }
    })
  }
));

router.get('/auth', passport.authenticate('google', { scope: ['email'] }));


router.get('/callback', passport.authenticate('google', { failureRedirect: '/googleauth/auth' }),(req, res) => {
    const userId = req.user.id;
    const token = jwtUtil.createToken(30, userId)

    // Successful authentication.
    res.redirect(`${env.googleSuccessfulRedirect}${token}`);

  });

module.exports = router