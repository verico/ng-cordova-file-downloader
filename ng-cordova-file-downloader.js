angular.module('com.verico.ng-cordova-file-downloader', []);
angular.module('com.verico.ng-cordova-file-downloader').
    service('fileDownloaderList', function($q,$timeout, appSettings,fileDownloaderSingle) {
        var _public = {};
        var _private ={};

        _public. downloadFileList  = function(files){
            var deferred = $q.defer();
            var cancel = false;
            var returned = 0;

            var summary = [];

            var feedback = {
                getCount: function () {
                    return returned;
                },
                shouldCancel: function (shouldcancel) {
                    cancel = shouldcancel;
                }
            };

            var first = _private.getNextPart(0, files);
            var count = first.length;

            var sectionReady = function (summaries) {
                angular.forEach(summaries,function(s){
                    summary.push(s);
                });

                $timeout(function () {
                    if (count < files.length && !cancel) {
                        var part = _private.getNextPart(count, files);
                        count = count + part.length;
                        _private.downloadFileSection(part).then(sectionReady);
                    } else {
                        deferred.resolve(summary);
                    }
                }, 0);

                returned += summaries.length;
                deferred.notify(feedback);
            };

            _private.downloadFileSection(first).then(sectionReady);
            return deferred.promise;

        };


        _private.getNextPart = function (start, array) {
                var sectionSize = 10;
                var part;
                if (array.length > start + (sectionSize - 1)) {
                    part = array.slice(start, start + sectionSize);
                } else {
                    part = array.slice(start, array.length);
                }
                return part;
            };
        _private.downloadFileSection = function (files) {
                var deferred = $q.defer();

                var promises = [];

                angular.forEach(files, function(file) {
                    var q = fileDownloaderSingle.downloadFileFromUrl(file.url, file.name);
                    promises.push(q);
                });

                var done = function(all) {
                    deferred.resolve(all);
                };

                var doneWithFailed = function(all){
                    deferred.resolve(all);
                };

                $q.allSettled(promises).then(done, doneWithFailed);

                return deferred.promise;
            };

        return _public;
    });
angular.module('com.verico.ng-cordova-file-downloader').
    service('fileDownloaderSingle', function($q,$timeout, appSettings, fileTransfer, downloadFileSystemHelper, downloadFeedbackFactory) {
        var _public = {};
        var _private = {};


        _public.setSaveFolderPath = downloadFileSystemHelper.setSaveFolderPath;


        /*
        * Downloads a single file.
        *
        *
        *
        * */
        _private.startFileDownload = function(url, filename) {
           var deferred = $q.defer();

           downloadFileSystemHelper.getFullFilePath().then(function(folderPath){
               var path = folderPath + filename;

               var ft = fileTransfer.getFileTransfer();
               var uri = encodeURI(url);

               var authHeader = {};

               if(appSettings){
                   authHeader = {
                       "Authorization": appSettings.getLoginInfo()
                   };
               }

               ft.download(
                   uri,
                   path,
                   function(entry) {
                       if (typeof entry.toURL == 'function') {
                           deferred.resolve(entry.toURL());
                       }else{
                           deferred.resolve(entry.fullPath);
                       }
                   },
                   function(error) {
                       deferred.reject('Image download failed:' + JSON.stringify(error));
                   },
                   false,
                   {
                       headers: authHeader
                   }
               );

           }, deferred.reject);



            return deferred.promise;
        };


        /*
        *
        * Tries to download a file for a given url and filename.
        * If file already exists it returns without downloading the corresponding file.
        * Returns an object from 'downloadFeedbackFactory'
        *
         */
        _public.downloadFileFromUrl = function(url, filename) {
            var deferred = $q.defer();

            downloadFileSystemHelper.checkIfFileExists(filename).then(deferred.resolve, function () {
                _private.startFileDownload(url, filename).then(function(fullpath){
                    deferred.resolve(downloadFeedbackFactory.feedback(true,url,filename,fullpath));
                },function(error){
                    deferred.reject(downloadFeedbackFactory.feedback(false,url,filename));
                });
            });

            return deferred.promise;
        };

        return _public;
    });
angular.module('com.verico.ng-cordova-file-downloader').
    service('ngCordovaFileDownloader', function(fileDownloaderSingle, fileDownloaderList) {


        return{
            setSaveFolder: fileDownloaderSingle.setSaveFolderPath,
            downloadFile: fileDownloaderSingle.downloadFileFromUrl,
            downloadFileList : fileDownloaderList.downloadFileList
        };
    });

//----------------------------------------------------------------------------------------------------------------------
//--------- Credit to "Zenuka" http://stackoverflow.com/questions/18888104/angularjs-q-wait-for-all-even-when-1-rejected
//----------------------------------------------------------------------------------------------------------------------


angular.module('com.verico.ng-cordova-file-downloader')
    .config(['$provide', function ($provide) {
        $provide.decorator('$q', ['$delegate', function ($delegate) {
            var $q = $delegate;

            // Extention for q
            $q.allSettled = $q.allSettled || function (promises) {
                var deferred = $q.defer();
                if (angular.isArray(promises)) {
                    var states = [];
                    var results = [];
                    var didAPromiseFail = false;

                    // First create an array for all promises with their state
                    angular.forEach(promises, function (promise, key) {
                        states[key] = false;
                    });

                    // Helper to check if all states are finished
                    var checkStates = function (states, results, deferred, failed) {
                        var allFinished = true;
                        angular.forEach(states, function (state, key) {
                            if (!state) {
                                allFinished = false;
                            }
                        });
                        if (allFinished) {
                            if (failed) {
                                deferred.reject(results);
                            } else {
                                deferred.resolve(results);
                            }
                        }
                    };

                    // Loop through the promises
                    // a second loop to be sure that checkStates is called when all states are set to false first
                    angular.forEach(promises, function (promise, key) {
                        $q.when(promise).then(function (result) {
                            states[key] = true;
                            results[key] = result;
                            checkStates(states, results, deferred, didAPromiseFail);
                        }, function (reason) {
                            states[key] = true;
                            results[key] = reason;
                            didAPromiseFail = true;
                            checkStates(states, results, deferred, didAPromiseFail);
                        });
                    });
                } else {
                    throw 'allSettled can only handle an array of promises (for now)';
                }

                return deferred.promise;
            };

            return $q;
        }]);
    }]);

angular.module('com.verico.ng-cordova-file-downloader').
    service('downloadFeedbackFactory', function() {

        var getFeedback = function(p_success, p_url, p_name, p_fullpath){

            return {
                success :p_success,
                url : p_url,
                name : p_name,
                fullPath : p_fullpath
            };
        };

        return {
            feedback : getFeedback
        }
    });

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

                        var path;
                        if (typeof file.toURL == 'function') {
                            path = file.toURL().replace("dummy.html", "");
                        }else{
                           path =  file.fullPath.replace("dummy.html", "");
                        }

                        fsComponents.fullPath = path;
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

                  var path;
                  if (typeof file.toURL == 'function') {
                      path = file.toURL();
                  }else{
                      path =  file.fullPath;
                  }

                  deferred.resolve(downloadFeedbackFactory.feedback(true,'',dest, path));
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
angular.module('com.verico.ng-cordova-file-downloader').
    service('fileTransfer', function ($q) {
    var ft = null;

    var _public = {};

        _public.getFileTransfer = function() {
        if(ft === null){
            ft = new FileTransfer();
        }

        return ft;
    };

        _public.getFileSystem = function() {
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

    return _public;
});