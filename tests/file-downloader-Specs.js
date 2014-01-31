angular.module('file-downloader-spec',  [ 'com.verico.ng-cordova-file-downloader' ]);

describe('fileHandler specs', function() {

    var testObj = {
        url: 'http://test.com/img1234.jpg',
        dest: 'img1234_half.jpg',
        filePath: 'filePath://',
        downloadedPath: 'filePathLocal://',
        saveFolder: 'com.verico.file-default/'
    };

    var fileTransferMock;
    var appSettingMock;
    var fileDownloadService;
    var q;
    var timeout;
    var fileExistsFirstTime = true;
    var dummyFileList;
    var fileExisting;
    var noneExistits = false;

    //Load module
    beforeEach(function() {
        module('file-downloader-spec');
    });


    beforeEach(function() {
        fileExisting = [];

        fileTransferMock = {
            getFileTransfer: function() {
                return {
                    download: function(uri, path, sucsessCallback) {

                        fileExisting.push(path);

                        sucsessCallback({ fullPath: path });

                    }
                };
            },
            getFileSystem: function() {
                var fs = {};
                fs.root = {
                    getFile: function(file, options, callback, errorCallback) {
                        var  retFile = { fullPath: testObj.filePath + file };
                            retFile.file = function(cb,cbErr){
                                cb({
                                    size: 505
                                });

                        };

                        //When file dont exists,
                        if (options.create) {
                            callback(retFile);
                        }
                        else if(_.indexOf(fileExisting,testObj.filePath +  file) != -1){
                            callback(retFile);
                        }
                        else if (_.indexOf(fileExisting,testObj.filePath +  file) == -1){
                            errorCallback('File do not exists');
                        }
                        else {
                            if(fileExistsFirstTime){
                                fileExistsFirstTime = false;
                                errorCallback('error');
                            }
                            else {
                                callback(retFile);
                            }
                        }
                    },
                    getDirectory: function(dir, options, callback) {
                        callback(testObj.filePath);
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

    beforeEach(function() {
        //Mock service and controller
        inject(function(ngCordovaFileDownloader, $q, $timeout) {
            q = $q;
            timeout = $timeout;
            fileDownloadService = ngCordovaFileDownloader;

        });
    });

    it('1. service created', function() {
        expect(fileDownloadService).not.toEqual(null);
    });

    it('2. Test with existing file- should return Existing file mock', function() {

        var retUrl = null;


        fileDownloadService.downloadFile(testObj.url, testObj.dest).then(function (url) {
            retUrl = url;

        });

        timeout.flush();
        waitsFor(function () {
            return retUrl != null;
        });

        runs(function () {
            expect(retUrl).toEqual(testObj.filePath + testObj.saveFolder + testObj.dest);
        });

    });


    it('3. Test with non-existing file', function () {
        fileExistsFirstTime = false;

        var returned = false;
        var retUrl = null;

        var dunmyfile = 'notExisting.jpg';
        fileDownloadService.downloadFile(testObj.url, dunmyfile).then(function(url) {
            returned = true;
            retUrl = url;
        }, function(err){
            returned = true;

        });

        timeout.flush();
        waitsFor(function() {
            return returned;
        });

        runs(function() {
            expect(retUrl).toEqual(testObj.filePath + testObj.saveFolder + dunmyfile);
        });


    });

    describe('List download tests', function(){
        beforeEach(function(){
            noneExistits = true;
            dummyFileList = [];
            for(var i = 0; i < 50; i++){
                var obj = {
                  url : 'http://fileUrl?id=' + i,
                  name : 'file' + i
                };
                dummyFileList.push(obj);
            }
        });


        it('4. Should download all files',function(){
            fileDownloadService.downloadFileList(dummyFileList);
            timeout.flush();
            expect(fileExisting.length).toEqual(dummyFileList.length);
            _.each(dummyFileList, function(file){

                var fileName = testObj.filePath + testObj.saveFolder+  file.name;
                var f = _.indexOf(fileExisting, fileName);

                expect(f).not.toEqual(-1);
            });
        });
    });
});

