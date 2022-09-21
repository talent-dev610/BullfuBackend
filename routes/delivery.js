const router = require('express').Router();
const { default: mongoose } = require('mongoose');
const Delivery = require('../model/Delivery');
const User = require('../model/User');
const Noti = require('../model/Noti');
const authJwt = require('../utils/authJwt');
const { on } = require('../model/Delivery');

const { sendOneAlert } = require('../utils/alerts.helper');

// consignor creates a new delivery request
router.post('/request', authJwt, (req, res, next) => {
    User.findById(req.userData.id)
        .then(function (user) {
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found.',
                    data: {}
                });
            }

            var delivery = new Delivery();

            delivery.pick_up_location = req.body.pick_up_location;
            delivery.drop_off_location = req.body.drop_off_location;
            delivery.empty_return_location = req.body.empty_return_location;
            delivery.container_size = req.body.container_size;
            delivery.container_weight = req.body.container_weight;
            delivery.pick_up_time = req.body.pick_up_time;
            delivery.tdo_ready = req.body.tdo_ready;
            delivery.consignor_id = user.id;
            delivery.accept_status = '1';

            return delivery.save().then(function () {
                return res.json({
                    success: true,
                    message: '',
                    data: delivery.originalJSON()
                });
            });
        })
        .catch(next);
});

// get all delivery requests in terms of accept_status: 1
router.get('/all-for-drivers', authJwt, async function (req, res, next) {
    await Delivery.find({
        "accept_status": '1'
    }).populate('consignor_id')
        .then(deliveries => {
            var resultData = [];
            deliveries.forEach(function (dele) {
                let one = dele.originalJSON();
                resultData.push(one);
            });
            return res.json({
                success: true,
                message: '',
                data: resultData
            });
        });
});

// driver accepts the delivery request with a price
router.post('/accept', authJwt, async (req, res, next) => {

    let user = await User.findById(req.userData.id)
    
    if (user === null || user === undefined) {
        return res.status(401).json({
            success: false,
            message: 'User not found.',
            data: {}
        });
    }
    if (user.category != '1') { // if not drvier
        return res.status(401).json({
            success: false,
            message: 'You are not a driver to accept this delivery request.',
            data: {}
        });
    }

    let delivery = await Delivery.findById(req.body.delivery_id)
        .then(async function (delivery) {
            if (delivery === null || delivery === undefined) {
                return {}
            }

            delivery.delivery_price = req.body.price;
            delivery.accept_status = '2';
            delivery.driver_id = req.userData.id;

            // fire push notification
            let alert = {
                message: 'A driver accepted your delivery request.'
            }
            let alertSent = await sendOneAlert(delivery.consignor_id, alert)
            if (alertSent) {
                console.log('alert sent successfully')
            }

            // save notification
            var noti = new Noti();
            noti.from_id = req.userData.id;
            noti.to_id = delivery.consignor_id;
            noti.delivery_id = req.body.delivery_id;
            await noti.save()

            return await delivery.save()
        });

    return res.status(401).json({
        success: true,
        message: 'Success',
        data: delivery.originalJSON()
    });
});

// get all delivery notifications for consignor in terms of accept_status: 2
router.get('/all-for-consignor', authJwt, async function (req, res, next) {
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

    var resultData = [];

    await Delivery.find({
        "accept_status": "2",
        "consignor_id": me.id
    }).populate('consignor_id').populate('driver_id')
        .then(deliveries => {
            deliveries.forEach(function (dele) {
                let one = dele.originalJSON();
                resultData.push(one);
            });

            return res.json({
                success: true,
                message: '',
                data: resultData
            });
        });

});


// get all paid delivery notifications for driver in terms of accept_status: 3
router.get('/all-paid', authJwt, async function (req, res, next) {
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

    var resultData = [];

    if (me.category == "0") { // consignor
        await Delivery.find({
            "accept_status": "3",
            "consignor_id": me.id
        }).then(deliveries => {
            deliveries.forEach(function (dele) {
                let one = dele.originalJSON();
                resultData.push(one);
            });

            return res.json({
                success: true,
                message: '',
                data: resultData
            });
        });
    } else { // driver
        await Delivery.find({
            "accept_status": "3",
            "driver_id": me.id
        }).then(deliveries => {
            deliveries.forEach(function (dele) {
                let one = dele.originalJSON();
                resultData.push(one);
            });

            return res.json({
                success: true,
                message: '',
                data: resultData
            });
        });
    }
});

module.exports = router;