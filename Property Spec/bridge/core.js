; (function (window, undefined) {

    var App = window.App || {};
    var Modules = App.Modules = {};

    /**
     * Contains information about the current module version.
     * @class
     * @since 2.0.1
     * @property {Number} major The major number of this release.
     * @property {Number} minor The minor number of this release.
     * @property {Number} build The build number of this release.
     */
    App.Modules.Version = function (major, minor, build) {

        this.major = major;
        this.minor = minor;
        this.build = build;
    };

    /**
     * Returns a string representation of the current version object.
     * @return {string} The current version number as a string.
     * @public
     * @since 2.0.1
     */
    App.Modules.Version.prototype.toString = function () {
        return this.major + '.' + this.minor + '.' + this.build;
    };

    /**
     * Will check if the current version is the same of newer than the specified version number.
     * @param  {string} version The version number string. e.g. 2.0.1
     * @return {Boolean}        Will return true when the current version is greather than or the same as the specified version number; otherwise false.
     * @public
     * @since 2.0.1
     */
    App.Modules.Version.prototype.checkVersion = function (version) {

        if (!version) return false;

        if(version instanceof App.Modules.Version) {
            return this.major >= version.major && this.minor >= version.minor && this.build >= version.build;
        }

        var components = version.split(".");
        if (components) {
            if (components.length === 1) return this.major >= parseInt(components[0]);
            if (components.length === 2) return this.major >= parseInt(components[0]) && this.minor >= parseInt(components[1]);
            if (components.length >= 3) return this.major >= parseInt(components[0]) && this.minor >= parseInt(components[1]) && this.build >= parseInt(components[2]);
        }

        return false;
    };

    window.App = App;
})(window);

