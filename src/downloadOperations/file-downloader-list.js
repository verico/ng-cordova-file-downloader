angular.module('com.verico.ng-cordova-file-downloader').
    service('fileDownloaderList', function($q,$timeout, appSettings,fileDownloaderSingle) {
        var _public = {};
        var _private ={};

        _public. downloadFileList  = function(files){
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

            var first = _private.getNextPart(0, files);
            var count = first.length;

            var sectionReady = function (summaries) {
                angular.forEach(summaries,function(s){
                    summary.push(s);
                });

                $timeout(function () {
                    if (count < files.length && !cancel) {
                        var part = _private.getNextPart(count, files);
                        count = count + part.length;
                        _private.downloadFileSection(part).then(sectionReady);
                    } else {
                        deferred.resolve(summary);
                    }
                }, 0);

                returned += summaries.length;
                deferred.notify(feedback);
            };

            _private.downloadFileSection(first).then(sectionReady);
            return deferred.promise;

        };


        _private.getNextPart = function (start, array) {
                var sectionSize = 10;
                var part;
                if (array.length > start + (sectionSize - 1)) {
                    part = array.slice(start, start + sectionSize);
                } else {
                    part = array.slice(start, array.length);
                }
                return part;
            };
        _private.downloadFileSection = function (files) {
                var deferred = $q.defer();

                var promises = [];

                angular.forEach(files, function(file) {
                    var q = fileDownloaderSingle.downloadFileFromUrl(file.url, file.name);
                    promises.push(q);
                });

                var done = function(all) {
                    deferred.resolve(all);
                };

                var doneWithFailed = function(all){
                    deferred.resolve(all);
                };

                $q.allSettled(promises).then(done, doneWithFailed);

                return deferred.promise;
            };

        return _public;
    });