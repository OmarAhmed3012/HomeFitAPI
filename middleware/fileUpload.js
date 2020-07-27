const multer = require('multer');
const fs = require('fs');
const path = require('path');

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		fs.mkdir(`./uploads/${req.params.id}`, { recursive: true }, err => {
			if (err) throw err;
		});

		cb(null, `./uploads/${req.params.id}`);
	},
	filename: function (req, file, cb) {
		const fileName = file.originalname;

		cb(null, fileName);
	},
});

const upload = multer({
	storage,
	limits: {
		// 50 mb maximum
		fileSize: 1024 * 1024 * 50,
	},
});

module.exports = upload;