; (function (window, undefined) {

    var App = window.App || {};

    /**
     * @file Contains the core features of the AppMachine JavaScript SDK and can be used to interact with the AppMachine framework.
     * @author AppMachine
     * @copyright 2015 by AppMachine
     * @see https://support.appmachine.com/hc/en-us/sections/200622406-JavaScript
     * @see https://support.appmachine.com/hc/en-us/articles/203990983-Module-core-js
     */

    var version = App.Version = App.version = new App.Modules.Version(2,0,3);

    /**
     * Contains the current version string.
     * @type {String}
     * @deprecated Use App.version instead.
     */
    App.VERSION = App.version.toString();
    App.BaseUrl = '';

    var _self = this;
    var _eventSplitter = /\s+/;
    var _registeredMethodsReplacements = {};
    var _protectedMethods = [];

    /**
     * @private
     * Will check if there is a method extension available for the specified method name.
     * @param  {String} methodName The name of the method that should be checked for extensions.
     * @return {Boolean}           true when there is an extension available; otherwise false.
     */
    function _methodExtensionIsAvailable(methodName) {

        if (typeof methodName !== 'string') {
            return false;
        }

        return _registeredMethodsReplacements.hasOwnProperty(methodName);
    }

    /**
     * @private
     * Will invoke an extension method for the specified method name without the risk of uncaught exceptions.
     * @param  {String} methodName The name of the method extension that should be invoked.
     * @param  {Array} arguments   The collection of arguments that should be passed as parameters when invoking the method.
     * @return {Object}            The result of the method extension being invoked; or null when method invocation failed.
     * @throws {Error} If the methodName is not of type String or is undefined.
     * @throws {Error} If arguments have been specified but are not passed as an Array.
     */
    function _safeInfoMethod(methodName, arguments) {

        if (typeof methodName !== 'string') {
            throw new Error('methodName should be of type string and should not be empty.');
        }

        if (arguments && !(arguments instanceof Array)) {
            throw new Error('arguments should either be undefined, or be of type Array');
        }

        var methodToInvoke = _registeredMethodsReplacements[methodName];
        if (methodToInvoke) {

            try {
                return methodToInvoke.apply(_self, arguments);
            }
            catch (ex) {
                //TODO: Do some logging
            }
        }

        return null;
    }

    /**
     * @private
     * Will determine if the specified object is empty.
     * @param  {Object}  obj The object that should be checked for empty values.
     * @return {Boolean}     True when the object is empty; otherwise false.
     */
    function _isEmpty(obj) {
        if (obj == null) return true;
        if (obj instanceof Array || typeof (obj) === 'String') return obj.length === 0;
        if (obj instanceof Object) return Object.keys(obj).length === 0;
        return true;
    };

    /**
     * @private
     * Will execute a method using the bridge.
     * @param  {String}   type     The name of the method or resource that should be executed.
     * @param  {Object}   args     A collection of arguments that should be passed along to the processing host.
     * @param  {Function} callback [description]
     * @param  {Boolean}  isError  [description]
     * @return {Object}            The result of the method being executed.
     * @throws {Error} If there is no implementation available for the execute method.
     */
    function _execute(type, args, callback, isError) {

        if (_methodExtensionIsAvailable('execute')) {
            return _safeInfoMethod('execute', [type, args, callback, isError]);
        }

        if(App.IsDevelopment) {
            console.warning('no implementation available for the execute method, however when you publish your changes this method will work');
            return;
        }

        throw new Error('no implementation available for the execute method');
    };

    /**
     * @private
     * Will convert the specified object into a string value.
     * @param  {Object} obj The object that should be converted into a string value.
     * @return {String}     The string representation of the specified object.
     */
    function _objToUrlString(obj) {

        if (!obj) {
            return '';
        }

        var str = '';
        for (var p in obj) {
            if (obj.hasOwnProperty(p)) {
                str += p + '=' + encodeURIComponent(obj[p]) + '&';
            }
        }
        return str.slice(0, -1);
    };

    /**
     * @private
     * Register a method replacement for the core based on the specified method name.
     * @param  {String} methodName The name of the method that should be replaced.
     * @param  {Function} method   The new implementation of the method that should be replaced.
     * @throws {Error} If the methodName is not of type String or is undefined.
     * @throws {Error} If the method is not of type Function or is undefined.
     * @throws {Error} If the method you are trying to replace has been protected against method replacement.
     */
    function _registerMethodReplacement(methodName, method) {

        if (typeof methodName !== 'string') {
            throw new Error('methodName should be of type string and have a valid value');
        }

        if (typeof method !== 'function') {
            throw new Error('method should be a valid function');
        }

        if (_protectedMethods.indexOf(methodName) >= 0) {
            throw new Error('the method you are trying to extend has been protected against method extensions.');
        }

        _registeredMethodsReplacements[methodName] = method;
    };

    /**
     * @private
     * Will get the collection of records available in the current scope of the application.
     * @param  {Function} callback The callback method that should be invoked once the Array of records is available.
     * @throws {Error} If the callback has been specified but isn't a function, or when callback is undefined.
     */
    function _getRecords(callback) {

        if (typeof callback !== 'function') {
            throw new Error('callback must be of type function and should be able to handle one parameter containing an array of records.');
        }

        //<!-- inject[Records] -->

        App.execute('app/core/getRecords', null, function (result) {
            callback(result);
        });
    }

    /**
    * Will get the current selected record available in the current scope of the application.
    * @param  {Function} callback The callback method that should be invoked once the record has been retrieved.
    * @throws {Error} If the callback has been specified but isn't a function, or when callback is undefined.
    */
    function _getCurrentRecord(callback) {

        if (typeof callback !== 'function') {
            throw new Error('callback must be of type function and should be able to handle one parameter containing an array of records.');
        }

        //<!-- inject[CurrentRecord] -->

        App.execute('app/core/getCurrentRecord', null, function (result) {
            callback(result);
        });
    }

    function _navigateToBlock(blockIdentifier, callback) {

        if (typeof blockIdentifier !== 'string') {
            throw new Error('A valid block identifier is required.');
        }

        _execute('app/core/navigateTo', { target: blockIdentifier }, callback);
    }

    function _navigateToDetail(activeItemId) {

        if (!activeItemId) {
            throw new Error('A valid active item id should be specified');
        }

        _execute('app/core/navigateToDetail', { activeItemId: activeItemId }, null);
    }

    function _getVariable(key, callback) {

        if (!key) {
            throw new Error('A valid key should be specified.');
        }

        if (!callback || typeof callback !== 'function') {
            throw new Error('You need to provide a valid callback.');
        }

        _execute('app/core/getVariable', { 'key': key }, function (result) {

            if (result) {
                callback(result.value);
            }

        });
    }

    function _setVariable(key, value) {

        if (!key) {
            throw new Error('A valid key should be specified.');
        }

        _execute('app/core/setVariable', {
            'key': key,
            'value': value
        }, null);
    }

    function _getImageUrl(imageid, callback) {
        if (!imageid) {
            throw new Error('An image id should be specified.');
        }

        if (!callback || typeof callback !== 'function') {
            throw new Error('You need to provide a valid callback.');
        }

        _execute('app/core/getImageUrl', { 'imageid': imageid }, function (result) {

            if (result) {
                callback(result);
            }

        });
    }

    function _goBack() {
        _execute('app/core/goBack', null, null);
    }

    var Extend = App.Extend = function (obj) {
        if (obj === void 0) {
            obj = {};
        }

        var arguments = Array.prototype.slice.call(arguments, 1);
        if (arguments.length == 0) {
            return null;
        }

        for (var i = 0; i < arguments.length; i++) {
            var source = arguments[i];
            if (source == null) {
                continue;
            }

            for (var prop in source) {
                obj[prop] = source[prop];
            }
        }

        return obj;
    };

    function _eventsApi(obj, action, name, rest) {
        if (!name) return true;


        if (typeof name === 'object') {
            for (var key in name) {
                obj[action].apply(obj, [key, name[key]].concat(rest));
            }
            return false;
        }

        if (_eventSplitter.test(name)) {
            var names = name.split(_eventSplitter);
            for (var i = 0, l = names.length; i < l; i++) {
                obj[action].apply(obj, [names[i]].concat(rest));
            }
            return false;
        }

        return true;
    };

    function _triggerEvents(events, args) {
        var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
        switch (args.length) {
            case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
            case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
            case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
            case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
            default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args); return;
        }
    };

    /**
     * Contains the core functionallity you can use to build your block.
     * @type {Object} The core object containing basic functionallity to build your block.
     */
    var Core = App.Core = {

        /**
         * @protected
         */
        execute: function (type, args, callback) {
            _execute(type, args, callback);
        },

        logError: function (msg, url, line, ex) {
            App.trigger('error', { msg: msg, url: url, line: line });
            _execute('app/core/log', { level: 'ERROR', msg: msg, url: url, line: line }, null, true);
        },

        log: function (level, msg, url, line, ex) {
            _execute('app/core/log', { level: level, msg: msg, url: url, line: line }, null, true);
        },

        /**
         * Will get the current version of core.js, this value will be the same as App.VERSION.
         * @return {String} The current version of core.js.
         */
        getVersion: function () {
            return App.version.toString();
        },

        /**
         * @public
        * Will get the collection of records available in the current scope of the application.
        * @param  {Function} callback The callback method that should be invoked once the Array of records is available.
        * @throws {Error} If the callback has been specified but isn't a function, or when callback is undefined.
        */
        getRecords: function (callback) {
            _getRecords(callback);
        },

        /**
         * @public
         * Will get the current selected record available in the current scope of the application.
         * @param  {Function} callback The callback method that should be invoked once the record has been retrieved.
         * @throws {Error} If the callback has been specified but isn't a function, or when callback is undefined.
         */
        getCurrentRecord: function (callback) {
            _getCurrentRecord(callback);
        },

        /**
        * @public
        * Allows you to retrieve a variable from the application scope.
        * @param   {String}    key       The variable name.
        * @param   {Function}  callback  The callback method that should be invoked once the variable value has been retrieved.
        * @throws  {Error} If no valid key has been specified.
        * @throws  {Error} If no valid callback function has been specified.
        */
        getVariable: function (key, callback) {
            _getVariable(key, callback);
        },

        /**
        * @public
        * Allows you to get an image url based on an image id
        * @param   {String}    imageid       The id of the image.
        * @param   {Function}  callback  The callback method that should be invoked once the variable value has been retrieved.
        * @throws  {Error} If no valid imageid has been specified.
        * @throws  {Error} If no valid callback function has been specified.
        */
        getImageUrl: function (imageid, callback) {
            _getImageUrl(imageid, callback);
        },

        /**
        * @public
        * Will go back to the parent block of this javascript block.
        */
        goBack: function () {
            _goBack();
        },

        /**
         * @public
         * Will navigate to a building block matching the given block identifier.
         * @param   {String}    blockIdentifier The identifier of the building block, this can be the caption, variable name or id.
         * @param   {Function}  callback       The callback method that should be invoked once navigation completed.
         * @throws  {Error}     If the block identifier is not of type string or is undefined.
         */
        navigateToBlock: function (blockIdentifier, callback) {
            _navigateToBlock(blockIdentifier, callback);
        },

        /**
         * Will navigate to a specefic data item based on the identifier.
         * @param  {GUID} activeItemId The unique identifier of the item that should become active.
         * @throws {Error} If an invalid active item item has been specified.
         * @public
         */
        navigateToDetail: function (activeItemId) {
            _navigateToDetail(activeItemId);
        },

        /**
        * @public
        * Allows you to store a variable in the application scope.
        * @param   {String}  key    The variable name.
        * @param   {Object}  value  The variable value.
        * @throws  {Error} If no valid key has been specified.
        */
        setVariable: function (key, value) {
            _setVariable(key, value);
        },

        /**
         * Will show a modal loader indicator.
         * @public
         * @since 2.0.1
         */
        showLoader: function () {
            _execute('app/core/showLoader', null, null);
        },

        /**
         * Will hide the modal loader indicator.
         * @public
         * @since 2.0.1
         */
        hideLoader: function () {
            _execute('app/core/hideLoader', null, null);
        },

        /**
         * @protected
         */
        registerMethodReplacement: function (methodName, method) {
            _registerMethodReplacement(methodName, method);
        }
    };

    App.Extend(App, Core);

    /**
     * @public
     * Events can be used to subscribe to or trigger events in your Javascript Block.
     * @type {Object}
     */
    var Events = App.Events = {

        /**
         * @public
         * Subscribe to an event with the specified name, once that event is triggered your callback will be invoked.
         * @param  {String}   name     The name of the event you want to subscribe to.
         * @param  {Function} callback The function that should be invoked once the event is raised.
         * @param  {Object}   context  The binding context of the event subscription.
         * @return {Object}            The current Events instance.
         */
        on: function (name, callback, context) {
            if (!_eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
            this._events || (this._events = {});
            var events = this._events[name] || (this._events[name] = []);
            events.push({ callback: callback, context: context, ctx: context || this });
            return this;
        },

        /**
         * @public
         * Unsubscribe from an event with the specified name.
         * @param  {String}   name     The name of the event you want to unsubscribe from.
         * @param  {Function} callback The function that should no longer be invoked once the event is raised.
         * @param  {Object}   context  The binding context of the event subscription.
         * @return {Object}            The current Events instance.
         */
        off: function (name, callback, context) {
            var retain, ev, events, names, i, l, j, k;
            if (!this._events || !_eventsApi(this, 'off', name, [callback, context])) return this;
            if (!name && !callback && !context) {
                this._events = void 0;
                return this;
            }
            names = name ? [name] : Object.keys(this._events);
            for (i = 0, l = names.length; i < l; i++) {
                name = names[i];
                if (events = this._events[name]) {
                    this._events[name] = retain = [];
                    if (callback || context) {
                        for (j = 0, k = events.length; j < k; j++) {
                            ev = events[j];
                            if ((callback && callback !== ev.callback && callback !== ev.callback._callback) || (context && context !== ev.context)) {
                                retain.push(ev);
                            }
                        }
                    }
                    if (!retain.length) delete this._events[name];
                }
            }

            return this;
        },

        /**
         * @public
         * Raise an event with the specified name so all the subscribers will have the registered callback invoked.
         * @param  {String} name The name of the event that should be raised.
         * @return {Object}      The current Events instance.
         */
        trigger: function (name) {
            if (!this._events) return this;
            var args = Array.prototype.slice.call(arguments, 1);
            if (!_eventsApi(this, 'trigger', name, args)) return this;
            var events = this._events[name];
            var allEvents = this._events.all;
            if (events) _triggerEvents(events, args);
            if (allEvents) _triggerEvents(allEvents, arguments);
            return this;
        },

        /**
         * -- To be added --
         * @param  {[type]}   obj      [description]
         * @param  {[type]}   name     [description]
         * @param  {Function} callback [description]
         * @return {[type]}            [description]
         */
        stopListening: function (obj, name, callback) {
            var listeningTo = this._listeningTo;
            if (!listeningTo) return this;
            var remove = !name && !callback;
            if (!callback && typeof name === 'object') callback = this;
            if (obj) (listeningTo = {})[obj._listenId] = obj;
            for (var id in listeningTo) {
                obj = listeningTo[id];
                obj.off(name, callback, this);
                if (remove || _isEmpty(obj._events)) delete this._listeningTo[id];
            }
            return this;
        }
    };

    /**
     * @public
     * Subscribe to an event with the specified name, once that event is triggered your callback will be invoked.
     */
    Events.bind = Events.on;

    /**
     * @public
     * Unsubscribe from an event with the specified name.
     */
    Events.unbind = Events.off;

    /**
    * Contains both properties for your block provided by AppMachine as well as your own defined properties.
    */
    var Properties = App.Properties = {
  "__applicationid": "060e904f-0b58-4cc6-9cb1-da6d8f4367c4",
  "__id": "38560eaf-5cd7-11e7-b124-0003ffbb5e34",
  "__icon": "",
  "__caption": "Property Spec",
  "__apiurl": "https://api.appmachine.com/v1"
};

    App.Extend(App, Events);

    window.App = App;

})(window);

