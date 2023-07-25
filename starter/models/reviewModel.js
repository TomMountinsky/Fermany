const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'Recenze nesmí být prázdná']
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: [true, 'Recenze musí mít hodnocení']
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Recenze musí být k představení']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Recenze musí být od uživatele']
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

reviewSchema.index({ tour: 1, user: 1}, { unique: true });

reviewSchema.pre(/^find/, function(next) {
   /** this.populate({
        path: 'tour',
        select: 'name'
    });
    this.populate({
        path: 'user',
        select: 'name photo'
    });*/
    this.populate({
        path: 'user',
        select: 'name photo'
    });
    next();
});

reviewSchema.statics.calcAverageRatings = async function(tourId) {


    // this points to the current model
    const stats = await this.aggregate([
        {
            $match: { tour: tourId }
        },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1},
                avgRating: { $avg: '$rating'}
            }
        }
    ]);

    if(stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
        ratingsQuantity: stats[0].nRating,
        ratingsAverage: stats[0].avgRating
        });
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5
            });
        }
};

reviewSchema.post('save', function() {
    // this points to the current review
    this.constructor.calcAverageRatings(this.tour);
});

//Tohle není potřeba, protože se to dělá v tourModel.js
/**reviewSchema.pre(/^findOneAnd/, async function(next) {
    this.r = await this.findOne().clone();
    console.log(this.r);
});*/

reviewSchema.post(/^findOneAnd/, async function(doc) {
    await doc.constructor.calcAverageRatings(doc.tour);
  });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;

