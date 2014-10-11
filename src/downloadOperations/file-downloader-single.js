angular.module('com.verico.ng-cordova-file-downloader').
    service('fileDownloaderSingle', function($q,$timeout, appSettings, fileTransfer, downloadFileSystemHelper, downloadFeedbackFactory) {
        var _public = {};
        var _private = {};


        _public.setSaveFolderPath = downloadFileSystemHelper.setSaveFolderPath;


        /*
        * Downloads a single file.
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