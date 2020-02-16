const express = require('express');
const User = require('../models/user');
const router = new express.Router();
const auth = require('../midleware/auth');
const multer = require('multer');
const sharp = require('sharp');
const { sendWelcomeEmail } = require('../emails/account');
const { sendCancelEmail } = require('../emails/account');

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res
            .status(201)
            .send({
                user,
                token
            })
        ;
    } catch (e) {
        res.status(400).send({
            error: e.message
        });
    }
});

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        });

        await req.user.save();

        res.send();
    } catch (e) {
        res.status(500).send();
    }
});

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();

        res.send();
    } catch (e) {
        console.log(e);
        res.status(500).send();
    }
});

router.get('/users/me', auth, async (req, res) => {
    res.status(200).send(req.user);
});

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = [
        'name',
        'email',
        'password',
        'age'
    ];

    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({
            error: 'Invalid updates'
        });
    }

    try {
        const user = req.user;

        if (!user) {
            return res.status(404).send();
        }

        updates.forEach((update) => user[update] = req.body[update]);
        await user.save;

        res.status(200).send(user);
    } catch (e) {
        res.status(500).send(e);
    }
});

router.post('/users', async (req, res) => {
    const user = new User(req.body);

    try {
        await user.save();
        sendWelcomeEmail(user.email, user.name);
        const token = await user.generateAuthToken();

        res.status(201).send({user, token});
    } catch (e) {
        console.log(e);
        res.status(400).send(e);
    }
});

router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove();
        sendCancelEmail(req.user.email, req.user.name);
        res.status(200).send(req.user);
    } catch (e) {
        res.status(500).send(e);
    }
});

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        console.log('test');
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            cb(new Error('File must be image'));
        }

        cb(undefined, true);
    }
});

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({
        width: 250,
        height: 250
    }).png().toBuffer();

    req.user.avatar = buffer;
    await req.user.save();
    res.send();
}, (error, req, res, nex) => {
    res.status(400).send({
        error: error.message
    });
});

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
});

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if(!user || !user.avatar) {
            throw new Error();
        }

        res.set('Content-Type', 'image/jpg');
        res.send(user.avatar);
    } catch (e) {
        res.status(404).send();
    }
});

module.exports = router;