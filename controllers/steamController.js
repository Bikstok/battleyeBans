var https = require('https');

module.exports = function (api_key) {
    var steamController = {};

    steamController.resolveVanityURL = function (vanityUrl, callback) {
        var options = {
            'method': 'GET',
            'hostname': 'api.steampowered.com',
            'path': '/ISteamUser/ResolveVanityURL/v0001/?key=' + api_key + '&vanityurl=' + vanityUrl
        };

        var req = https.request(options, function (res) {
            if (res.statusCode === 404 || res.statusCode === 403) {
                console.log(res.statusCode + ': Steam Web API failed!');
                req.abort();
            }
            else {
                var chunks = [];

                res.on('data', function (chunk) {
                    chunks.push(chunk);
                });

                res.on('end', function () {
                    var body = Buffer.concat(chunks);
                    var json = JSON.parse(body);

                    if (typeof json.response !== 'undefined' && json.response.steamid !== 'undefined') {
                        return callback(json.response.steamid)
                    } else {
                        return callback(false);
                    }
                });
            }
        });

        req.on('error', function (e) {
            console.log(e);
        });

        req.on('timeout', function () {
            console.log('Steam Web API timed out');
            req.abort();
        });

        req.setTimeout(5000);

        req.end();
    };

    steamController.getFriends = function (steamid, callback) {
        var options = {
            'method': 'GET',
            'hostname': 'api.steampowered.com',
            'path': '/ISteamUser/GetFriendList/v0001/?key=' + api_key + '&steamid=' + steamid + '&relationship=friend'
        };

        var req = https.request(options, function (res) {
            // API request not responding or unauthorized
            if (res.statusCode === 404 || res.statusCode === 403) {
                console.log(res.statusCode + ': Steam Web API failed!');
                req.abort();
            }

            else {
                var chunks = [];

                res.on('data', function (chunk) {
                    chunks.push(chunk);
                });

                var friends = [];

                res.on('end', function () {
                    var body = Buffer.concat(chunks);
                    var json = JSON.parse(body);

                    if (typeof json.friendslist !== 'undefined') {
                        json.friendslist.friends.forEach(function (friend) {
                            friends.push(friend.steamid);
                        });
                    }
                    return callback(friends);
                });
            }
        });

        req.on('error', function (e) {
            console.log(e);
        });

        req.on('timeout', function () {
            console.log('Steam Web API timed out');
            req.abort();
        });

        req.setTimeout(5000);

        req.end();
    };

    return steamController;
};