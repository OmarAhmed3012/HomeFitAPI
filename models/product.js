const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			required: true,
			trim: true,
		},
		price: {
			type: Number,
			default: 0,
		},

		color: {
			type: String,
			required: true /*,
        validate(value) {
            if(!(value )) {console.log(value)}
            if (!(value )) {
                throw new Error('the width must be a positive number' + value)
            }*/,
		},

		width: {
			type: Number,
			required: true,
			validate(value) {
				if (!(value > 0)) {
					console.log(value);
				}
				if (!(value > 0)) {
					throw new Error(
						'the width must be a positive number' + value
					);
				}
			},
		},
		height: {
			type: Number,
			required: true,
			validate(value) {
				if (!(value > 0)) {
					console.log(value);
				}
				if (!(value > 0)) {
					throw new Error(
						'the height must be a positive number' + value
					);
				}
			},
		},

		depth: {
			type: Number,
			required: true,
			validate(value) {
				if (!(value > 0)) {
					console.log(value);
				}
				if (!(value > 0)) {
					throw new Error(
						'the depth must be a positive number' + value
					);
				}
			},
		},
		model_path: {
			type: String,
		},

		categoryId: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: 'Category',
		},

		/*,
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }*/
		image: {
			type: Buffer,
		},
	},
	{
		timestamps: true,
	}
);

productSchema.methods.toJSON = function () {
	const product = this;
	const productObject = product.toObject();

	delete productObject.image;

	return productObject;
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
