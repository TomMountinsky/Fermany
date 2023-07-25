const express = require('express');
const viewsController = require('./../controllers/viewsController');
const authController = require('./../controllers/authController');
const tourController = require('./../controllers/tourController');


const router = express.Router();

router.get('/', viewsController.getOverview);
router.get('/tour/:slug', viewsController.getTour);

router
    .route('/CreateTour')
    .get( viewsController.createTour)

router
    .route('/login')
    .get(viewsController.loginForm)

router
    .route('/signup')
    .get(viewsController.signupForm)


module.exports = router;