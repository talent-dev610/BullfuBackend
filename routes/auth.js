const router = require('express').Router();
const { default: mongoose } = require('mongoose');
const User = require('../model/User');
const bcrypt = require('bcrypt');
const { hash } = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config();

// Load the AWS SDK for Node.js
// var AWS = require('aws-sdk');
// const SESConfig = {
//     apiVersion: "2010-12-01",
//     accessKeyId: process.env.AWS_ACCESS_KEY,
//     accessSecretKey: process.env.AWS_SECRET_KEY,
//     region: "us-west-1"
// }
// AWS.config.update(SESConfig);

const Nylas = require('nylas');
Nylas.config({
    clientId: process.env.Nylas_CLIENT_ID,
    clientSecret: process.env.Nylas_CLIENT_SECRET,
});
const nylas = Nylas.with(process.env.Nylas_ACCESS_TOKEN);
const { default: Draft } = require('nylas/lib/models/draft');

// signup
router.post('/signup', (req, res, next) => {
    var user = new User();

    // user._id = mongoose.Types.ObjectId();
    user.name = req.body.name;
    user.email = req.body.email;
    user.phone_country_code = req.body.country;
    user.phone = req.body.phone;
    user.category = req.body.category;

    bcrypt.hash(req.body.password, 10, (err, hashedPwd) => {
        if (err) {
            console.log(err);
            return res.status(400).json({
                success: false,
                message: err.message,
                data: {}
            });
        } else {
            user.password = hashedPwd;

            user.save()
                .then(result => {
                    return res.json({
                        success: true,
                        message: '',
                        data: user.toAuthJSON()
                    });
                })
                .catch(next);
        }
    });
});

// login
router.post('/signin', (req, res, next) => {
    User.findOne({ email: req.body.email })
        .then(user => {
            bcrypt.compare(req.body.password, user.password, (err, result) => {
                if (err) {
                    return res.status(401).json({
                        success: false,
                        message: 'Authentication failed. Email or password is wrong.',
                        data: {}
                    });
                }
                if (result) {
                    return res.json({
                        success: true,
                        message: '',
                        data: user.toAuthJSON()
                    });
                } else {
                    return res.json({
                        success: false,
                        message: 'Authentication failed. Email or password is wrong.',
                        data: {}
                    });
                }
            });
        })
        .catch(next);
});

// forgot password: sending verification code through email
router.post('/forgot-password', (req, res, next) => {
    User.findOne({ email: req.body.email })
        .then(user => {
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found.',
                    data: {}
                });
            }

            user.reset_code = Math.floor(100000 + Math.random() * 900000);
            user.save();

            var draft = new Draft(nylas, {
                subject: 'Verification Code',
                body: 'Your verification code to reset password is ' + user.reset_code,
                to: [{ name: user.name, email: req.body.email }]
            });
            draft.send().then(message => {
                console.log(`${message.id} was sent`);
                return res.json({
                    success: true,
                    message: '',
                    data: {}
                });
            });
            // var params = {
            //     Destination: { /* required */
            //         CcAddresses: [
            //             'bullhu.technologies@gmail.com'
            //         ],
            //         ToAddresses: [
            //             'welcome.jenovic2020@gmail.com'
            //         ]
            //     },
            //     Message: { /* required */
            //         Body: { /* required */
            //             Html: {
            //                 Charset: "UTF-8",
            //                 Data: "Your verification code " + user.reset_code // custom this message
            //             },
            //             Text: {
            //                 Charset: "UTF-8",
            //                 Data: "Your verification code " + user.reset_code
            //             }
            //         },
            //         Subject: {
            //             Charset: 'UTF-8',
            //             Data: 'Email Verification'
            //         }
            //     },
            //     Source: 'bullhu.technologies@gmail.com',
            //     ReplyToAddresses: [
            //         'bullhu.technologies@gmail.com'
            //     ],
            // };


            // // Create the promise and SES service object
            // var sendPromise = new AWS.SES({ apiVersion: '2010-12-01' }).sendEmail(params).promise();

            // // Handle promise's fulfilled/rejected states
            // sendPromise.then(
            //     function (data) {
            //         console.log(data);
            //         return res.json({
            //             success: true,
            //             message: '',
            //             data: {}
            //         });
            //     })
            //     .catch(next);
        })
        .catch(next);
});

router.post('/check-confirm-code', function (req, res, next) {
    User.findOne({ email: req.body.email }).then(function (user) {
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found.',
                data: {}
            });
        }

        if (user.reset_code != req.body.reset_code) {
            return res.status(422).json({
                success: false,
                message: 'Confirmation code is incorrect.',
                data: {}
            });
        }

        return res.json({
            success: true,
            message: '',
            data: {}
        });
    })
})

router.post('/reset-password', function (req, res, next) {
    User.findOne({ email: req.body.email }).then(function (user) {
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found.',
                data: {}
            });
        }

        bcrypt.hash(req.body.password, 10, (err, hashedPwd) => {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: err.message,
                    data: {}
                });
            } else {
                user.password = hashedPwd;

                user.save()
                    .then(result => {
                        return res.json({
                            success: true,
                            message: '',
                            data: user.toAuthJSON()
                        });
                    })
                    .catch(next);
            }
        });
    });
})



module.exports = router;