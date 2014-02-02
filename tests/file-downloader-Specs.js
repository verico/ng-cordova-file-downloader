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
    var fileSize;
    var downloadShouldFail;


    //Set default global values
    beforeEach(function(){
        fileSize = 501;
        downloadShouldFail = false;
    });



    var fileFactory = function(path){
        var  retFile = { fullPath: path };
        retFile.file = function(cb,cbErr){
            cb({
                size: fileSize,
                remove : function(cb){
                    cb();
                }
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
                    download: function(uri, path, sucsessCallback, errorCallback) {

                        if(!downloadShouldFail){
                            var retFile = fileFactory(path);
                            downloadedFiles.push(retFile);
                            sucsessCallback(retFile);
                        }
                        else{
                            errorCallback();
                        }

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


    describe('Single file download',function(){

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
            }, function(url){
                retUrl = url;
                returned = true;
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

        describe('File download failed',function(){

            beforeEach(function(){
                downloadShouldFail = true;
            });


            it('Download single file',function(){
                var returned = false;
                var failObj = null;

                fileDownloadService.downloadFile('testUrl', 'testFile').then(function(url) {
                    returned = true;

                },function(p_failObj){
                    returned = true;
                    failObj = p_failObj;
                });

                timeout.flush();
                waitsFor(function() {
                    return returned;
                });

                runs(function() {
                    expect(failObj.success).toEqual(false);
                });
            });
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
            var returned = false;

            fileDownloadService.downloadFileList(dummyFileList).then(function(){
                returned = true;
            });

            timeout.flush();
            waitsFor(function() {
                return returned;
            });

            runs(function() {
                expect(downloadedFiles.length).toEqual(dummyFileList.length);
                _.each(dummyFileList, function(file){
                    var dlFile = _.findWhere(downloadedFiles, {fullPath:saveFolder + '/'+ file.name });
                    expect(dlFile).not.toEqual(undefined);
                });
            });
        });

        describe('List download failed',function(){

            beforeEach(function(){
                downloadShouldFail = true;
            });

            it('Download list fail, should return objects of all failed',function(){
                var returned = false;
                var dlSummary = null;

                fileDownloadService.downloadFileList(dummyFileList).then(function(dlSummary){
                    returned = true;
                });

                timeout.flush();
                waitsFor(function() {
                    return returned;
                });

                runs(function() {
                    expect(dlSummary.length).toEqual(dummyFileList);

                    _.each(dlSummary, function(failed){
                        expect(failed.success).toEqual(false);
                    });

                });
            });
        });
    });


});

