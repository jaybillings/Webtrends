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
        $scope.currentPhoto = {};

        /* Helper functions */
        var parseXML = function (data) {
            return x2js.xml_str2json(data.toString());
        };

        var getPhotos = function (page, count) {
            // Get photo IDs
            var page = page || 1;
            var count = count || 10;
            $http.get('http://api.flickr.com/services/rest/', {
                cache: true,
                params: {
                    method: 'flickr.people.getPublicPhotos',
                    api_key: api_key,
                    user_id: $scope.user.id,
                    per_page: count,
                    page: page
                }
            }).success(function (data) {
                var images = parseXML(data).rsp.photos.photo;
                $scope.imageList = [];
                for (var i = 0; i < images.length; i++) {
                    $scope.imageList.push(images[i]._id);
                }
            })
            .then(function (result) {
                var id;
                $scope.photos = [];
                for (var i = 0; i < $scope.imageList.length; i++) {
                    id = $scope.imageList[i];
                    $http.get('http://api.flickr.com/services/rest/', {
                        cache: true,
                        params: {
                            method: 'flickr.photos.getSizes',
                            api_key: api_key,
                            photo_id: $scope.imageList[i]
                        }
                    }).success(function (data, status, headers, config) {
                        var sizes = parseXML(data).rsp.sizes.size;
                        $scope.photos.push({    
                            'thumbnail': sizes[2]._source,
                            'display': sizes[5]._source,
                            'id': config.params.photo_id
                        });
                    });
                }
            })
        };
        
        $scope.fetchPics = function (reverse) {
            if (reverse) {
                $scope.curPage--;
            } else {
                $scope.curPage++;
            }
            getPhotos($scope.curPage);
        };
        
        $scope.setCurrentPic = function (id, url) {
            $http.get('http://api.flickr.com/services/rest/', {
                cache: true,
                params: {
                    method: 'flickr.photos.getInfo',
                    api_key: api_key,
                    photo_id: id
                }
            })
            .success(function (data) {
                var picInfo = parseXML(data).rsp.photo;
                var tags = [];
                if (picInfo && picInfo.tags) {
                    for (var i = 0; i < picInfo.tags.tag.length; i++) {
                        tags.push(picInfo.tags.tag[i]._raw);
                    }
                } else {
                    tags = ['NONE'];
                }
                $scope.currentPic = {
                    title: picInfo.title,
                    tags: tags.join(', '),
                    url: url
                };
            })
        }

        /* Engine code */

        $http.get('http://api.flickr.com/services/rest/', { 
            cache: true,
            params: {
                method: 'flickr.people.findByUsername',
                api_key: api_key,
                username: $scope.user.name
            }
        })
        .success(function (data) {
            $scope.user.id = parseXML(data).rsp.user._nsid;
        })
        .then(function (result) {
            var getInfo = function () {
                if (!$scope.photos[0]) {
                    $timeout(function () {
                        getInfo();
                    }, 1000);
                } else {
                    // Put the ids in
                    /*for (i = 0; i < $scope.imageList.length; i++) {
                        angular.extend($scope.photos[i], {id: $scope.imageList[i]});
                    }*/
                    $scope.setCurrentPic($scope.photos[0].id, $scope.photos[0].display);
                }
            };
            getPhotos();
            getInfo();
        });
    }
]);




