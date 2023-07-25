const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Prosím zadejte jméno'],
        trim: true,
        maxLength: [30, 'Jméno nesmí být delší než 30 znaků']
    },
    email: {
        type: String,
        required: [true, 'Prosím zadejte email'],
        trim: true,
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Prosím zadejte platný email']
    },
    photo: {
        type: String,
        //default: 'https://res.cloudinary.com/dxk0bmtei/image/upload/v1628078854/avatar/avatar_cugq40.png'
    },
    role: {
        type: String,
        enum: ['user', 'actor', 'secretary', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Prosím zadejte heslo'],
        trim: true,
        minlength: [8, 'Heslo musí mít alespoň 8 znaků'],
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Potvrďte heslo prosím'],
        trim: true,
        validate: {
            validator: function(el) {
                // this only works on CREATE and SAVE!!!
                return el === this.password;
            },
            message: 'Hesla se neshodují'
        }
    },
    passwordChangedAt: Date,
    role: {
        type: String,
        default: 'user'
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
}, {
    timestamps: true
});

userSchema.pre('save', async function(next) {
    // Only run this function if password was actually modified
    if(!this.isModified('password')) return next();

    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);

    // Delete passwordConfirm field
    this.passwordConfirm = undefined;
    next();
});

userSchema.pre('save', function(next) {
    if(!this.isModified('password') || this.isNew) return next();

        // - 1s because sometimes the token is created before the password is changed
    this.passwordChangedAt = Date.now() - 1000;
    next();
});

userSchema.pre(/^find/, function(next) {
    // this points to the current query
    this.find({ active: { $ne: false } });
    next();
});


userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if(this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }

    return false;
};

userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

        console.log({ resetToken }, this.passwordResetToken)

    this.passwordResetExpires = Date.now() + (10 * 60 * 1000);

    return resetToken;
}

const User = mongoose.model('User', userSchema);

module.exports = User;
