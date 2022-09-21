const mongoose = require('mongoose');
const mongooseUniqueValidator = require('mongoose-unique-validator');
const { string } = require('sharp/lib/is');


const deliverySchema = new mongoose.Schema({
    pick_up_location: {
        type: String, // (lat,lon)
        required: [true, "can't be blank"],
        trim: true
    },
    drop_off_location: {
        type: String, // (lat,lon)
        required: [true, "can't be blank"],
        trim: true
    },
    empty_return_location: {
        type: String, // (lat,lon)
        required: true,
        trim: true
    },
    container_size: {
        type: String,
        trim: true,
        required: true
    },
    container_weight: {
        type: String,
        trim: true,
        required: true
    },
    pick_up_time: {
        type: String // timestamp string value
    },
    tdo_ready: { // terminal delivery order(TDO)
        type: Boolean
    },
    consignor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "can't be blank"]
    },
    driver_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    accept_status: {
        type: String, // 1: create, 2: driver accepted 3: consignor paid the driver
        required: [true, "can't be blank"]
    },
    delivery_price: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

deliverySchema.plugin(mongooseUniqueValidator, { message: 'is already taken by others.' });

deliverySchema.methods.originalJSON = function () {
    return {
        id: this.id,
        pick_up_location: this.pick_up_location,
        drop_off_location: this.drop_off_location,
        empty_return_location: this.empty_return_location,
        container_size: this.container_size,
        container_weight: this.container_weight,
        pick_up_time: this.pick_up_time,
        tdo_ready: this.tdo_ready,
        consignor_id: this.consignor_id,
        driver_id: this.driver_id,
        accept_status: this.accept_status,
        delivery_price: this.delivery_price,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

module.exports = mongoose.model('Delivery', deliverySchema);