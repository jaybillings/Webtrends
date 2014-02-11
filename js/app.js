var gallery = angular.module('galleryApp', ['ngRoute']);

gallery.config(['$routeProvider', '$httpProvider',
    function ($routeProvider, $httpProvider) {
        $routeProvider.
            when('/:name', {
                templateUrl: 'views/photo-browser.html',
                controller: 'galleryCtrl'
            }).
            when('/error', {
                templateUrl: 'views/error.html'
            }).
            otherwise({
                redirectTo: '/slaveofosiris',
            });
    }
]);

gallery.controller('galleryCtrl', ['$scope', '$routeParams', '$http', '$timeout',
    function ($scope, $routeParams, $http, $timeout) {
        var x2js = new X2JS(),
            api_key = '0e8707c7e42ae98b7a0d4c75f7dc5ef5',
            getNSID = function () {
                $http.get('http://api.flickr.com/services/rest/', { 
                    params: {
                        method: 'flickr.people.findByUsername',
                        api_key: api_key,
                        username: $scope.user.name
                    }
                }).success(function (data) {
                    var json = x2js.xml_str2json(data.toString());
                    $scope.user.id = json.rsp.user._nsid;
                });
            },
            getPhotos = function () {
                $http.get('http://api.flickr.com/services/rest/', {
                    params: {
                        method: 'flickr.people.getPublicPhotos',
                        api_key: api_key,
                        user_id: $scope.user.id,
                        per_page: 10
                    }
                }).success(function (data) {
                    var json = x2js.xml_str2json(data.toString());
                    var images = json.rsp.photos.photo;
                    for (var i = 0; i < images.length; i++) {
                        $scope.imageList.push(images[0]._id);
                    }
                    console.log($scope.imageList);
                });
            };

        $scope.user = {name: $routeParams.name, id: ''};
        $scope.imageList = [];
        $scope.getPhotoSizes = function (photoIds) {
            for (id in photoIds) {
                console.log(id);
                $http.get('http://api.flickr.com/services/rest/', {
                    params: {
                        method: 'flickr.photos.getSizes',
                        api_key: api_key,
                        photo_id: id
                    }
                }).success(function (data) {
                    var json = x2js.xml_str2json(data.toString());
                    console.log(json);
                });
            }
        };
        
        // Get photo data
        getNSID($scope, $http);
        $timeout(function() {
            getPhotos($scope, $http);
        }, 1000);
        $scope.getPhotoSizes($scope.imageList);
    }
]);




