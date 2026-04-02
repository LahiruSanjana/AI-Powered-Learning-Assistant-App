const notFound = (req, res, next) => {
	const error = new Error(`Route not found - ${req.originalUrl}`);
	res.status(404);
	next(error);
};

const errorHandler = (err, req, res, next) => {
	if (err.statusCode && res.statusCode === 200) {
		res.status(err.statusCode);
	}

	let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
	let message = err.message || 'Internal Server Error';

	// Mongoose bad ObjectId
	if (err.name === 'CastError') {
		statusCode = 400;
		message = `Invalid ${err.path}: ${err.value}`;
	}

	// Mongoose validation errors
	if (err.name === 'ValidationError') {
		statusCode = 400;
		message = Object.values(err.errors)
			.map((validationError) => validationError.message)
			.join(', ');
	}

	// Mongo duplicate key
	if (err.code === 11000) {
		statusCode = 409;
		const duplicateField = Object.keys(err.keyValue || {})[0] || 'field';
		message = `Duplicate value for ${duplicateField}`;
	}

	// JWT auth errors
	if (err.name === 'JsonWebTokenError') {
		statusCode = 401;
		message = 'Invalid token';
	}

	if (err.name === 'TokenExpiredError') {
		statusCode = 401;
		message = 'Token expired';
	}

	// Multer file upload errors
	if (err.name === 'MulterError') {
		statusCode = 400;
		message = err.message;
	}

	res.status(statusCode).json({
		success: false,
		message,
		statusCode,
		stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
	});
};

export { notFound, errorHandler };
export default errorHandler;
