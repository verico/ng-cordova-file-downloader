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