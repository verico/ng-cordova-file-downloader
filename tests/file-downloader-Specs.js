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
                        var exists = false;
                        for(var i = 0; i < downloadedFiles.length; i++){
                            if(downloadedFiles[i].fullPath == file){
                                exists = downloadedFiles[i];
                                break;
                            }
                        }
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

        it('2. Test with existing file- should return existing file url', function(done) {
            var file = fileFactory(saveFolder + '/testFile');
            downloadedFiles.push(file);
            fileDownloadService.downloadFile('download/testFile', 'testFile').then(function (dlSummary) {
                expect(dlSummary.fullPath).toEqual(file.fullPath);
                done();
            });
            timeout.flush();
        });


        it('3. Test with non-existing file', function (done) {
            fileDownloadService.downloadFile('testUrl', 'testFile').then(function(dlSummary) {
                expect(downloadedFiles.length).toEqual(1);
                expect(dlSummary.fullPath).toEqual(downloadedFiles[0].fullPath);
                done();
            });

            timeout.flush();
        });

        describe('File download failed',function(){

            beforeEach(function(){
                downloadShouldFail = true;
            });

            it('Download single file',function(done){
                fileDownloadService.downloadFile('testUrl', 'testFile').then(function(url) {
                    expect("If file this happens somehting is wrong").toEqual(false);
                },function(p_failObj){
                    expect(p_failObj.success).toEqual(false);
                    done();
                });
                timeout.flush();
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

        it('4. Should download all files',function(done){

            fileDownloadService.downloadFileList(dummyFileList).then(function(dlSummary){
                expect(downloadedFiles.length).toEqual(dummyFileList.length);
                expect(dlSummary.length).toEqual(dummyFileList.length);
                angular.forEach(dummyFileList, function(file){
                    var dlFile = undefined;
                    for(var i = 0; i < downloadedFiles.length; i++){
                        if(downloadedFiles[i].fullPath == saveFolder + '/'+ file.name){
                            dlFile = downloadedFiles[i];
                            break;
                        }
                    }
                    expect(dlFile).not.toEqual(undefined);
                });
                angular.forEach(dlSummary,function(s){
                    expect(s.success).toEqual(true);
                });

                done();
            });

            timeout.flush();
        });

        describe('List download failed',function(){

            beforeEach(function(){
                downloadShouldFail = true;
            });

            it('Download list fail, should return objects of all failed',function(done){

                fileDownloadService.downloadFileList(dummyFileList).then(function(summary){
                    expect(summary.length).toEqual(dummyFileList.length);
                    angular.forEach(summary, function(failed){
                        expect(failed.success).toEqual(false);
                    });

                    done();
                });
                timeout.flush();

            });
        });
    });


});

