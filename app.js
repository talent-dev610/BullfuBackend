const express = require('express');
const app = express();
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const bodyParser = require('body-parser');
const cors = require('cors')

const authRoute = require('./routes/auth'); // Import routes
const profileRoute = require('./routes/profile');
const deliveryRoute = require('./routes/delivery');
const payRoute = require('./routes/pay');
const alertsRoute = require('./routes/alerts');

// connect to db
mongoose.connect(process.env.DB_LOCAL_CONNECT, () => console.log('Connected to db'));

// middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Function to serve all static files
// inside public directory.
app.use(express.static(__dirname + '/public'));

// Route middlewares
app.use('/api', authRoute);
app.use('/api/profile', profileRoute);
app.use('/api/delivery', deliveryRoute);
app.use('/api/pay', payRoute);
app.use('/api/alerts', alertsRoute);

/// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Data Not Found');
    err.status = 404;
    next(err);
});

/// error handlers
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.json({
        success: false,
        message: err.message, //'No data for this request'
        data: {}
    });
});

// firebase
const { initializeApp } = require('firebase-admin/app');

app.listen(3000, () => console.log('Server Up and running'));