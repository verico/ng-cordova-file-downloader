angular.module('com.verico.ng-cordova-file-downloader').
    service('downloadFeedbackFactory', function() {

        var getFeedback = function(p_success, p_url, p_name, p_fullpath){

            return {
                success :p_success,
                url : p_url,
                name : p_name,
                fullpath : p_fullpath
            };
        };

        return {
            feedback : getFeedback
        }
    });
