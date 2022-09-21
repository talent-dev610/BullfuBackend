const router = require('express').Router();
const User = require('../model/User');
const authJwt = require('../utils/authJwt');

// const admin = require("firebase-admin");
// const serviceAccount = require('../utils/serviceAccountKey.json');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// update full name and phone number
router.post('/upload-token', authJwt, (req, res, next) => {

    User.findById(req.userData.id)
        .then(function (user) {
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found.',
                    data: {}
                });
            }

            user.fcm_token = req.body.fcm_token;

            return user.save().then(function () {
                return res.json({
                    success: true,
                    message: '',
                    data: {}
                });
            });
        })
        .catch(next);
});

/*
router.post('/firebase/test-push', (req, res, next) => {

    let token = req.body.fcm_token
    let message = req.body.message

    let payload = {
        notification: {
            title: 'Bullhu',
            body: message
        }
    }

    console.log('sending push notification')

    admin.messaging().sendToDevice(token, payload)
        .then(res => {
            console.log("Notification sent successfully.", token)
            return
        })
        .catch(err => {
            console.log(err)
            return 
        })
});
*/

module.exports = router;