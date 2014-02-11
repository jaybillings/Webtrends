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

gallery.controller('galleryCtrl', ['$scope', '$routeParams', '$http', '$timeout', '$cacheFactory',
    function ($scope, $routeParams, $http, $timeout, $cacheFactory) {
        var x2js = new X2JS(),
            api_key = '0e8707c7e42ae98b7a0d4c75f7dc5ef5';
        $scope.user = {name: $routeParams.name, id: ''};
        $scope.imageList = [];
        $scope.photos = [];
        $scope.curPage = 1;

        var getPhotos = function (page, count) {
            // Get photo IDs
            var page = page || 1;
            var count = count || 10;
            $http.get('http://api.flickr.com/services/rest/', {
                params: {
                    method: 'flickr.people.getPublicPhotos',
                    api_key: api_key,
                    user_id: $scope.user.id,
                    per_page: count,
                    page: page
                }
            }).success(function (data) {
                var images = x2js.xml_str2json(data.toString()).rsp.photos.photo;
                $scope.imageList = [];
                for (var i = 0; i < images.length; i++) {
                    $scope.imageList.push(images[i]._id);
                }
            })
            .then(function (result) {
                var photoCache = $cacheFactory.get($scope.imageList.join(''));
                console.log(photoCache);
                if (photoCache) {
                    // Check the cache
                    console.log('in cache');
                    var photoData = angular.fromJson(photoCache.photos);
                    console.log(photoData);
                    $scope.photos = photoData;
                } else {
                    // Make request
                    console.log('making request');
                    var cache = $cacheFactory($scope.imageList.join(''));
                    $scope.photos = [];
                    for (var i = 0; i < $scope.imageList.length; i++) {
                        $http.get('http://api.flickr.com/services/rest/', {
                            params: {
                                method: 'flickr.photos.getSizes',
                                api_key: api_key,
                                photo_id: $scope.imageList[i]
                            }
                        }).success(function (data) {
                            var sizes = x2js.xml_str2json(data.toString()).rsp.sizes.size;
                            $scope.photos.push({
                                'id': $scope.imageList[i],
                                'thumbnail': sizes[2]._source,
                                'display': sizes[5]._source
                            });
                        });
                    }
                    cache.put('photos', angular.toJson($scope.photos))
                }
            });
        };
        
        // Initial fetch
        $http.get('http://api.flickr.com/services/rest/', { 
            params: {
                method: 'flickr.people.findByUsername',
                api_key: api_key,
                username: $scope.user.name
            }
        })
        .success(function (data) {
            $scope.user.id = x2js.xml_str2json(data.toString()).rsp.user._nsid;
        })
        .then(function (result) {
            getPhotos();
        });
        
        $scope.fetchPics = function (reverse) {
            console.log('reverse', reverse);
            if (reverse) {
                $scope.curPage--;
            } else {
                $scope.curPage++;
            }
            getPhotos($scope.curPage);
        };
    }
]);




