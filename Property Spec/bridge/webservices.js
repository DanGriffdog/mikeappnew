; (function (window, undefined) {

    if (window.App === void 0) {
        throw new Error('/bridge/core.js must be included before you can use webServices.js');
    }

    var App = window.App || {};

    function _executeWebService(webService, callback) {

        if (typeof webService !== 'object') {
            throw new Error('You should pass a valid web service instance.');
        }

        if (typeof callback !== 'function') {
            throw new Error('You should provide a valid callback.');
        }

        try {

            //TODO: Implement the actual web service call
            var result = {};

            callback(result);
        }
        catch (ex) {
            //TODO: Log some kinda error
        }

    }

    var WebServices = App.WebServices = {

        VERSION: '1.0',

        execute: function (webService, callback) {
            _executeWebService(webService, callback);
        }
    };

    var WebService5 = App.WebServices.WebService5 = {
  "__id": "91909ae5-3660-11e7-850b-0003ffbb5e34",
  "name": "WebService5",
  "displayName": "youtubesearch",
  "httpMethod": "GET",
  "bodyContentType": "Json",
  "inputParameters": {
    "part": {
      "__id": "2d5dfe4c-b706-496b-b157-9bc416d70ab0",
      "type": "string",
      "style": "Query",
      "isRequired": false,
      "value": "snippet"
    },
    "channelId": {
      "__id": "cde6f8b8-e8e5-4bca-a27c-c91cb564d8cf",
      "type": "string",
      "style": "Query",
      "isRequired": false,
      "value": "UCN4oaBuZZqcms2CUdM3rGVg"
    },
    "order": {
      "__id": "80d94a73-7087-4a31-9150-462697e55798",
      "type": "string",
      "style": "Query",
      "isRequired": false,
      "value": "date"
    },
    "type": {
      "__id": "95014f78-1272-4101-93d6-d911c39010dd",
      "type": "string",
      "style": "Query",
      "isRequired": false,
      "value": "video"
    },
    "maxResults": {
      "__id": "c90cdf09-82fa-4e80-afba-5e68b86a7f90",
      "type": "string",
      "style": "Query",
      "isRequired": false,
      "value": "50"
    },
    "pageToken": {
      "__id": "b0ba7185-f07c-45af-9dd1-847cfc7857c2",
      "type": "NextPageToken",
      "style": "Query",
      "isRequired": false,
      "value": ""
    }
  },
  "execute": function (callback) { _executeWebService(App.WebServices.WebService5, callback); }
};


    App.Extend(WebServices, App.Events);

})(window);