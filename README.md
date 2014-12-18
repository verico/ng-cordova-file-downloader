ng-cordova-file-downloader
=================

Angular service for downloading file in Cordova. Uses the cordova file api. Tested on Android and iOS.
Provides methods for downloading single file or an array of files.

Dependent on :
* Cordova w/file & file-transfer plugin
* Angular


Getting Started
---------------
* Install with [Bower][bower]: `$ bower install ng-cordova-file-downloader`
* Service requires cordova with file and file-transfer plugin installed.
* Optional - Inject a service nameed 'appSettings' containing getLoginInfo() function(used for basic auth if needed). 



Usage
---------------

* All download methods returns an Angular $q promise.
* When downloading list of files promise returns notify with progress and possibility to cancel.
* Both download methods returns a summary object of type :
```javascript

    {
        success : bool,
        url : <requested_url>,
        name : <request_name>,
        fullPath : <fullpath to downloaded file>
    };

```



```javascript
function MyCtrl($scope, ngCordovaFileDownloader) {

    //Set download folder
    ngCordovaFileDownloader.setSaveFolder('com.verico.myfolder');


    //Download single file
    var dlSucsess = function(summary){
        console.log('File downloaded and can be found at ' + summary.fullPath);
    };

    var dlFailed = function(){
        console.log('Download failed. Oh no!');
    };

    var downloadUrl = 'http://mypage.com/myfile.zip';
    var filename = 'myfile.zip';

    ngCordovaFileDownloader.downloadFile(downloadUrl, filename).then(dlSucsess,dlFailed);


    //Download array of files
    var dlComplete = function(summary){
        // summary is [] of summary objects. This can be used to confirm that all files was downloaded succsessfully

        _.each(summary, function(s){
            console.log(s.success);
            console.log(s.url);
            console.log(s.name);
            console.log(s.fullPath);
        });

        console.log('All files done');

        // We can now get url to a specific file using 'downloadFile' method.
        // Since the file already is download we will receive the url without invoking any more download process
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

.service('appSettings', function() {

        return {
            getLoginInfo: function() {
                //If basic auth is wanted
                var encoded =  Base64.encode('username' + ':' + 'password');
                return 'Basic ' + encoded;

                //Else just return empty
                // return '';
            }
        };
    })
```

[bower]: http://twitter.github.com/bower/
