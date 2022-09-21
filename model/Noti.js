const mongoose = require('mongoose');
const mongooseUniqueValidator = require('mongoose-unique-validator');


const notiSchema = new mongoose.Schema({
    from_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "can't be blank"]
    },
    to_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "can't be blank"]
    },
    delivery_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Delivery',
        required: [true, "can't be blank"]
    }
}, {
    timestamps: true
});

notiSchema.plugin(mongooseUniqueValidator, { message: 'is already taken by others.' });

module.exports = mongoose.model('Noti', notiSchema);