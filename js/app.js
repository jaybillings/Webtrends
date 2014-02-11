var gallery = angular.module('galleryApp', ['ngRoute']);

gallery.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.
            when('/:name', {
                templateUrl: 'views/photo-browser.html',
                controller: 'galleryCtrl'
            }).
            when('/error', {
                templateUrl: 'views/error.html'
            }).
            otherwise({
                redirectTo: '/slaveofosiris'
            });
    }
]);

gallery.controller('galleryCtrl', ['$scope', '$routeParams', '$http', '$timeout',
    function ($scope, $routeParams, $http, $timeout) {
        var x2js = new X2JS(),
            api_key = '0e8707c7e42ae98b7a0d4c75f7dc5ef5',
            parseXML =
                function (data) {
                    return x2js.xml_str2json(data.toString());
                },
            getPhotos =
                function (page, count) {
                    // Get photo IDs
                    var pageParam = page || 1,
                        countParam = count || 10;
                    $http.get('http://api.flickr.com/services/rest/', {
                        cache: true,
                        params: {
                            method: 'flickr.people.getPublicPhotos',
                            api_key: api_key,
                            user_id: $scope.user.id,
                            per_page: countParam,
                            page: pageParam
                        }
                    }).success(function (data) {
                        var images = parseXML(data).rsp.photos.photo,
                            i;
                        $scope.imageList = [];
                        for (i = 0; i < images.length; i++) {
                            $scope.imageList.push(images[i]._id);
                        }
                    })
                    .then(function () {
                        var i, id;
                        $scope.photos = [];
                        for (i = 0; i < $scope.imageList.length; i++) {
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
        $scope.user = {name: $routeParams.name, id: ''};
        $scope.imageList = [];
        $scope.photos = [];
        $scope.curPage = 1;
        $scope.currentPhoto = {};
        
        $scope.fetchPics = function (reverse) {
            if (reverse) {
                $scope.curPage--;
            } else {
                $scope.curPag++;
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
                var picInfo = parseXML(data).rsp.photo,
                    tags = [],
                    i;
                if (picInfo && picInfo.tags) {
                    for (i = 0; i < picInfo.tags.tag.length; i++) {
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
        };

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
        .then(function () {
            var getInfo = function () {
                if (!$scope.photos[0]) {
                    $timeout(function () {
                        getInfo();
                    }, 1000);
                } else {
                    $scope.setCurrentPic($scope.photos[0].id, $scope.photos[0].display);
                }
            };
            getPhotos();
            getInfo();
        });
    }
]);