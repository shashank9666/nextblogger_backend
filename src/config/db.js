const {MongoClient} = require('mongodb');

const uri = process.env.MONGO_URI;

let client;
let db;

async function connectDB() {
    try {
        client = new MongoClient(uri);
        await client.connect();

        db = client.db("blogger");
        console.log("MongoDB connection successful...")
    } catch (error) {
        console.log(error);
    }
}

function getDB(){
    if(!db){
        throw new Error("Database Not Initialized");
    }
    return db;
}

module.exports = {connectDB, getDB};