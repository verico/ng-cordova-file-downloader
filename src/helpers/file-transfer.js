(function() {
    "use strict";

    angular.module('com.verico.ng-cordova-file-downloader').service('fileTransferService', function ($q,$window) {
            return {
                getFileSystem :function() {
                    var deferred = $q.defer();
                    $window.requestFileSystem($window.PERSISTENT, 1024 * 1024, deferred.resolve, deferred.reject);
                    return deferred.promise;
                },
                getFileTransfer : function() {
                    return new FileTransfer();
                }
            };
        });
})();