; (function (window, undefined) {

    var App = window.App || {};

    // ------- Notifications module ------- //

    /**
     * Creates a new Notification module instance.
     * @class
     * @version 2.0.2
     */
    App.Modules.Notification = function () { };

    /**
     * Available repeat intervals for local notifications.
     * @readOnly
     * @enum {number}
     * @static
     */
    App.Modules.Notification.repeatInterval = {

        /** @type {Number} Do not repeat the notification */
        none: 0,

        /** @type {Number} Repeat the notification every second */
        second: 1,

        /** @type {Number} Repeat the notification every minute */
        minute: 2,

        /** @type {Number} Repeat the notification every hour */
        hour: 3,

        /** @type {Number} Repeat the notification every day */
        day: 4,

        /** @type {Number} Repeat the notification every week */
        week: 5,

        /** @type {Number} Repeat the notification every month */
        month: 6,

        /** @type {Number} Repeat the notification every year */
        year: 7
    };

    /**
    * Will show an alert dialog with the specified title and message. Optionally you can specify buttons that should be sown in the dialog.
    * @param  {String} title                The title that should be shown in the dialog.
    * @param  {String} message              The message that should be shown in the dialog.
    * @param  {Array} buttons               An Array of strings containing the buttons.
    * @param  {Function} buttonClickHandler The callback method that should be invoked once the user hits a button.
    * @throws {TypeError} If both the title and message are undefined or empty.
    * @throws {TypeError} If the buttons argument does not contain a valid array with strings.
    * @public
    */
    App.Modules.Notification.prototype.showAlertMessage = function (title, message, buttons, buttonClickHandler) {

        if (!title && !message) {
            throw new Error('You need to provide a title or a message.');
        }

        //Make sure there are some valid buttons available
        buttons = buttons || ['OK'];

        if (!(buttons instanceof Array)) {
            throw new TypeError('The buttons argument should contain an array of button titles');
        }

        var arguments = {
            title: title,
            message: message,
            buttons: JSON.stringify(buttons)
        };

        window.App.Core.execute('app/core/notification/showAlert', arguments, buttonClickHandler);

    };

    /**
     * Will create a new local notification that will show at the specified fireDate.
     * @param  {String}   message  The message that should be shown in the notification.
     * @param  {Date}   fireDate The date at which the notification should be shown.
     * @param  {repeatInterval}   interval The repeat interval for this notification.
     * @param  {function(object)} callback The callback method that should be invoked once the notification has been created.
     * @throws {TypeError} If no valid message has been specified.
     * @throws {TypeError} If no valid fireDate has been specified.
     * @throws {TypeError} If no valid interval has been specified.
     * @throws {TypeError} If no valid callback function has been specified.
     * @public
     * @since 2.0.2
     * @example
     * //Set the fire date 25 seconds from now
var now = new Date(Date.now());
now.setSeconds(now.getSeconds() + 25);

//Create a non repeating notifcation
window.App.Notification.createLocalNotification("Test notification message", now, window.App.notifications.repeatInterval.none, function(notification) {

    //Contains the notification that has been created.
    localStorage.setItem('notificationId', notification.id);
});
     */
    App.Modules.Notification.prototype.createLocalNotification = function (message, fireDate, interval, callback) {

        if (!message) {
            throw new TypeError('You should provide a valid message.');
        }

        if (!fireDate) {
            fireDate = new Date(Date.now());
        }

        if (!(fireDate instanceof Date)) {
            throw new TypeError('You should provide a valid fireDate');
        }

        if (typeof interval === 'undefined') {
            interval = App.Modules.Notification.repeatInterval.none;
        }

        if (typeof interval !== 'number' || interval < App.Modules.Notification.repeatInterval.none || interval > App.Modules.Notification.repeatInterval.year) {
            throw new TypeError('The specified interval is invalid, use window.App.notification.repeatInterval to specify a valid interval.');
        }

        if (callback && !(typeof callback === 'function')) {
            throw new TypeError('Parameter callback should be of type function');
        }

        var arguments = {
            message: message,
            fireDate: fireDate.toJSON(),
            repeatInterval: interval
        };

        window.App.Core.execute('app/core/notification/createLocalNotification', arguments, function (result) {

            if (callback) {
                callback(result);
            }

        });

    };

    /**
     * Will cancel a local notification matching the specified notificationId.
     * @param  {String} notificationId The id of the notification that should be cancelled.
     * @throws {TypeError} If no valid notificationId has been specified.
     * @public
     * @since 2.0.2
     * @example
     * //Get the notification id from local storage and cancel the notification
var notificationId = localStorage.getItem('notificationId');
if (notificationId){
    window.App.notifications.cancelLocalNotification(notificationId);
}
     */
    App.Modules.Notification.prototype.cancelLocalNotification = function (notificationId) {

        if (!notificationId) {
            throw new TypeError('You should provide a valid notificationId');
        }

        var arguments = {
            notificationId: notificationId
        };

        window.App.Core.execute('app/core/notification/cancelLocalNotification', arguments, null);

    };

    var notifications = App.Notification = App.Notifications = App.notifications = new App.Modules.Notification();

})(window);

