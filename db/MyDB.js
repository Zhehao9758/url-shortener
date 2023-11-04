import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const MyDB = () => {
    const uri = process.env.MONGO_URL||"mongodb://localhost:27017";
    const myDB = {};

    const connect = () => {
        const client = new MongoClient(uri);
        const db = client.db("urlShortener");
        return { client, db };
    };

    myDB.getUser = async (query = {}) => {
        const { client, db } = connect();
        const userCollection = db.collection("users");
        try {
            return userCollection.findOne(query);
        } catch (e) {
            await client.close();
        }
    };

    myDB.createUser = async (doc = {}) => {
        const { client, db } = connect();
        const userCollection = db.collection("users");
        try {
            return userCollection.insertOne(doc);
        } catch (e) {
            await client.close();
        }
    };

    return myDB;
};

export const myDB = MyDB();
