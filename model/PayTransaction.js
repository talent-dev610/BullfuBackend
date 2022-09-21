const mongoose = require('mongoose');
const mongooseUniqueValidator = require('mongoose-unique-validator');
const { string } = require('sharp/lib/is');

const tranSchema = new mongoose.Schema({
    consignor_id: { // customer
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "can't be blank"]
    },
    driver_id: { // seller
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "can't be blank"]
    },
    delivery_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Delivery',
        required: [true, "can't be blank"]
    },
    reference: {
        type: String,
        required: [true, "can't be blank"]
    },
    paidAt: {
        type: String,
        default: ''
    },
    amount: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

tranSchema.plugin(mongooseUniqueValidator, { message: 'is already taken by others.' });

tranSchema.methods.originalJSON = function () {
    return {
        id: this.id,
        consignor_id: this.consignor_id,
        driver_id: this.driver_id,
        reference: this.reference,
        paidAt: this.paidAt,
        amount: this.amount,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

module.exports = mongoose.model('PayTransaction', tranSchema);