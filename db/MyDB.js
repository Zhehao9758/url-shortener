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

    myDB.createUser = async ( doc = {} ) => {
        const { client, db } = connect();
        const userCollection = db.collection("users");
        try {
            return userCollection.insertOne(doc);
        } catch (e) {
            await client.close();
        }
    };

    myDB.getAllUrls = async ( query = {} ) => {
        const { client, db } = connect();
        const urlCollection = db.collection("urls");
        try {
            return urlCollection.find(query).toArray();
        } catch (e) {
            await client.close();
        }
    }

    myDB.existsShortCode = async ( query = {} ) => {
        const { client, db } = connect();
        const urlCollection = db.collection("urls");
        try {
            return urlCollection.findOne(query);
        } catch (e) {
            await client.close();
        }
    }

    myDB.generateShortUrl = async ( doc = {} ) => {
        const { client, db } = connect();
        const userCollection = db.collection("users");
        const urlCollection = db.collection("urls");
        try {
            const session = client.startSession();
            let result;

            // use transaction to make two operations atomic
            // in users collection there is a field requests counter
            await session.withTransaction(async () => {
                result = await urlCollection.insertOne(doc);
                await userCollection.updateOne({ _id: doc.userId }, { $inc: { requests: 1 } });
            });
            return result;
        } catch (e) {
            await client.close();
        }
    }

    myDB.deleteShortUrl = async ( doc = {} ) => {
        const { client, db } = connect();
        const userCollection = db.collection("users");
        const urlCollection = db.collection("urls");
        try {
            const session = client.startSession();
            let result;
            await session.withTransaction(async () => {

                // use transaction to make two operations atomic
                result = await urlCollection.deleteOne(doc);
                await userCollection.updateOne({ _id: doc.userId }, { $inc: { requests: -1 } });
            });
            return result;
        } catch (e) {
            await client.close();
        }
    }

    myDB.getLongUrl = async ( query = {} ) => {
        const { client, db } = connect();
        const urlCollection = db.collection("urls");
        try {
            const result = await urlCollection.findOne(query);
            return result? result.long_url: null;
        } catch (e) {
            await client.close();
        }
    }

    return myDB;
};

export const myDB = MyDB();
