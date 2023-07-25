const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
//const User = require('./userModel');

const tourSchema = new mongoose.Schema({
    name: {
        type: String, 
        //required: [true, 'Představení musí mít název'], 
        unique: true,
        trim: true,
        maxlength: [40, 'Představení musí mít méně než 40 znaků'],
        minlength: [1, 'Představení musí mít více než 1 znak'],
        // validate: [validator.isAlpha, 'Název představení může obsahovat pouze písmena']
    },
    slug: String,
    duration: {
        type: Number
        //required: [true, 'Představení musí mít délku']
    },
    maxGroupSize: {
        type: Number
        //required: [true, 'Představení musí mít maximální počet účastníků']
    },
    difficulty: {   
        type: String,
        //required: [true, 'Představení musí mít náročnost'],
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Náročnost může být pouze: easy, medium, difficult'
        }
    },
    ratingsAverage: {
        type: Number, 
        default: 4.5,
        min: [1, 'Hodnocení musí být větší než 1.0'],
        max: [5, 'Hodnocení musí být menší než 5.0'],
        set: val => Math.round(val * 10) / 10 
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number
        //required: [true, 'Představení musí mít náklady']
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function(val) {
                //THIS ONLY POINTS TO CURRENT DOC ON !!NEW!! DOCUMENT CREATION
                return val < this.price;
            },
            message: 'Sleva ({VALUE}) nesmí být větší než cena představení'
        }
    },
    summary: {
        type: String,
        trim: true
        //required: [true, 'Představení musí mít popis']
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        trim: true
        //required: [true, 'Představení musí mít hlavní obrázek']
    },
    images: [ String ],
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    },
    startDates: [ Date ],
    secretTour: {
        type: Boolean,
        default: false
    },
    /**startLocation: {
        //GeoJSON
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [ Number ],
        address: String,
        description: String*/
    /**},
    locations: [
        {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [ Number ],
            address: String,
            description: String,
            day: Number
    
    }],*/
    actors: [
        {type: mongoose.Schema.ObjectId,
        ref: 'User'}
    ]
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere'});

tourSchema.virtual('durationWeeks').get(function() {
    return this.duration / 7;
});

//VIRTUAL POPULATE - not stored in database
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
});

//document middleware: runs before .save() and .create()
tourSchema.pre('save', function(next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

/**tourSchema.pre('save', async function(next) {
    const actorsPromises = this.actors.map(async id => await User.findById(id));
    this.actors = await Promise.all(actorsPromises);
});*/

//QUERY MIDDLEWARE
tourSchema.pre(/^find/, function(next) {
    this.find({ secretTour: { $ne: true } });
    this.start = Date.now();
    next();
});

tourSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'actors',
        select: '-__v -passwordChangedAt'
    });
    next();
});

tourSchema.post(/^find/, function(docs, next) {
    console.log(`Query took ${Date.now() - this.start} milliseconds!`);
    next();
});

//AGGREGATION MIDDLEWARE
/**tourSchema.pre('aggregate', function(next) {
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
    console.log(this.pipeline());
    next();
});*/

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
