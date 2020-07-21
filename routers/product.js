const express = require('express');
const Product = require('../models/product');
const auth = require('../middleware/auth');
const multer = require('multer');
const sharp = require('sharp');
const router = new express.Router();
const uploadFile = require('../middleware/fileUpload');

router.post('/products/:id', async (req, res) => {
	const product = new Product({
		...req.body,
		categoryId: req.params.id,
	});

	try {
		await product.save();
		res.status(201).send(product);
	} catch (e) {
		res.status(400).send(e);
	}
});

// GET /products?limit=10&skip=20
router.get('/products', async (req, res) => {
	try {
		const limit = parseInt(req.query.limit);
		const skip = parseInt(req.query.skip);

		const products = await Product.find({}).skip(skip).limit(limit);

		return res.status(200).json(products);
	} catch (e) {
		return res.status(500).json(e);
	}
});

router.get('/allproducts', async (req, res) => {
	// const _id = req.params.id

	try {
		const products = await Product.find();

		if (!products) {
			return res.status(404).send();
		}

		res.send(products);
	} catch (e) {
		res.status(500).send();
	}
});

router.get('/products/:id', async (req, res) => {
	const _id = req.params.id;

	try {
		const product = await Product.findOne({ _id });

		if (!product) {
			return res.status(404).send();
		}

		res.send(product);
	} catch (e) {
		res.status(500).send();
	}
});

router.get('/totalproducts', async (req, res) => {
	try {
		await Product.countDocuments({}, function(err, count) {
			if (!count) {
				return res.status(404).send(err);
			}
			else {
				res.json(count)
			}
		})
	}
	catch (e) {
		res.status(500).send(e)
	}
})

//Get Products in the Category

router.get('/categoryProducts/:id', async (req, res) => {
	const _id = req.params.id;
	console.log(req.params.id);

	try {
		const products = await Product.find({ categoryId: req.params.id });

		if (!products) {
			return res.status(404).send();
		}

		res.send(products);
	} catch (e) {
		res.status(500).send();
	}
});

router.patch('/products/:id', async (req, res) => {
	const updates = Object.keys(req.body);
	const allowedUpdates = [
		'name',
		'description',
		'price',
		'categoryId',
		'image',
		'color',
		'width',
		'height',
		'depth',
	];
	const isValidOperation = updates.every(update =>
		allowedUpdates.includes(update)
	);

	if (!isValidOperation) {
		return res.status(400).send({ error: 'Invalid updates!' });
	}

	try {
		const product = await Product.findOne({ _id: req.params.id });

		if (!product) {
			return res.status(404).send();
		}

		updates.forEach(update => (product[update] = req.body[update]));
		await product.save();
		res.send(product);
	} catch (e) {
		res.status(400).send(e);
	}
});

router.delete('/products/:id', async (req, res) => {
	Product.deleteOne({ _id: req.params.id })
		.exec()
		.then(result => {
			return res.status(200).json({ message: 'Product deleted' });
		})
		.catch(err => {
			return res.status(500).json({ error: err });
		});
});

const upload = multer({
	limits: {
		fileSize: 1000000,
	},
	fileFilter(req, file, cb) {
		if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
			return cb(new Error('Please upload an image'));
		}

		cb(undefined, true);
	},
});

router.post(
	'/products/:id/image',
	upload.single('image'),
	async (req, res) => {
		const buffer = await sharp(req.file.buffer)
			.resize({ width: 250, height: 250 })
			.png()
			.toBuffer();
		const product = await Product.findOne({ _id: req.params.id });
		product.image = buffer;
		await product.save();
		res.send();
	},
	(error, req, res, next) => {
		res.status(400).send({ error: error.message });
	}
);

router.delete('/products/:id/image', async (req, res) => {
	const product = await Product.findOne({ _id: req.params.id });
	product.image = undefined;
	await product.save();
	res.send();
});

router.get('/products/:id/image', async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);

		if (!product || !product.image) {
			throw new Error();
		}

		res.set('Content-Type', 'image/png');
		res.send(product.image);
	} catch (e) {
		res.status(404).send();
	}
});

router.post(
	'/products/:id/model/:folderId',
	uploadFile.array('productModel'),

	async (req, res) => {
		try {
			let modelPath = req.files[0].path;
			const product = await Product.findById(req.params.id);
			product.model_path = modelPath.replace('\\', '/');
			product.model_path = product.model_path.replace('\\', '/');
			product.model_path = '/' + product.model_path;
			product.save();
			res.status(200).json({ product });
		} catch (error) {
			res.status(500).json({ error });
		}
	}
);

// router.get('/products/:id/model', async (req, res) => {
// 	try {
// 		const product = await Product.findById(req.params.id);

// 		if (!product) {
// 			res.status(404).send({ error: 'Product not found!' });
// 		}
// 		res.set('Content-Type', 'application/json');
// 		const model = await router.get(product.model_path);
// 		console.log(model);
// 		res.send(model);
// 	} catch (e) {
// 		res.status(404).send();
// 	}
// });

// router.get('/uploads/5/scene.gltf', async (req, res) => {
// 	try {
// 		res.set('Content-Type', 'application/json');
// 		console.log('hello');
// 	} catch (e) {
// 		res.status(404).send();
// 	}
// });

module.exports = router;
