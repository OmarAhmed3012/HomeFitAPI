const express = require('express')
const Product = require('../models/product')
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')
const router = new express.Router()

router.post('/products/:id', async (req, res) => {
    
    const product = new Product({
        ...req.body,
        categoryId: req.params.id
    })

    try {
        await product.save()
        res.status(201).send(product)
    } catch (e) {
        res.status(400).send(e)
    } 
})
/*
// GET /products?completed=true
// GET /products?limit=10&skip=20
// GET /products?sortBy=createdAt:desc
router.get('/products', async (req, res) => {
    const match = {}
    const sort = {}

    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    try {
        await req.user.populate({
            path: 'products',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.products)
    } catch (e) {
        res.status(500).send()
    }
})*/



router.get('/products', async (req, res) => {
   // const _id = req.params.id

    try {
        const products = await Product.find();

        if (!products) {
            return res.status(404).send()
        }

        res.send(products)
    } catch (e) {
        res.status(500).send()
    }
})



router.get('/products/:id', async (req, res) => {
    const _id = req.params.id

    try {
        const product = await Product.findOne({ _id })

        if (!product) {
            return res.status(404).send()
        }

        res.send(product)
    } catch (e) {
        res.status(500).send()
    }
})

//Get Products in the Category

router.get('/productscat/:id', async (req, res) => {
    const _id = req.params.id
    console.log(req.params.id)

    try {
        
        const products = await Product.find({ categoryId: req.params.id })

        if (!products) {
            return res.status(404).send()
        }

        res.send(products)
    } catch (e) {
        res.status(500).send()
    }
})


router.patch('/products/:id', async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'description', 'price', 'category', 'image', 'color', 'width', 'height', 'depth']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {
        const product = await Product.findOne({ _id: req.params.id})

        if (!product) {
            return res.status(404).send()
        }

        updates.forEach((update) => product[update] = req.body[update])
        await product.save()
        res.send(product)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/products/:id', async (req, res) => {
    try {
        const product = await Product.findOneAndDelete({ _id: req.params.id })

        if (!product) {
            res.status(404).send()
        }

        res.send(product)
    } catch (e) {
        res.status(500).send()
    }
})


const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image'))
        }

        cb(undefined, true)
    }
})

router.post('/products/:id/image', upload.single('image'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    const product = await Product.findOne({ _id: req.params.id })
    product.image = buffer
    await product.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

router.delete('/products/:id/image', async (req, res) => {
    const product = await Product.findOne({ _id: req.params.id })
    product.image = undefined
    await product.save()
    res.send()
})

router.get('/products/:id/image', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)

        if (!product || !product.image) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(product.image)
    } catch (e) {
        res.status(404).send()
    }
})

module.exports = router