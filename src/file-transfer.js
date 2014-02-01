angular.module('com.verico.ng-cordova-file-downloader').
    service('fileTransfer', function ($q) {
    var ft = null;

    var getFileTransferObject = function() {
        if(ft === null){
            ft = new FileTransfer();
        }

        return ft;
    };

    var getFileSystemObject = function() {
        var deferred = $q.defer();

        function onSuccess(fs) {
            deferred.resolve(fs);
        }

        function onError(error) {
            deferred.reject(error);
        }

        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onSuccess, onError);


        return deferred.promise;
    };


    return{
        getFileTransfer: getFileTransferObject,
        getFileSystem : getFileSystemObject
    };
})