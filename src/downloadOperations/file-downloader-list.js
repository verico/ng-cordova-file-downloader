(function() {
    "use strict";

    angular.module('com.verico.ng-cordova-file-downloader').
        service('fileDownloaderList', function($q,$timeout, appSettings,fileDownloaderSingle) {


            function getNextPart(start, array) {
                var sectionSize = 10;
                var part;
                if (array.length > start + (sectionSize - 1)) {
                    part = array.slice(start, start + sectionSize);
                } else {
                    part = array.slice(start, array.length);
                }
                return part;
            }

            function downloadFileSection (files) {
                var deferred = $q.defer();
                var promises = [];

                files.forEach(function(file) {
                    var q = fileDownloaderSingle.downloadFileFromUrl(file.url, file.name);
                    promises.push(q);
                });

                function done(all) {
                    deferred.resolve(all);
                }

                $q.allSettled(promises).then(done,done);

                return deferred.promise;
            }

            return {
                downloadFileList : function(files){
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

                    var first = getNextPart(0, files);
                    var count = first.length;

                    function sectionReady(summaries) {
                        summaries.forEach(function(s){
                            summary.push(s);
                        });

                        $timeout(function () {
                            if (count < files.length && !cancel) {
                                var part = getNextPart(count, files);
                                count = count + part.length;
                                downloadFileSection(part).then(sectionReady);
                            } else {
                                deferred.resolve(summary);
                            }
                        }, 0);

                        returned += summaries.length;
                        deferred.notify(feedback);
                    }

                    downloadFileSection(first).then(sectionReady);
                    return deferred.promise;
                }
            };
        });
})();