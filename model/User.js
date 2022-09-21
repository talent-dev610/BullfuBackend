const mongoose = require('mongoose');
const mongooseUniqueValidator = require('mongoose-unique-validator');
const bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    // _id: mongoose.Schema.Types.ObjectId,
    name: {
        type: String,
        required: true,
        min: 1
    },
    email: {
        type: String,
        required: [true, "can't be blank"],
        min: 6,
        max: 255,
        lowercase: true,
        unique: [true, "can't be duplicated"],
        index: true,
        match: [/\S+@\S+\.\S+/, 'is invalid']
    },
    password: {
        type: String,
        required: true,
        max: 1024,
        min: 6
    },
    phone_country_code: {
        type: String,
        lowercase: true,
        trim: true,
        index: true,
        required: false,
        sparse: true,//sparse is because now we have two possible unique keys that are optional
    },
    phone: {
        type: String,
        trim: true,
        required: false,
        sparse: true,//sparse is because now we have two possible unique keys that are optional
    },
    full_phone_number: {
        type: String,
        trim: true
    },
    photo: {
        type: String,
        default: ""
    },
    category: {
        type: String // 0:consignor, 1:driver
    },
    reset_code: {
        type: String
    },
    fcm_token: {
        type: String
    }
}, {
    timestamps: true
});

userSchema.plugin(mongooseUniqueValidator, { message: 'is already taken by others.' });

userSchema.methods.toAuthJSON = function () {
    return {
        user: {
            id: this.id,
            name: this.name,
            email: this.email,              
            phone_country_code: this.phone_country_code,
            phone: this.phone,
            photo: this.photo,
            category: this.category,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        },
        token: this.generateJWT()
    };
};

userSchema.methods.userJSON = function () {
    return {
        user: {
            id: this.id,
            name: this.name,
            email: this.email,
            phone_country_code: this.phone_country_code,
            phone: this.phone,
            photo: this.photo,
            category: this.category,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        }
    };
};

userSchema.methods.generateJWT = function () {
    var today = new Date();
    var exp = new Date(today);
    exp.setDate(today.getDate() + 60);

    return jwt.sign({
        id: this.id,
        email: this.email,
        exp: parseInt(exp.getTime() / 1000),
    }, 'secret');
};

module.exports = mongoose.model('User', userSchema);