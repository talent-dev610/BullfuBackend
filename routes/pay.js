const router = require('express').Router();
const dotenv = require('dotenv');
dotenv.config();
const { check, validationResult } = require("express-validator");
const PaymentGateway = require('../utils/PaymentGateway');
const authJwt = require('../utils/authJwt');
const Delivery = require('../model/Delivery');
const PayTransaction = require('../model/PayTransaction');
const User = require('../model/User');
const { sendOneAlert } = require('../utils/alerts.helper');


router.post('/initialize-payment',
	[
		check("amount", "Amount field is empty").not().isEmpty(),
		check("email", "Email field is empty").not().isEmpty(),
	],
	async (req, res) => {
		try {
			const fieldError = validationResult(req);
			if (!fieldError.isEmpty()) {
				return res.status(500).json({
					success: false,
					message: "Error",
					data: fieldError.array()
				});
			}
			let { amount, email } = req.body;
			let initData = await PaymentGateway.initialize({
				amount,
				email,
			});
			return res.json({
				success: true,
				message: '',
				data: initData.data,
			});
		} catch (error) {
			return res.status(400).json({
				success: false,
				message: "Server Error",
				data: {}
			});
		}
	}
);
router.get("/verify-payment", async (req, res) => {

	console.log('verify-payment')

	try {
		const { reference } = req.query;
		let verifyData = await PaymentGateway.verify({
			reference,
		});
		if (!verifyData.status) {
			return res.json({
				msg: "Unsuccessful verification, if deducted please contact our support team",
				data: null,
			});
		}
		
		return res.json({
			msg: "Successful",
			data: verifyData,
		});
	} catch (error) {
		return res.json({
			msg: "Server Error",
		});
	}
});

router.post("/verify", async (req, res) => {
	let reference = req.body.reference
	let deliveryId = req.body.delivery_id

	let verifyData = await PaymentGateway.verify({
		reference,
	});

	if (!verifyData.status || verifyData === null || verifyData === undefined) {
		return res.status(401).json({
			success: false,
			message: 'Unsuccessful verification, if deducted please contact our support team',
			data: {}
		});
	}

	let payStatus = verifyData.data.data.status
	if (payStatus != 'success') {
		return res.status(401).json({
			success: false,
			message: payStatus,
			data: {}
		});
	}
	// update delivery accept_status => 3 once it is paid
	// find delivery
	let delivery = await Delivery.findById(deliveryId)
	delivery.accept_status = "3"
	await delivery.save()

	let driverId = delivery.driver_id
	let consignorId = delivery.consignor_id

	// fire push notification
	let alert = {
		message: 'A consignor paid for your delivery service.'
	}
	let alertSent = await sendOneAlert(driverId, alert)
	if (alertSent) {
		console.log('alert sent successfully')
	}

	var transaction = new PayTransaction();
	transaction.consignor_id = delivery.consignor_id
	transaction.driver_id = delivery.driver_id
	transaction.delivery_id = deliveryId
	transaction.reference = reference
	transaction.paidAt = verifyData.data.data.paidAt
	transaction.amount = verifyData.data.data.amount
	await transaction.save()

	console.log('paidAt', verifyData.data.data.paidAt)

	return res.json({
		success: true,
		message: 'Successful',
		data: verifyData,
	});
});

router.get('/all-transaction', authJwt, async function (req, res, next) {
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

	if (me.category === "0") { // consignor
		await PayTransaction.find({
			"consignor_id": me.id
		}).then(transactions => {
			transactions.forEach(function (trans) {
				let one = trans.originalJSON();
				resultData.push(one);
			});

			return res.json({
				success: true,
				message: '',
				data: resultData
			});
		});
	} else {
		await PayTransaction.find({
			"driver_id": me.id
		}).then(transactions => {
			transactions.forEach(function (trans) {
				let one = trans.originalJSON();
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