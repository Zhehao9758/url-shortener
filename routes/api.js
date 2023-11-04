import express from "express";
import { myDB } from "../db/MyDB.js";
import bcrypt from "bcrypt";
import { body, validationResult } from "express-validator"

export const router = express.Router();

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
    body('password').notEmpty(),
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
            bcrypt.hash(password, 10, async (err, hashedPassword) => {
                if (err) {
                    return res.status(500).json({ message: "Internal server error" });
                }
                myDB
                    .createUser({
                        email: email,
                        password: hashedPassword,
                        tier: tier
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
export default router;
