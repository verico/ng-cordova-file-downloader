(function(){
    "use strict";

    angular.module('com.verico.ng-cordova-file-downloader').
        service('downloadFileSystemHelper', function($q,$timeout, appSettings, fileTransferService,downloadFeedbackFactory) {
            var IMAGE_SAVE_FOLDER = 'com.verico.file-default';
            var fullPath = null;

            function onError(error) {
                console.log('Error:' + JSON.stringify(error));
            }

            function createFolder(folder) {
                var deferred = $q.defer();
                fileTransferService.getFileSystem().then(function (fs){
                    fs.root.getDirectory(folder,
                        {
                            create: true,
                            exclusive: false
                        },
                        function() {
                            deferred.resolve(folder);
                        }, function(err){
                            onError(err);
                            deferred.reject(err);
                        });
                },function(err){
                    onError(err);
                    deferred.reject(err);
                });

                return deferred.promise;
            }

            function getFullFilePath() {
                var deferred = $q.defer();

                if (fullPath === null) {
                    createFolder(IMAGE_SAVE_FOLDER).then(function(dir) {
                        fileTransferService.getFileSystem().then(function (fs){
                            var dummyFile = dir + "/dummy.html";
                            fs.root.getFile(dummyFile, { create: true, exclusive: false }, function(file) {
                                if (typeof file.toURL == 'function') {
                                    fullPath = file.toURL().replace("dummy.html", "");
                                }else{
                                    fullPath =  file.fullPath.replace("dummy.html", "");
                                }
                                deferred.resolve(fullPath);

                            }, onError);
                        });
                    });
                } else {
                    deferred.resolve(fullPath);
                }
                return deferred.promise;
            }

            // DESCRIPTION:
            // Checks if file exists. Since we need to create a dummyfile to obtaine full path we checks if file exists first.
            // This we can check without full path, and then we can spare one operation.
            // RETURNS promise:
            // Resolved:  Returns full url to file
            // Reject : Returns fullpath to basefolder
            function checkIfFileExists(dest) {

                return  fileTransferService.getFileSystem().then(function (fs) {
                    var deferred = $q.defer();
                    var full = IMAGE_SAVE_FOLDER + '/' + dest;
                    fs.root.getFile(full, { create: false, exclusive: false }, function(file) {
                        var path;
                        if (typeof file.toURL == 'function') {
                            path = file.toURL();
                        }else{
                            path =  file.fullPath;
                        }
                        deferred.resolve(downloadFeedbackFactory.feedback(true,'',dest, path));

                    },deferred.reject);
                    return deferred.promise;
                });
            }

            function setSaveFolderPath(folder){
                IMAGE_SAVE_FOLDER = folder;
            }

            return {
                checkIfFileExists : checkIfFileExists,
                setSaveFolderPath : setSaveFolderPath,
                getFullFilePath : getFullFilePath

            };
        });

})();

