const mongoose = require("mongoose")
const mongoDB = 'mongodb://localhost:27017/final'
const mongoDB1 = 'mongodb+srv://quan585:quan27122002@cluster0.ozlr9sa.mongodb.net/test'
mongoose.connect(mongoDB1, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
// Bind connection to error event (to get notification of connection errors)
db.on("error", console.error.bind(console, "MongoDB connection error:"));
module.export=db;