; (function (window, undefined) {

    var App = window.App || {};

    /**
     * Creates a new Cache module instance.
     * @class
     * @version 2.0.2
     */
     App.Modules.Cache = function () { };

     /**
      * Download an image using the AppMachine Image cache, doing so will allow you to request the image (if it has been downloaded before) even when the user is offline.
      * @param  {String} url The url of the image that should be downloaded.
      * @param  {String} type The image type (jpg or png) of the resulting image.
      * @param  {Function} onCompleted The callback that should be invoken once the image has been downloaded or loaded from cache.
      * @param  {Function} onFailed The function that should be invoked if the download fails.
      * @throws {TypeError} If no valid image url has been provided.
      * @throws {TypeError} If an invalid image type or no image type has been provided.
      * @throws {TypeError} If no valid onComplete handler has been specified.
      * @public
      */
      App.Modules.Cache.prototype.downloadImage = function (url, type, onCompleted, onFailed) {

        type = type || 'png';

        if (!url || typeof url !== 'string') {
            throw new TypeError('You need to provide a valid image download URL');
        }

        if (type !== 'png' && type !== 'jpg') {
            throw new TypeError('You need to provide a valid image type, supported types are jpg and png');
        }

        if (!onCompleted || typeof onCompleted !== 'function') {
            throw new TypeError('You need to provide a valid onCompleted handler before you can download an image.');
        }

        window.App.Core.execute('app/core/cache/downloadImage', { url: url, imageType: type }, function (result) {

            if (result && typeof result === 'string' && result.length > 1) {
                onCompleted(result);
                return;
            }

            if (onFailed) {

                if (result && result.hasOwnProperty('reason')) {
                    onFailed(result.reason);
                    return;
                }

                onFailed('Failed to download your image');
            }
        });

    };

    /**
     * Will store an object in the app storage. This acts roughly the same as localstorage, but uses device native storage.
     * @param {String} key       The that should be used to store the object.
     * @param {Object} value     The object that should be stored. This object should be serilizable.
     * @param {Boolean} secure   If set to true the item will only be accessable from within this JavaScript block; if set to false the item with this key kan be shared with other javascript blocks.
     * @public
     * @since 2.0.2
     * @throws {TypeError} If an invalid key or no key has been specfied.
     */
    App.Modules.Cache.prototype.setItem = function(key, value, secure) {

        if(!key || typeof key !== 'string'){
            throw new TypeError('The key should be a valid string');
        }

        if(typeof secure === 'undefined' || typeof secure !== 'boolean') {
            secure = true;
        }

        var arguments = {
            key: key,
            value: value,
            secure: secure
        };

        window.App.Core.execute('app/core/cache/setItem', arguments, null);
    };

    /**
     * Will retrieve an object stored in the app storage and will invoke the specified callback method with the result.
     * @param  {String}   key      The key that was used to store the object.
     * @param  {Function} callback The callback method that should be invoked with the result.
     * @public
     * @since 2.0.2
     * @throws {TypeError} If an invalid key or no key has been specfied.
     * @throws {TypeError} If no callback has been specified or if the specified callback isn't a function.
     * @throws {TypeError} If the specified callback doesn't have exactly one argument / parameter.
     */
    App.Modules.Cache.prototype.getItem = function(key, callback) {

        if(!key || typeof key !== 'string'){
            throw new TypeError('The key should be a valid string');
        }

        if(typeof callback !== 'function') {
            throw new TypeError('A valid callback should be specified');
        }

        if(callback.length !== 1) {
            throw new TypeError('The callback should have one argument/parameter');
        }

        var arguments = {
            key: key
        };

        window.App.Core.execute('app/core/cache/getItem', arguments, callback);
    };

    /**
     * Will remove an object from the app storage with the specified key.
     * @param  {String} key The key used to store the object.
     * @public
     * @since 2.0.2
     * @throws {TypeError} If If an invalid key or no key has been specfied.
     */
    App.Modules.Cache.prototype.removeItem = function(key) {

        if(!key || typeof key !== 'string') {
            throw new TypeError('The key should be a valid string');
        }

        var arguments = {
            key: key
        };

        window.App.Core.execute('app/core/cache/removeItem', arguments, null);
    };

    App.Cache = App.cache = new App.Modules.Cache();

})(window);
; (function (window, undefined) {
    var App = window.App || {};

    var _awaitingForCallback = {};

    /**
     * Return a stylesheet or create a new one.
     */
    function _getStyleSheet() {
        var styleSheet;

        for (var i = 0; i < document.styleSheets.length; i++) {
            styleSheet = document.styleSheets[i];
            if (styleSheet.rules || styleSheet.cssRules) return styleSheet;
        }

        styleSheet = (function () {
            var style = document.createElement('style');
            style.appendChild(document.createTextNode(''));
            document.head.appendChild(style);
            return style.sheet;
        })();
        return styleSheet;
    }


    function _insertCssRule(key, cssRules, sheet) {
        var index = sheet.rules ? sheet.rules.length : sheet.cssRules ? sheet.cssRules.length : -1;
        if (index !== -1) {
            if (sheet.insertRule) {
                try {
                    sheet.insertRule(key + '{' + cssRules + '}', index);
                } catch (ex) {
                    sheet.addRule(key, cssRules);
                }
            } else {
                sheet.addRule(key, cssRules, index);
            }
        }
    }

    function _addCssStyles(obj) {
        document.body.classList.add('am-desktop');
        if (obj.styles) {
            var styleSheet = _getStyleSheet();
            for (var i = 0; i < obj.styles.length; i++) {
                var style = obj.styles[i];
                _insertCssRule(style.key, style.value, styleSheet);
            }
        }
    }

    /**
     * Add 'message' event listener, every response from the app will come in here!
     */
    function _addEventListener() {
        window.addEventListener("message", function (obj) {
            if (obj.data) {
                if (obj.data.command && obj.data.command === 'addStyles') {
                    _addCssStyles(obj.data);
                } else if (obj.data.uniq) {
                    if (_awaitingForCallback.hasOwnProperty(obj.data.uniq)) {
                        _awaitingForCallback[obj.data.uniq].apply(null, [obj.data.args]);
                    }
                }
            }
        }, false);
    }

    /**
     * @private
     * Will generate a new GUID.
     * @return {String} The generated GUID.
     */
    function _generateGuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * @private
     * Will replace the core.js execute method and will create a bridge between the JavaScript client running inside the IFrame and the Mobile Client.
     * @param  {String}   type     The name of the method that should be executed.
     * @param  {Object}   args     data send to Mobile Client, object needs to be "clone-able"
     * @param  {Function} callback The method that should be invoked once the method has been executed.
     * @param  {Boolean}  isError  are we logging an error?
     */
    function _execute(type, args, callback, isError) {
        _postMessage(type, args, callback);
    }

    /**
     * @private
     * Will post a message to the Mobile Client so we can access resources from the mobile client.
     * @param  {String}   type     The name of the method that should be invoken on the mobile client.
     * @param  {Object}   args     A collection of arguments that should be send to the Mobile Client along with the message; These arguments need to be "cloneable"
     * @param  {Function} callback The callback method that should be invoked once a response has been received on the message.
     */
    function _postMessage(type, args, callback) {
        var uniq = _generateGuid();

        if (typeof callback === 'function') {
            _awaitingForCallback[uniq] = callback;
        }

        var obj = {
            key: type,
            args: args
        };

        if (callback) {
            obj.uniq = uniq;
        }

        window.parent.postMessage(obj, '*');
    }

    /**
     * @private
     * Will initialize the Mobile Client extensions to core.js.
     */
    function _init() {
        _addEventListener();

        //Register execute
        App.Core.registerMethodReplacement('execute', _execute);
    }

    _init();
})(window);

window.App.trigger('ready');window.App.IsDevelopment = true;