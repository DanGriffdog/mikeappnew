; (function (window, undefined) {

    if (window.App === void 0) {
        throw new Error('/bridge/core.js must be included before you can use data.js');
    }

    var App = window.App || {};

    var Data = App.Data = {

        VERSION: '1.0',
    };

    App.Extend(Data, App.Events);

})(window);