import express from "express";
import { myDB } from "../db/MyDB.js";
import bcrypt from "bcrypt";
import { body, validationResult } from "express-validator"
import shortid from "shortid"
import dotenv from "dotenv";
import {ObjectId} from "mongodb";
dotenv.config();

export const router = express.Router();

const baseurl = (process.env.BASE_URL || "localhost:3000") + "/"
router.post("/users/login", [
    body('email').notEmpty().isEmail(),
    body('password').notEmpty(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    myDB.getUser({ email: email }).then((existingUser) => {
        if (!existingUser) {
            return res.status(401).json({ message: "Wrong email or password" });
        }
        bcrypt.compare(password, existingUser.password, (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Internal server error" });
            }
            if (result) {
                return res.status(200).json({ message: "Login successful" });
            } else {
                return res.status(401).json({ message: "Wrong email or password" });
            }
        });
    });
});

router.post("/users/register", [
    body('email').notEmpty().isEmail(),
    body('password')
        .notEmpty()
        .isLength({min: 6, max: 20}),
    // for now the tier can only be either 1 or 2
    body('tier').notEmpty().isIn(['1', '2'])
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email, password, tier } = req.body;
    myDB.getUser({ email: email }).then((existingUser) => {
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        } else {

            // store encrypted password
            bcrypt.hash(password, 10, async (err, hashedPassword) => {
                if (err) {
                    return res.status(500).json({ message: "Internal server error" });
                }
                myDB
                    .createUser({
                        email: email,
                        password: hashedPassword,
                        tier: tier,
                        requests: 0
                    })
                    .then((result) => {
                        if (result) {
                            return res
                                .status(201)
                                .json({ message: "User registered successfully" });
                        } else {
                            return res
                                .status(400)
                                .json({ message: "User registration failed" });
                        }
                    })
                    .catch((error) => {
                        console.log(error);
                        return res.status(500).json({ message: "Internal server error" });
                    });
            });
        }
    });
});

// shorten a long url
router.post("/urls/shorten", [
    body('_id').notEmpty(),
    body('long_url').isURL(),
    body('preferred').optional().isString().isAlphanumeric()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { _id, long_url, preferred } = req.body
    myDB.getUser({ _id : new ObjectId(_id) }).then(async (existingUser) => {
        if (!existingUser) {
            return res.status(400).json({message: "User not found"});
        } else if (existingUser.requests >= 1500 - 500 * existingUser.tier) {
            // reached max requests
            return res.status(429).json({message: "Too many requests for this user"})
        } else {
            let shortCode;
            if (preferred) {
                // if provide preferred, check if it is available, or return error message
                shortCode = preferred;
                if (await myDB.existsShortCode({shortCode: baseurl + shortCode})) return res
                    .status(400)
                    .json({message: "Preferred short url not available"});
            } else {
                shortCode = shortid.generate();
                // shortCode must be unique, keep trying to get an available one
                while (await myDB.existsShortCode({shortCode: baseurl + shortCode})) {
                    shortCode = shortid.generate();
                }
            }
            myDB.generateShortUrl({
                userId: new ObjectId(_id),
                long_url: long_url,
                shortCode: baseurl + shortCode
            })
                .then((result) => {
                    if (result) {
                        return res
                            .status(201)
                            .json({
                                shortUrl: baseurl + shortCode,
                                message: "Url shortened successfully"
                            });
                    } else {
                        return res
                            .status(400)
                            .json({message: "Url shortens failed"});
                    }
                })
                .catch((error) => {
                    console.log(error);
                    return res.status(500).json({message: "Internal server error"});
                });
        }
    });
});


//delete short url of a user
router.delete('/users/:userId/:shortCode',async (req, res) => {
    const { userId, shortCode } = req.params;
    myDB.deleteShortUrl({ userId: new ObjectId(userId), shortCode: baseurl + shortCode })
            .then((result) => {
                if (result.deletedCount === 1) {
                    return res
                        .status(200)
                        .json({
                            message: "Short url deleted successfully" });
                } else {
                    return res
                        .status(400)
                        .json({ message: "Short url deletes failed" });
                }
            })
            .catch((error) => {
                console.log(error);
                return res.status(500).json({ message: "Internal server error" });
            });
});

// find all urls of a given user
router.get('/users/:userId/urls', async (req, res) => {
    const { userId } = req.params;
    try {
        const urls = await myDB.getAllUrls({ userId: new ObjectId(userId) });
        res.json(urls);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// redirect from short to long
router.get('/:shortCode', async (req, res) => {
    const {shortCode} = req.params;
    let longUrl = await myDB.getLongUrl({shortCode: baseurl + shortCode});
    if (longUrl) {

        // add prefix to make it an absolute url
        if (!longUrl.startsWith('http://') && !longUrl.startsWith('https://')) {
            longUrl = 'http://' + longUrl;
            res.redirect(longUrl);
        }
    } else {
        // no corresponding long url
        res.status(404).json({error: 'URL not found'});
    }
});
export default router;
