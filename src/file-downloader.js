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