const Tour = require('./../models/tourModel'); 
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const tourController = require('./tourController');


exports.getOverview = catchAsync(async(req, res, next) => {
    //1 get tour data from collection
    const tours = await Tour.find();
    //2 build template

    //3 render that template using tour data from step 1
        res.status(200).render('pages/index', {
            title: 'Vítejte na našem webu',
            tours: tours
        });
    });

exports.getTour = catchAsync(async (req, res, next) => {

    const tour = await Tour.findOne({ slug: req.params.slug })

    res.status(200).render('pages/tour', {
        title: 'Představení',
        tour: tour
    })}
    );

exports.createTour = catchAsync(async (req, res, next) => {

    res.status(200).render('pages/createTour', {
        title: 'Tvroba akce',
    })
});

exports.loginForm = (req, res) => {


    res.status(200).render('pages/login', {
        title: 'Přihlašování',
    })
}

exports.signupForm = (req, res) => {

    res.status(200).render('pages/signup', {
        title: 'Registrace',
    })
}



/**exports.createTour = Model => catchAsync(async (req, res, next) => {
    
    res.status(200).render('pages/createTour', {
        title: 'Prohlídka',
        tour: tour
    })

    const newTour = await Model.create(req.body);
    const tour = new Tour(NewTour);
    tour.save().then(doc => {
        res.send(doc);
    })
}); */
