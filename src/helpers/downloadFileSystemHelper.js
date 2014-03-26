angular.module('com.verico.ng-cordova-file-downloader').
    service('downloadFileSystemHelper', function($q,$timeout, appSettings, fileTransfer,downloadFeedbackFactory) {
        var IMAGE_SAVE_FOLDER = 'com.verico.file-default';

        var fsComponents = {
            fullPath: null,
            fileSystem: null,
            downloadUrl: null,
            currentFile: null
        };

        var _public = {};
        var _private = {};



        _private.onError = function(error) {
            console.log('Error:' + JSON.stringify(error));
        };


        _private.createFolder = function(folder) {
            var deferred = $q.defer();

            function finished(dir) {
                deferred.resolve(folder);
            }

            fsComponents.fileSystem.root.getDirectory(folder, { create: true, exclusive: false }, finished, _private.onError);

            return deferred.promise;
        };

        _private.getFileSystem = function() {
            var deferred = $q.defer();
            if (fsComponents.fileSystem === null) {
                fileTransfer.getFileSystem().then(function (fs) {
                    fsComponents.fileSystem = fs;
                    deferred.resolve();
                });

            } else {
                deferred.resolve();
            }

            return deferred.promise;
        };

        _public.getFullFilePath = function() {
            var deferred = $q.defer();

            if (fsComponents.fullPath === null) {
                _private.createFolder(IMAGE_SAVE_FOLDER).then(function(dir) {
                    var dummyFile = dir + "/dummy.html";
                    fsComponents.fileSystem.root.getFile(dummyFile, { create: true, exclusive: false }, function(file) {
                        fsComponents.fullPath = file.fullPath.replace("dummy.html", "");
                        deferred.resolve(fsComponents.fullPath);

                    }, _private.onError);
                });
            } else {
                deferred.resolve(fsComponents.fullPath);
            }
            return deferred.promise;
        };

        // DESCRIPTION:
        // Checks if file exists. Since we need to create a dummyfile to obtaine full path we checks if file exists first.
        // This we can check without full path, and then we can spare one operation.
        // RETURNS promise:
        // Resolved:  Returns full url to file
        // Reject : Returns fullpath to basefolder
        _public.checkIfFileExists = function(dest) {

          return _private.initDownloader().then(function(){

              var deferred = $q.defer();
              var full = IMAGE_SAVE_FOLDER + '/' + dest;
              fsComponents.fileSystem.root.getFile(full, { create: false, exclusive: false }, function(file) {
                  deferred.resolve(downloadFeedbackFactory.feedback(true,'',dest, file.fullPath));
              }, function(error) {
                  deferred.reject();
              });

              return deferred.promise;
          })


        };

        _private.initDownloader = function () {
            return _private.getFileSystem();
        };

        _public.setSaveFolderPath = function(folder){
            IMAGE_SAVE_FOLDER = folder;
        };


        return _public;
    });