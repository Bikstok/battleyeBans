var md5 = require('js-md5');
var dgram = require('dgram');
var bigInt = require('big-integer');
var waitUntil = require('wait-until');
var mongoController = require('./mongoController')();

module.exports = function () {
    var battleyeController = {};

    battleyeController.checkMultipleIDs = function (steamids, callback) {
        var unprocessedSteamids = [];
        var processedSteamids = [];
        var nextId = 1000;

        var client = dgram.createSocket('udp4');

        client.on('error', function (err) {
            console.log('Error in socket connection');
        });

        client.on('message', function (msg, info) {
            //client.close();
            msg = msg.toString('ascii');
            var id = parseInt(msg.substring(0, 4));
            var status = msg.substring(4);

            var steamid = unprocessedSteamids.filter(function (item) {
                return item.id === id;
            })[0];

            if (typeof steamid !== 'undefined') {
                processedSteamids.push({
                    steamid: steamid.steamid,
                    status: status === '' ? 'Clean' : status
                });
            }

            unprocessedSteamids = unprocessedSteamids.filter(function (item) {
                return item.id !== id;
            });
        });

        var stringToByteArray = function (string) {
            var steamId = bigInt(string);
            var parts = [0x42, 0x45, 0, 0, 0, 0, 0, 0, 0, 0];

            for (var i = 2; i < 10; i++) {
                var res = steamId.divmod(256);
                steamId = res.quotient;
                parts[i] = res.remainder.toJSNumber();
            }

            return md5(new Uint8Array(parts));
        };

        var sendUDPMessage = function (ip, port, message) {
            client.send(message, 0, message.length, port, ip, function (err, bytes) {
            });
        };

        steamids.forEach(function (steamid) {
            if (steamid.length === 17) {
                nextId++;
                unprocessedSteamids.push({
                    id: nextId,
                    steamid: steamid,
                    guid: stringToByteArray(steamid)
                });
            } else {
                processedSteamids.push({
                    steamid: steamid,
                    status: 'Invalid SteamID'
                });
            }
        });

        waitUntil()
            .interval(1000)
            .times(10)
            .condition(function () {
                unprocessedSteamids.forEach(function (unprocessedSteamid) {
                    sendUDPMessage('arma31.battleye.com', 2344, Buffer.from(unprocessedSteamid.id + unprocessedSteamid.guid, 'ascii'));
                });
                return (unprocessedSteamids.length === 0);
            })
            .done(function (result) {
                console.log('Finished request.. processedSteamids:' + processedSteamids.length + ', unprocessedSteamids:' + unprocessedSteamids.length);

                var banned = processedSteamids.filter(processed => processed.status !== 'Clean' && processed.status !== 'Invalid SteamID');
                mongoController.saveMultiple(banned)
                    .then(() => {
                        return callback(processedSteamids);
                    })
                    .catch(err => {
                        console.log(err);
                        return callback(processedSteamids);
                    });
            });

    };

    return battleyeController;
};