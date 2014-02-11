var galleryServices = angular.module('galleryServices', ['ngResource']);

galleryServices.factory('IdService', ['$resource',
    function ($resource) {
        return $resource(
            'http://api.flickr.com/services/rest/',
            {
                method: 'flickr.people.findByUsername',
                api_key: '@api_key',
                username: '@username'
            }
        );
    }
]);

galleryServices.factory('PhotoService', ['$resource',
    function ($resource) {
        return $resource(
            'http://api.flickr.com/services/rest/',
            {
                method: 'flickr.people.getPublicPhotos',
                api_key: '@api_key',
                user_id: 'user_id'
            }
        
        );
    }
]);