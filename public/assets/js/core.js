var battleyeBans = angular.module('battleyeBans', []);

function mainController($scope, $http) {
    $scope.response = [];
    $scope.responseFiltered = [];
    $scope.steamids = '';
    $scope.steamid = '';
    $scope.checkStatus = false;
    $scope.isBusy = false;

    $scope.checkSteamIDs = function () {
        $scope.isBusy = true;
        $('.loader').addClass('is-loading');

        $scope.steamids = $scope.steamids.replace(/\s+/g, '');
        $http.get('/api/check/' + $scope.steamids, {timeout: 300000})
            .success(function (data) {
                $scope.response = data;
                $scope.hideCleanAccounts($scope.checkStatus);
                $scope.isBusy = false;
                $('.loader').removeClass('is-loading');
            })
            .error(function (err) {
                $scope.response = err;
                $scope.hideCleanAccounts($scope.checkStatus);
                $scope.isBusy = false;
                $('.loader').removeClass('is-loading');
            });
    };

    $scope.checkSteamFriends = function () {
        $scope.isBusy = true;
        $('.loader').addClass('is-loading');

        var arr = $scope.steamid.split('/');
        $scope.steamid = arr[arr.length - 1];
        if ($scope.steamid === '') {
            $scope.steamid = arr[arr.length - 2];
        }

        $http.get('/api/checkFriends/' + $scope.steamid, {timeout: 300000})
            .success(function (data) {
                $scope.response = data;
                $scope.hideCleanAccounts($scope.checkStatus);
                $scope.isBusy = false;
                $('.loader').removeClass('is-loading');
            })
            .error(function (err) {
                $scope.response = err;
                $scope.hideCleanAccounts($scope.checkStatus);
                $scope.isBusy = false;
                $('.loader').removeClass('is-loading');
            });
    };

    $scope.hideCleanAccounts = function (checkStatus) {
        if (checkStatus) {
            $scope.responseFiltered = [];
            $scope.response.forEach(function (entry) {
                if (entry.status !== 'Clean' && entry.status !== 'Invalid steamid') {
                    $scope.responseFiltered.push(entry);
                }
            });
        } else {
            $scope.responseFiltered = $scope.response;
        }
    };
}