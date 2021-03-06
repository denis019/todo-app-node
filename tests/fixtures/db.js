const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../../src/models/user');

const userOneId = new mongoose.Types.ObjectId();
const userOne = {
    _id: userOneId,
    name: 'Mike',
    email: 'mike@example.com',
    password: 'testPass11!',
    tokens: [{
        token: jwt.sign({
                _id: userOneId
            }, process.env.JWT_SECRET
        )
    }]
};

const setupDatabase = async () => {
    await User.deleteMany({});
    await new User(userOne).save();
};

const closeDatabaseConnection = async () => {
    await mongoose.connection.close()
};

module.exports = {
    userOneId,
    userOne,
    setupDatabase,
    closeDatabaseConnection
};