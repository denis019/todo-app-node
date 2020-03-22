const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user');
const bcrypt = require('bcryptjs');
const {userOneId, userOne, setupDatabase, closeDatabaseConnection} = require('./fixtures/db');

beforeEach(setupDatabase);
afterAll(closeDatabaseConnection);

test('Should signup a new user', async () => {
    const response = await request(app).post('/users').send({
        name: 'Denis',
        email: 'test@test.com',
        password: 'TestPass!'
    }).expect(201);

    const user = await User.findById(response.body.user._id);
    expect(user).not.toBeNull();

    expect(response.body).toMatchObject({
        user: {
            name: 'Denis',
            email: 'test@test.com'
        },
        token: user.tokens[0].token
    });

    expect(user.password).not.toBe('TestPass!');
});

test('Should login existing user', async () => {
    const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200);

    const user = await User.findById(response.body.user._id);
    expect(user).not.toBeNull();

    expect(response.body).toMatchObject({
        token: user.tokens[0].token
    });
});

test('Should not login non existing user', async () => {
    await request(app).post('/users/login').send({
        email: 'test@test.com',
        password: 'r@ndomPassword'
    }).expect(400);
});

test('Should get profile for user', async () => {
    await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);
});

test('Should not get profile for unauthenticated user', async () => {
    await request(app)
        .get('/users/me')
        .send()
        .expect(401);
});

test('User should be able to delete account', async () => {
    await request(app)
        .delete('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);

    const user = await User.findById(userOneId);
    expect(user).toBeNull();
});

test('Delete should not be available unauthenticated user', async () => {
    await request(app)
        .delete('/users/me')
        .send()
        .expect(401);
});

test('Should upload avatar image', async () => {
    await request(app)
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .attach('avatar', 'tests/fixtures/profile.png')
        .expect(200);

    const user = await User.findById(userOneId);
    expect(user.avatar).toEqual(expect.any(Buffer));
});

test('Should update valid user fields', async () => {
    const response = await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            name: 'testName',
            email: 'test@test.com',
            password: 'hello123',
            age: 37
        })
        .expect(200);

    const user = await User.findById(userOneId);

    expect(user.name).toBe('testName');
    expect(user.email).toBe('test@test.com');
    expect(await bcrypt.compare('hello123', user.password)).toBe(true);
    expect(user.age).toBe(37);
});

test('Should not allow password which contains password word inside', async () => {
    const response = await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            password: 'password',
        })
        .expect(400);
});

test('Should not allow to update invalid properties', async () => {
    const response = await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            test: 'test',
        })
        .expect(400);
});