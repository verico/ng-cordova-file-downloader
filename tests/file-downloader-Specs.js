angular.module('file-downloader-spec',  [ 'com.verico.ng-cordova-file-downloader' ]);

describe('fileHandler specs', function() {



    var saveFolder = 'com.verico.ng-cordova-files';

    var fileTransferMock;
    var appSettingMock;
    var fileDownloadService;
    var q;
    var timeout;

    //Variables used for mock of data
    var dummyFileList;
    var downloadedFiles;



    var fileFactory = function(path){
        var  retFile = { fullPath: path };
        retFile.file = function(cb,cbErr){
            cb({
                size: 505
            });
        };
        return retFile;
    };

    //Load module
    beforeEach(function() {
        module('file-downloader-spec');
    });

    //Mocking of the cordova file transfer api
    beforeEach(function() {
        downloadedFiles = [];

        fileTransferMock = {
            getFileTransfer: function() {
                return {
                    download: function(uri, path, sucsessCallback) {


                        var retFile = fileFactory(path);
                        downloadedFiles.push(retFile);
                        sucsessCallback(retFile);
                    }
                };
            },
            getFileSystem: function() {
                var fs = {};
                fs.root = {
                    getFile: function(file, options, callback, errorCallback) {

                        var exists =  _.findWhere(downloadedFiles, {fullPath: file});

                        //When file dont exists,
                        if (options.create) {
                            var retFile = fileFactory(file);
                            callback(retFile);
                        }
                        else if(exists){
                            callback(exists);
                        }
                        else{
                            errorCallback('File do not exists');
                        }
                    },
                    getDirectory: function(dir, options, callback) {
                        callback(saveFolder);
                    }
                };


                var deferred = q.defer();
                timeout(function() {
                    deferred.resolve(fs);
                }, 10);


                return deferred.promise;
            }
        };
        module(function($provide) {
            $provide.value('fileTransfer', fileTransferMock);
        });
    });

    //Mock of appSetting service
    beforeEach(function(){
        appSettingMock = {
            getLoginInfo : function(){
                return "user:pw";
            }
        };
        module(function($provide) {
            $provide.value('appSettings', appSettingMock);
        });
    });

    //Injects dependencies into mock variables
    beforeEach(function() {
        //Mock service and controller
        inject(function($q, $timeout, ngCordovaFileDownloader) {
            q = $q;
            timeout = $timeout;
            ngCordovaFileDownloader.setSaveFolder(saveFolder);
            fileDownloadService = ngCordovaFileDownloader;
        });
    });

    it('1. service created', function() {
        expect(fileDownloadService).not.toEqual(null);
    });

    it('2. Test with existing file- should return existing file url', function() {

        var file = fileFactory(saveFolder + '/testFile');
        downloadedFiles.push(file);
        var retUrl = null;
        fileDownloadService.downloadFile('download/testFile', 'testFile').then(function (url) {
            retUrl = url;
        });

        timeout.flush();
        waitsFor(function () {
            return retUrl != null;
        });

        runs(function () {
            expect(retUrl).toEqual(file.fullPath);
        });

    });


    it('3. Test with non-existing file', function () {
        var returned = false;
        var retUrl = null;

        fileDownloadService.downloadFile('testUrl', 'testFile').then(function(url) {
            returned = true;
            retUrl = url;
        });

        timeout.flush();
        waitsFor(function() {
            return returned;
        });

        runs(function() {
            expect(downloadedFiles.length).toEqual(1);
            expect(retUrl).toEqual(downloadedFiles[0].fullPath);
        });
    });

    describe('List download tests', function(){
        beforeEach(function(){
            dummyFileList = [];
            for(var i = 0; i < 50; i++){
                dummyFileList.push( { url: 'downloadUrl' + i, name: 'testFile' + i});
            }
        });

        it('4. Should download all files',function(){
            fileDownloadService.downloadFileList(dummyFileList);
            timeout.flush();
            expect(downloadedFiles.length).toEqual(dummyFileList.length);
            _.each(dummyFileList, function(file){
                var dlFile = _.findWhere(downloadedFiles, {fullPath:saveFolder + '/'+ file.name });
                expect(dlFile).not.toEqual(undefined);
            });
        });
    });
});

