const express = require('express');
const userRouter = require('./routers/user');
const mongo = require('./db/mongoose');
const productRouter = require('./routers/product');
const categoryRouter = require('./routers/category');

const app = express();
const port = process.env.PORT || 3000;

app.use(function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', '*');
	next();
});

const bodyParser = require('body-parser');

// support parsing of application/json type post data
app.use(bodyParser.json());

//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));

const router = new express.Router();

router.get('/', async (req, res) => {
	return res.status(200).send({ message: 'Welcome to HomeFit' });
});

app.use(express.json());
app.use(userRouter);
app.use(productRouter);
app.use(categoryRouter);

app.listen(port, () => {
	console.log('Server is up on port ' + port);
});
