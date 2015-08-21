require('node-env-file')(__dirname + '/../.env');

var user = require('../library/components/user');

user.create({
    username: 'hotchkissmade',
    password: 'password',
    firstname: 'Kyle',
    lastname: 'Hotchkiss',
    role: 'admin'
});
