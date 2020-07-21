const multer = require('multer');
const fs = require('fs');
const path = require('path');

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, `./uploads/${req.params.id}/textures`);
	},
	filename: function (req, file, cb) {
		const fileName = file.originalname;

		cb(null, fileName);
	},
});

const upload = multer({
	storage,
	limits: {
		// 30 mb maximum
		fileSize: 1024 * 1024 * 50,
	},
});

module.exports = upload;