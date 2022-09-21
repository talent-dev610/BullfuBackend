const admin = require('./firebase.db');
const User = require('../model/User');

module.exports.sendOneAlert = async (userId, data) => {

    let user = await User.findById(userId)
    if (user === null || user === undefined) {
        return
    }
    let token = user.fcm_token

    let payload = {
        notification: {
            title: 'Bullhu',
            body: data.message
        }
    }
    if (token === "") {
        admin.messaging().sendToDevice(token, payload)
            .then(res => {
                console.log("Notification sent successfully.", token)
                return
            })
            .catch(err => {
                console.log(err)
                return
            })
    }
}