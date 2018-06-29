var express = require('express');
var app = express();
var steamController = require('./controllers/steamController.js')(process.env.STEAM_API_KEY);
var RateLimit = require('express-rate-limit');
var battleyeController = require('./controllers/battleyeController.js')();
require('console-stamp')(console, 'dd-mm-yyyy HH:MM:ss.l');

app.enable('trust proxy');

var apiLimiter = new RateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 50,
    delayMs: 0 // disabled
});

// only apply to requests that begin with /api/
app.use('/api/', apiLimiter);

var server = app.listen(process.env.PORT || 3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('BattlEye Ban Checker is running at %s:%s', host, port);

    //app.use(express.static(__dirname + '/public'));
    app.use(express.static('../public_html'));

    app.get('/api/check/:steamids', function (req, res) {
        try {
            var reqIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
            console.log('Request from ' + reqIp + ': Checking the following steamids: ' + req.params.steamids);

            var steamids = req.params.steamids.split(',');
            if (steamids.length > 1000) {
                res.json({
                    message: 'You exceeded the maximum limited of 1000 steamids.'
                });
            } else {
                battleyeController.checkMultipleIDs(steamids, function (processedSteamids) {
                    res.json(processedSteamids);
                });
            }
        }
        catch (e) {
            console.log(e);
            res.json({message: 'Oops, validation failed.. It is recommended to use SteamIDs in 17 digit format.'});
        }
    });

    app.get('/api/checkFriends/:steamid', function (req, res) {
        try {
            var reqIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
            console.log('Request from ' + reqIp + ': Checking friends of steamid: ' + req.params.steamid);

            if (parseInt(req.params.steamid).toString().length === 17) {
                steamController.getFriends(req.params.steamid, function (friends) {
                    if (friends.length > 0) {
                        battleyeController.checkMultipleIDs(friends, function (processedSteamids) {
                            res.json(processedSteamids);
                        });
                    } else {
                        res.json({message: 'Steam profile invalid or private'});
                    }
                });
            } else {
                steamController.resolveVanityURL(req.params.steamid, function (steamid) {
                    console.log('Resolved steamid: ' + steamid);
                    if (typeof steamid !== 'undefined' && steamid !== false) {
                        steamController.getFriends(steamid, function (friends) {
                            if (friends.length > 0) {
                                battleyeController.checkMultipleIDs(friends, function (processedSteamids) {
                                    res.json(processedSteamids);
                                });
                            } else {
                                res.json({message: 'Steam profile invalid or private'});
                            }
                        });
                    } else {
                        res.json({message: 'Could not resolve steam profile'});
                    }
                });
            }
        }
        catch (e) {
            console.log(e);
            res.json({message: 'Oops, validation failed.. It is recommended to use SteamIDs in 17 digit format.'});
        }
    });
});