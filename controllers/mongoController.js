var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true}, (err) => {
    if (err) {
        console.log('MongoDB failed to connect');
    }

    console.log('Connected to MongoDB');

    let db = mongoose.connection;
    db.on('error', console.error.bind(console, 'MongoDB error:'));
});

var schema = Schema({
    guid: {type: String},
    status: {type: String},
    first_seen: {type: Date, default: Date.now},
});

var Banned = mongoose.model('Banned', schema);

module.exports = function () {
    var mongoController = {};

    mongoController.saveMultiple = function(steamids) {
        return Promise.all(steamids.map(steamid => mongoController.save(steamid)))
    }

    mongoController.save = function(steamid) {
        return new Promise((resolve, reject) => {
            Banned.findOne({
                guid: steamid.steamid
            }, (err, banned) => {
                if (err) {
                    return reject(err);
                }

                if (banned) {
                    return resolve();
                }

                var banned = new Banned({
                    guid: steamid.steamid,
                    status: steamid.status
                });

                banned.save(err => {
                    if (err) {
                        return reject(err);
                    }

                    resolve();
                });
            });
        });
    }

    return mongoController;
};