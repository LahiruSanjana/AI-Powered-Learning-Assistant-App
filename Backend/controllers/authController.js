import jwt from 'jsonwebtoken';
import User from '../model/User.js';

export const generateToken = (id) => {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        const configError = new Error('JWT_SECRET is missing in environment configuration');
        configError.statusCode = 500;
        throw configError;
    }

    return jwt.sign({ id }, jwtSecret, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};

export const registerUser = async (req, res, next) => {
    try {
        const {name,email,password}= req.body;

        const existingUser = await User.findOne({ email });
        if(existingUser){
            return res.status(400).json({
                success:false,
                error:
                   existingUser.email === email
                    ? 'Email already in use'
                    : 'Username already in use',
                statusCode:400
            });
        }

        const user = await User.create({
            name,
            email,
            password
        });
        const token = generateToken(user._id);  
        res.status(201).json({
            success:true,
            data:{
                user:{
                    id:user._id,
                    name:user.name,
                    email:user.email,
                    profilePicture:user.profilePicture,
                    createdAt:user.createdAt,

                },
                token
            },
            message:'User registered successfully',
            statusCode:201
        });
    } catch (error) {
        next(error);
    }
};

export const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Please provide email and password',
                statusCode: 400
            });
        }
        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password',
                statusCode: 401
            });
        }
        const token = generateToken(user._id);
        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    profilePicture: user.profilePicture,
                    createdAt: user.createdAt
                },
                token
            },
            message: 'Login successful',
            statusCode: 200
        });

    } catch (error) {
        next(error);
    }
};

export const getUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
                statusCode: 404
            });
        }
        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                profilePicture: user.profilePicture,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            },
            message: 'User profile retrieved successfully',
            statusCode: 200
        });

    } catch (error) {
        next(error);
    }
};

export const updateUserProfile = async (req, res, next) => {
    try {
        const{name,email,profilePicture} = req.body;
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
                statusCode: 404
            });
        }
        user.name = name || user.name;
        user.email = email || user.email;
        user.profilePicture = profilePicture || user.profilePicture;
        await user.save();
        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                profilePicture: user.profilePicture,
            },
            message: 'User profile updated successfully',
            statusCode: 200
        });
    } catch (error) {
        next(error);
    }
};

export const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'Please provide current and new password',
                statusCode: 400
            });
        }
        const user = await User.findById(req.user._id).select('+password');
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Current password is incorrect',
                statusCode: 401
            });
        }

        user.password = newPassword;
        await user.save();
        res.status(200).json({
            success: true,
            message: 'Password changed successfully',
            statusCode: 200
        });
    } catch (error) {
        next(error);
    }
};


