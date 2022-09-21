const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decodedJwt = jwt.verify(token, process.env.JWT_KEY);
        req.userData = decodedJwt;
        next()
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: 'JWT authentication failed',
            data: {}
        });
    }
};