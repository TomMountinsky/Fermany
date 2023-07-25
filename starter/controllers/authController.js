const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = id => {
    return jwt.sign({
        id: id
    }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN*24*60*60*1000),
        httpOnly: true
    };

    if(process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    res.cookie('jwt', token, cookieOptions);
    
    // Remove password from output
    user.password = undefined;
    
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
});
};

exports.signup = catchAsync(async (req, res, next) => {
    
    const newUser = await User.create(req.body);
    /**const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm
    });*/
    createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    

    // 1) Check if email and password exist
    if(!email || !password) {
        return next(new AppError('Prosím zadejte email a heslo', 400));
    }
    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');

    if(!user || !await user.correctPassword(password, user.password)) {
        return next(new AppError('Nesprávný email nebo heslo', 401));
    }

    // 3) If everything ok, send token to client
    createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {

    // 1) Getting token and check of it's there
    let token;
    if (
        req.headers.authorization && 
        req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies.jwt) {
            token = req.cookies.jwt;
        }

    if(!token) {
        return next(new AppError('Uživatel není přihlášen! Přihlašte se prosím, abyste získali přístup.', 401));
    }
    // 2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if(!currentUser) {
        return next(new AppError('Uživatel k tomuto tokenu již neexistuje.', 401));
    }

    // 4) Check if user changed password after the token was issued
    if(currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('Uživatel nedávno změnil heslo! Přihlašte se prosím znovu.', 401));
    }

    // grant access to protected route
    req.user = currentUser;
    next()
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles ['admin', 'secretary']. role='user'
        if(!roles.includes(req.user.role)) {
            return next(new AppError('Nemáte oprávnění provádět tuto akci', 403));
        }
        next();
    };
};
    
exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });
    if(!user) {
        return next(new AppError('Uživatel s tímto emailem neexistuje', 404));
    }

    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) Send it to user's email
    const resetURL = `${req.protocol}://${req.get(
        'host'
        )}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Zapomněli jste heslo? Zadejte nové heslo pomocí tohoto odkazu: ${resetURL}.\nPokud jste si nevyžádali reset hesla, prosím ignorujte tento email.`;

    try {
    await sendEmail({
        email: user.email,
        subject: 'Reset hesla (platný 10 minut)',
        message
    });

    res.status(200).json({
        status: 'success',
        message: 'Token odeslán na email!'
    });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError('Při odesílání emailu došlo k chybě. Zkuste to prosím později!', 500));
    }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on the token
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken, 
        passwordResetExpires: { $gt: Date.now() } });

    // 2) If token has not expired, and there is user, set the new password

    if(!user) {
        return next(new AppError('Token je neplatný nebo vypršel', 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3) Update changedPasswordAt property for the user



    // 4) Log the user in, send JWT
    createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    // 1) Get user from the collection
    const user = await User.findById(req.user.id).select('+password');

    // 2) Check if POSTed current password is correct
    if(!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Vaše aktuální heslo je nesprávné', 401));
    }

    // 3) If so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    // User.findByIdAndUpdate will NOT work as intended!

    // 4) Log user in, send JWT
    createSendToken(user, 200, res);
});
