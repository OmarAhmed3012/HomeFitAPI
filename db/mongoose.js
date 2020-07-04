const mongoose = require('mongoose');
const {Consts} = require('../consts/consts.js');


mongoose.connect('mongodb+srv://user:' + Consts.MONGOPASS + '@cluster0-ddq7s.mongodb.net/test?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("connected to th db");
}).catch((err) => {
    console.log(err);
});
