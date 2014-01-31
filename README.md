ng-cordova-file-downloader
=================

Angular service for downloading file in Cordova. Uses the cordova file api. Tested on Android and iOS.
Provides methods for downloading single file or an array of files.

Dependent on :
* Cordova w/file & file-transfer plugin
* Underscore
* Angular

Pseudocode
---------------
* Check if file exists
⋅⋅⋅* If exists returns file url.

* Tries to download file
⋅⋅* If DL succeeded && file downloaded is over 500b
⋅⋅⋅⋅* Promise.resolve(fileUrl)
⋅⋅* If DL Failes
⋅⋅⋅⋅* Retry to download 4 more times
⋅⋅⋅⋅* Promise.reject()




Getting Started
---------------

* Service requires cordova with file and file-transfer plugin installed.
* Service requires injection of a service appSettings with containing getLoginInfo() function.



Usage
---------------

* All download methods returns an Angular $q promise.
* When downloading list of files promise returns object containing progress and possibility to cancel.



```javascript
function MyCtrl($scope, ngCordovaFileDownloader) {

    //Set download folder
    ngCordovaFileDownloader.setSaveFolder('com.verico.myfolder');



    //Download single file
    var dlSucsess = function(fileurl){
        console.log('File downloaded and can be found at ' + fileurl);
    };

    var dlFailed = function(){
        console.log('Download failed. Oh no!');
    };

    var downloadUrl = 'http://mypage.com/myfile.zip";
    var filename = 'myfile.zip';

    ngCordovaFileDownloader.downloadFile(downloadUrl, filename).then(dlSucsess,dlFailed);



    //Download array of files
    var dlComplete = function(){
        console.log('Completed download');
    }

    var updateProgress = function(feedback) {
        console.log('Current downloaded file count is : ' + feedback.getCount());

        //If we want we can cancel the download thorugh the object returned from notify
        //feedback.shouldCancel(true);
    };

    var dlFailed = function(){
        console.log('Some thing happend.');
    };



    var files = [];
    files.push({ url: 'http://mypage.com/myfile1.zip', name : 'myfile1.zip'  });
    files.push({ url: 'http://mypage.com/myfile2.zip', name : 'myfile2.zip'  });


    ngCordovaFileDownloader.downloadFileList(files).then(dlComplete, dlFailed, updateProgress);


};
```
