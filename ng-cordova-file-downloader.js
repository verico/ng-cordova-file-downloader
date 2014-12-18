angular.module('com.verico.ng-cordova-file-downloader', []);
(function() {
    "use strict";

    angular.module('com.verico.ng-cordova-file-downloader').
        service('fileDownloaderList', function($q,$timeout, fileDownloaderSingle) {


            function getNextPart(start, array) {
                var sectionSize = 10;
                var part;
                if (array.length > start + (sectionSize - 1)) {
                    part = array.slice(start, start + sectionSize);
                } else {
                    part = array.slice(start, array.length);
                }
                return part;
            }

            function downloadFileSection (files,options) {
                var deferred = $q.defer();
                var promises = [];

                files.forEach(function(file) {
                    var q = fileDownloaderSingle.downloadFileFromUrl(file.url, file.name,options);
                    promises.push(q);
                });

                function done(all) {
                    deferred.resolve(all);
                }

                $q.allSettled(promises).then(done,done);
                return deferred.promise;
            }

            return {
                downloadFileList : function(files, options){
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

                    var first = getNextPart(0, files);
                    var count = first.length;

                    function sectionReady(summaries) {
                        summaries.forEach(function(s){
                            summary.push(s);
                        });

                        $timeout(function () {
                            if (count < files.length && !cancel) {
                                var part = getNextPart(count, files);
                                count = count + part.length;
                                downloadFileSection(part,options).then(sectionReady);
                            } else {
                                deferred.resolve(summary);
                            }
                        }, 0);

                        returned += summaries.length;
                        deferred.notify(feedback);
                    }

                    downloadFileSection(first,options).then(sectionReady);
                    return deferred.promise;
                }
            };
        });
})();
(function() {
    "use strict";

    angular.module('com.verico.ng-cordova-file-downloader').
        service('fileDownloaderSingle', function($q,$timeout,$injector, fileTransferService, downloadFileSystemHelper, downloadFeedbackFactory) {

            var setSaveFolderPath = downloadFileSystemHelper.setSaveFolderPath;

            var appSettings;
            try{
                appSettings = $injector.get('appSettings');
            }
            catch(e){
                //App settings not defined
            }


            /*
             * Downloads a single file.
             *
             * */
            function startFileDownload(url, filename, options) {
                var deferred = $q.defer();
                downloadFileSystemHelper.getFullFilePath().then(function(folderPath){
                    var path = folderPath + filename;

                    var ft = fileTransferService.getFileTransfer();
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


                    if (options && options.timeout !== undefined && options.timeout !== null) {
//                        currentTimeout = $timeout(function () {
//                            console.log('Download timed out. Stppping filetransfer');
//                            ft.abort();
//                            deferred.reject('Image download timeout : ' + url);
//                        }, options.timeout);
                    }

                }, deferred.reject);

                return deferred.promise;
            }


            /*
             *
             * Tries to download a file for a given url and filename.
             * If file already exists it returns without downloading the corresponding file.
             * Returns an object from 'downloadFeedbackFactory'
             *
             */
            function downloadFileFromUrl(url, filename, options) {
                var deferred = $q.defer();
                downloadFileSystemHelper.checkIfFileExists(filename).then(deferred.resolve, function () {
                    startFileDownload(url, filename, options).then(function(fullpath){
                        deferred.resolve(downloadFeedbackFactory.feedback(true,url,filename,fullpath));
                    },function(error){
                        deferred.reject(downloadFeedbackFactory.feedback(false,url,filename));
                    });
                });

                return deferred.promise;
            }

            return {
                downloadFileFromUrl : downloadFileFromUrl,
                setSaveFolderPath : setSaveFolderPath
            };
        });
})();
(function() {
    "use strict";

    angular.module('com.verico.ng-cordova-file-downloader').
        service('ngCordovaFileDownloader', function (fileDownloaderSingle, fileDownloaderList) {

            return{
                setSaveFolder: fileDownloaderSingle.setSaveFolderPath,
                downloadFile: fileDownloaderSingle.downloadFileFromUrl,
                downloadFileList: fileDownloaderList.downloadFileList
            };
        });
})();

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

(function() {
    "use strict";

    angular.module('com.verico.ng-cordova-file-downloader').
        service('downloadFeedbackFactory', function () {
            return {
                feedback: function (p_success, p_url, p_name, p_fullpath) {
                    return {
                        success: p_success,
                        url: p_url,
                        name: p_name,
                        fullPath: p_fullpath
                    };
                }
            };
        });
})();

(function(){
    "use strict";

    angular.module('com.verico.ng-cordova-file-downloader').
        service('downloadFileSystemHelper', function($q,$timeout, fileTransferService,downloadFeedbackFactory) {
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

                            }, function(err){
                                onError(err);
                                deferred.reject(err);
                            });
                        });
                    },deferred.reject);
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
