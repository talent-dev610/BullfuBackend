const router = require('express').Router();
const { default: mongoose } = require('mongoose');
const User = require('../model/User');
const authJwt = require('../utils/authJwt');
const upload = require('../utils/upload');
const Resize = require('../utils/resize');
const path = require('path');
const bcrypt = require('bcrypt');
const { hash } = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
const { filename } = require('../utils/resize');
const SESConfig = {
    apiVersion: "2010-12-01",
    accessKeyId: process.env.AWS_ACCESS_KEY,
    accessSecretKey: process.env.AWS_SECRET_KEY,
    region: "us-west-1"
}
AWS.config.update(SESConfig);
const s3 = new AWS.S3({ apiVersion: '2006-03-01' })


router.post('/upload-avatar', authJwt, upload.single('image'), async (req, res, next) => {
    var me = await User.findById(req.userData.id)
        .then(function (user) {
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found.',
                    data: {}
                });
            }
            return user;
        })
        .catch(next);

    const imageFile = req.file

    if (!imageFile) {
        res.status(401).json({
            success: false,
            message: 'Please provide an image',
            data: {}
        });
    }

    let myImage = imageFile.originalname.split('.')
    const fileExt = myImage[myImage.length - 1]
    let allowed = false;
    switch (fileExt) {
        case "gif":
        case "png":
        case "jpg":
        case "jpeg":
        case "heic":
        case "heif":
            allowed = true;
            break;
    }

    if (allowed) {
        const params = {
            Bucket: 'bullhu',
            Key: `${uuidv4()}.${fileExt}`,
            Body: imageFile.buffer
        }
        // Send to AWS
        console.log('params', params)
        s3.upload(params, async (err, data) => {
            if (err) {
                res.status(500).json({
                    success: false,
                    message: err,
                    data: {}
                });
            } else {
                
                updateObj = {
                    photo: data.Location
                }

                const updated = await User.updateOne({ _id: me.id }, updateObj)
                    .then(datas => {
                        console.log('aaaa', datas)
                        me.photo = data.Location
                        return res.json({
                            success: true,
                            message: 'Avatar replaced successfully',
                            data: me.userJSON()
                        });
                    })
                    .catch(next);
            }
        })
    } else {
        console.log('File type not allowed');

        res.status(400).json({
            success: false,
            message: 'File type not allowed',
            data: {}
        });
    }
})

router.post('/upload-photo', authJwt, upload.single('image'), async function (req, res, next) {
    const imagePath = path.join(__dirname, '../public/images');
    const fileUpload = new Resize(imagePath);
    if (!req.file) {
        res.status(401).json({
            success: false,
            message: 'Please provide an image',
            data: {}
        });
    }
    const filename = await fileUpload.save(req.file.buffer);

    User.findById(req.userData.id)
        .then(function (user) {
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found.',
                    data: {}
                });
            }

            user.photo = 'http://' + req.headers.host + '/images/' + filename;

            return user.save().then(function () {
                return res.json({
                    success: true,
                    message: '',
                    data: user.userJSON()
                });
            });
        })
        .catch(next);
})

// update full name and phone number
router.post('/update', authJwt, (req, res, next) => {
    var user = new User();

    user.name = req.body.name;
    user.phone_country_code = req.body.country_code;
    user.phone = req.body.phone;

    User.findById(req.userData.id)
        .then(function (user) {
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found.',
                    data: {}
                });
            }

            user.name = req.body.name;
            user.phone_country_code = req.body.country_code;
            user.phone = req.body.phone;

            return user.save().then(function () {
                return res.json({
                    success: true,
                    message: '',
                    data: user.userJSON()
                });
            });
        })
        .catch(next);
});

// change password
router.post('/change-password', authJwt, (req, res, next) => {
    User.findById(req.userData.id)
        .then(function (user) {
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found.',
                    data: {}
                });
            }

            bcrypt.compare(req.body.current_password, user.password, (err, result) => {
                if (err) {
                    return res.status(401).json({
                        success: false,
                        message: 'Authentication failed.',
                        data: {}
                    });
                }
                if (result) {
                    bcrypt.hash(req.body.new_password, 10, (err, hashedPwd) => {
                        if (err) {
                            console.log(err);
                            return res.status(400).json({
                                success: false,
                                message: 'Authentication failed.',
                                data: {}
                            });
                        } else {
                            user.password = hashedPwd;

                            user.save()
                                .then(result => {
                                    console.log(result);
                                    return res.json({
                                        success: true,
                                        message: '',
                                        data: {}
                                    });
                                })
                                .catch(next);
                        }
                    });
                } else {
                    return res.json({
                        success: false,
                        message: 'Authentication failed. Password is wrong.',
                        data: {}
                    });
                }
            });
        })
        .catch(next);
});



module.exports = router;