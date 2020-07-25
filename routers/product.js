const express = require('express');
const Product = require('../models/product');
const auth = require('../middleware/auth');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const router = new express.Router();
const uploadFile = require('../middleware/fileUpload');
const uploadTexture = require('../middleware/textureUpload');
const { default: Axios } = require('axios');
var rimraf = require('rimraf');

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

router.get('/', async (req, res) => {
	try {
		return res.status(200).json('Welcome to HomeFit!');
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
		await Product.countDocuments({}, function (err, count) {
			if (!count) {
				return res.status(404).send(err);
			} else {
				res.json(count);
			}
		});
	} catch (e) {
		res.status(500).send(e);
	}
});

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
		'model_path',
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
	'/products/:id/model/',
	uploadFile.array('productModel'),

	async (req, res) => {
		try {
			const product = await Product.findById(req.params.id);
			for (let i = 0; i < req.files.length; i++) {
				if (
					req.files[i].path.substr(req.files[i].path.length - 5) ===
					'.gltf'
				) {
					let modelPath = req.files[i].path;
					product.model_path = modelPath.replace('\\', '/');
					product.model_path = product.model_path.replace('\\', '/');
					product.model_path = '/' + product.model_path;
					product.save();
					res.status(200).json({ product });
				}
			}
			res.status(404).json({ error: 'gltf file not found' });
		} catch (error) {
			res.status(500).json({ error });
		}
	}
);

router.post(
	'/products/:id/texture',
	uploadTexture.array('productTexture'),

	async (req, res) => {
		try {
			res.status(200).json({ message: 'Texture uploaded!' });
		} catch (error) {
			res.status(500).json({ error });
		}
	}
);

router.get('/products/:id/model', async (req, res) => {
	try {
		const product = await Product.findById(req.params.id).select('_id');
		if (!product) {
			res.status(404).send({ error: 'Product not found!' });
		}
		const modelFolder = `./uploads/${product._id}`;
		fs.readdir(modelFolder, (err, files) => {
			files.forEach(filename => {
				if (filename.substr(filename.length - 5) === '.gltf') {
					var file = fs.createReadStream(
						`./uploads/${product._id}/${filename}`
					);
					var stat = fs.statSync(
						`./uploads/${product._id}/${filename}`
					);
					res.setHeader('Content-Length', stat.size);
					res.setHeader(
						'Content-Disposition',
						`inline; filename=${filename}`
					);
					file.pipe(res);
				}
			});
		});
	} catch (e) {
		res.status(404).send({ error: e });
	}
});

router.get('/products/:id/:modelFile', async (req, res) => {
	try {
		const product = await Product.findById(req.params.id).select('_id');
		if (!product) {
			res.status(404).send({ error: 'Product not found!' });
		}
		var file = fs.createReadStream(
			`./uploads/${product._id}/${req.params.modelFile}`
		);
		//res.setHeader('Content-Type', 'model/gltf+json');
		//res.setHeader('Content-Encoding', 'gzip');
		//res.setHeader('X-Content-Type-Options', 'nosniff');
		//res.setHeader('X-Frame-Options', 'deny');
		//const url = `https://${req.headers.host}/uploads/${product._id}/scene.gltf`;
		//const { data } = await Axios.get(url);
		file.pipe(res);
		//res.redirect(url);
	} catch (e) {
		res.status(404).send({ error: e });
	}
});

router.get('/products/:id/textures/:texture', async (req, res) => {
	try {
		const product = await Product.findById(req.params.id).select('_id');
		if (!product) {
			res.status(404).send({ error: 'Product not found!' });
		}
		var file = fs.createReadStream(
			`./uploads/${product._id}/textures/${req.params.texture}`
		);
		var stat = fs.statSync(
			`./uploads/${product._id}/textures/${req.params.texture}`
		);
		res.setHeader('Content-Length', stat.size);
		//res.setHeader('Content-Type', 'model/gltf+json');
		res.setHeader(
			'Content-Disposition',
			`inline; filename=${req.params.texture}`
		);
		//res.setHeader('Content-Encoding', 'gzip');
		//res.setHeader('X-Content-Type-Options', 'nosniff');
		//res.setHeader('X-Frame-Options', 'deny');
		//const url = `https://${req.headers.host}/uploads/${product._id}/scene.gltf`;
		//const { data } = await Axios.get(url);
		file.pipe(res);
		//res.redirect(url);
	} catch (e) {
		res.status(404).send({ error: e });
	}
});

router.get('/products/:id/model/:texture', async (req, res) => {
	try {
		const product = await Product.findById(req.params.id).select('_id');
		if (!product) {
			res.status(404).send({ error: 'Product not found!' });
		}
		const url = `http://${req.headers.host}/uploads/${product._id}/textures/${req.params.texture}`;
		const { data } = await Axios.get(url);
		res.set('Content-Type', 'image/png');
		res.send(data);
	} catch (e) {
		res.status(404).send({ error: e });
	}
});

router.delete('/products/:id/model', async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);
		product.model_path = '';
		product.save();
		// await Axios.patch(`${req.headers.host}/products/${id}`, {
		// 	model_path: 'test',
		// });
		fs.rmdir(`uploads/${req.params.id}`, { recursive: true }, err => {
			if (err) throw err;
		});
		res.json({ message: 'Model path deleted!' });
	} catch (e) {
		res.status(404).send();
	}
});

// router.get('/uploads/5/scene.gltf', async (req, res) => {
// 	try {
// 		res.set('Content-Type', 'application/json');
// 		console.log('hello');
// 	} catch (e) {
// 		res.status(404).send();
// 	}
// });

module.exports = router;
