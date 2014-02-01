angular.module('com.verico.ng-cordova-file-downloader', []);

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
    service('ngCordovaFileDownloader', function($q,$timeout, appSettings, fileTransfer) {

        var IMAGE_SAVE_FOLDER = 'com.verico.file-default';

        var fsComponents = {
            fullPath: null,
            fileSystem: null,
            downloadUrl: null,
            currentFile: null
        };

        var initDownloader = function () {
            return getFileSystem().then(getFullFilePath);
        };

        var onError = function(error) {
            console.log('Error:' + JSON.stringify(error));
        };


        var getFileSystem = function() {
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
        var crateFolder = function() {
            var deferred = $q.defer();

            function finished(dir) {
                deferred.resolve(IMAGE_SAVE_FOLDER);
            }

            fsComponents.fileSystem.root.getDirectory(IMAGE_SAVE_FOLDER, { create: true, exclusive: false }, finished, onError);

            return deferred.promise;
        };

        var getFullFilePath = function() {
            var deferred = $q.defer();

            if (fsComponents.fullPath === null) {
                crateFolder().then(function(dir) {
                    var dummyFile = dir + "/dummy.html";
                    fsComponents.fileSystem.root.getFile(dummyFile, { create: true, exclusive: false }, function(file) {
                        fsComponents.fullPath = file.fullPath.replace("dummy.html", "");
                        deferred.resolve();

                    }, onError);
                });
            } else {
                deferred.resolve();
            }
            return deferred.promise;
        };


        // Checks if file exists. Since we need to create a dummyfile to obtaine full path we checks if file exists first.
        // This we can check without full path, and then we can spare one operation.
        var checkIfFileExists = function(dest) {
            var deferred = $q.defer();

            var full = IMAGE_SAVE_FOLDER + '/' + dest;

            fsComponents.fileSystem.root.getFile(full, { create: false, exclusive: false }, function(file) {
                deferred.resolve(file.fullPath);
            }, function(error) {
                deferred.reject();
            });

            return deferred.promise;
        };


        var startFileDownload = function(url, path) {
            var deferred = $q.defer();

            var ft = fileTransfer.getFileTransfer();
            var uri = encodeURI(url);

            ft.download(
                uri,
                path,
                function(entry) {
                    deferred.resolve(entry.fullPath);
                },
                function(error) {
                    deferred.reject('Image download failed:' + JSON.stringify(error));
                },
                false,
                {
                    headers: {
                        "Authorization": appSettings.getLoginInfo()
                    }
                }
            );

            return deferred.promise;
        };


        var getFileSize = function(dest){
            var deferred = $q.defer();

            var full = IMAGE_SAVE_FOLDER + '/' + dest;

            var onGetFile = function(fileEntry) {
                fileEntry.file(function(file){
                    deferred.resolve(file);
                },deferred.reject);
            };

            var onGetFail = function(error){
                deferred.reject();
            };

            fsComponents.fileSystem.root.getFile(full, { create: false, exclusive: false }, onGetFile,onGetFail);

            return deferred.promise;
        };


        var downloadFile = function(url, dest, trys){
            var deferred = $q.defer();
            var maxTrys = 4;

            var evaluateFileSize = function(fullpath, file){

                trys ++;
                if(!file){
                    deferred.reject();
                    return;
                }

                if(file.size > 500){
                    deferred.resolve(fullpath);
                }
                else if(file.size < 500 && (trys >= maxTrys)){
                    console.log('getFileSize NOT OK, size: :' +size);
                    file.remove(function(){
                        console.log('File removed after failed tryes:' + file.fullPath);
                    },function(){
                        console.log('File removed failed:' + file.fullPath);
                    });
                    deferred.reject();
                }
                else{
                    console.log('getFileSize NOT OK. Try : ' + trys +  ' size:' +size);
                    downloadFile(url,dest,trys).then(deferred.resolve,deferred.reject);
                }
            };

            if(trys < maxTrys){
                startFileDownload(url, fsComponents.fullPath + dest).then(function(fullpath){
                    getFileSize(dest).then(function(file){
                        evaluateFileSize(fullpath,file);
                    }, function(){
                        evaluateFileSize();
                    });
                },function(error){
                    console.log('Download file failed: ' + error);
                    deferred.reject();
                });
            }else{
                deferred.reject();
            }
            return deferred.promise;
        };


        var downloadFileFromUrl = function(url, filename) {
            var deferred = $q.defer();

            initDownloader().then(function() {
                checkIfFileExists(filename).then(deferred.resolve, function () {
                    downloadFile(url, filename, 0).then(deferred.resolve,deferred.reject);
                });
            });

            return deferred.promise;
        };


        var setSaveFolderPath = function(folder){
            IMAGE_SAVE_FOLDER = folder;
        };

        //----------------------------------------------
        //--------- FILE LIST DOWNLOAD -----------------
        //----------------------------------------------


        var listDownload = {
            downloadFileList  : function(files){

                var deferred = $q.defer();
                var cancel = false;
                var returned = 0;

                var feedback = {
                    getCount: function () {
                        return returned;
                    },
                    shouldCancel: function (shouldcancel) {
                        cancel = shouldcancel;
                    }
                };

                var first = listDownload.getNextPart(0, files);
                var count = first.length;

                var sectionReady = function (countDone) {
                    $timeout(function () {
                        if (count < files.length && !cancel) {
                            var part = listDownload.getNextPart(count, files);
                            count = count + part.length;
                            listDownload.downloadFileSection(part).then(sectionReady);
                        } else {
                            deferred.resolve();
                        }
                    }, 0);

                    returned += countDone;
                    deferred.notify(feedback);
                };

                listDownload.downloadFileSection(first).then(sectionReady);


                return deferred.promise;

            },
            getNextPart : function (start, array) {
                var sectionSize = 10;
                var part;
                if (array.length > start + (sectionSize - 1)) {
                    part = array.slice(start, start + sectionSize);
                } else {
                    part = array.slice(start, array.length);
                }
                return part;
            },
            downloadFileSection : function (files) {
                var deferred = $q.defer();

                var promises = [];

                _.each(files, function(file) {
                    var q = downloadFileFromUrl(file.url, file.name);
                    promises.push(q);
                });

                var done = function() {
                    deferred.resolve(promises.length);
                };

                var doneWithFailed = function(){
                    console.log('All setteled with fail count:' + promises.length);
                    deferred.resolve(promises.length);
                };

                $q.allSettled(promises).then(done, doneWithFailed);

                return deferred.promise;
            }
        };

        return{
            setSaveFolder: setSaveFolderPath,
            downloadFile: downloadFileFromUrl,
            downloadFileList : listDownload.downloadFileList
        };
    });
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