const mongoose = require('mongoose');
const Product = require('./product');

const categorySchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    image: {
        type: Buffer
    }
})

categorySchema.virtual('products', {
    ref: 'Product',
    localField: '_id',
    foreignField: 'categoryId'
})


const Category = mongoose.model('Category', categorySchema)

module.exports = Category