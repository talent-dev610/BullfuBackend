const axios = require("axios");
module.exports = {
	initialize: async (data) => {
		try {
			let refData = await axios.post(
				`${process.env.PAYSTACK_INITIALIZE_ENDPOINT}`,
				{
					email: data.email,
					name: data.name,
					amount: Number(data.amount) * 100,
				},
				{
					headers: {
						Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
						"content-type": "application/json",
					},
				}
			);

			return {
				status: true,
				data: {
					authorization_url: refData.data.data.authorization_url,
					reference: refData.data.data.reference,
				},
			};
		} catch (error) {
			console.log(error.message, " paystack error message ");
			return {
				status: false,
				data: null,
			};
		}
	},
	verify: async (data) => {
		try {
			let verifyData = await axios.get(
				`${process.env.PAYSTACK_VERIFY_ENDPOINT}${data.reference}`,
				{
					headers: {
						Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
						"content-type": "application/json",
					},
				}
			);
			if (!verifyData.data.status) {
				return {
					status: false,
					data: null,
				};
			}
			
			return {
				status: true,
				data: verifyData.data,
			};
		} catch (error) {
			return {
				status: false,
				data: null,
			};
		}
	},
};
