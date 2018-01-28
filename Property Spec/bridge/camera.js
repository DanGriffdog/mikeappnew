; (function (window, undefined) {

    if (window.App === void 0) {
        throw new Error('/bridge/core.js must be included before you can use camera.js');
    }

    var App = window.App || {};

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
    };


    function _takePicture(allowCropping, callback) {

        if (!callback) {
            throw new Error('You need to provide a valid callback');
        }

        App.execute('app/camera/takePicture', { 'allowCrop': allowCropping }, callback);
    };

    function _storePicture(image, callback) {
        if (typeof image !== 'string') {
            throw new Error('specified image should be a valid base64 string.');
        }

        if (typeof callback !== 'function') {
            throw new Error('specified callback should be a valid function.');
        }

        var identifier = _generateGuid();
        App.Camera._tempImages[identifier] = image;

        App.execute('app/camera/storePicture', { 'image': identifier }, callback);
    };

    /**
     * The Camera module can be used to access the device camera.
     */
    var Camera = App.Camera = App.Modules.Camera = {

        /**
         * The current version of the Camera module.
         * @type {String}
         */
        VERSION: '2.0.3',

        /**
         * @public
         * Prompt the user to take a picture, and once complete the image will be returned using the callback as a base64 image.
         * @param  {Boolean}  Is cropping of the image allowed?
         * @param  {Function} The callback that should be invoked once the take image operation completes.
         * @throws {Error} If no valid callback has been specified.
         */
        takePicture: function (allowCropping, callback) {
            _takePicture(allowCropping, callback);
        },

        /**
         * @public
         * @since 2.0.3
         * Store base64 image to the device's camera roll or image library. 
         * @param  {String}  Is cropping of the image allowed?
         * @param  {Function} The callback that should be invoked once the image has been stored or an error occured.
         * @throws {Error} If the specified callback should be a valid function.
         * @throws {Error} If the specified image should be a valid base64 string.
         */
        storePicture: function (image, callback) {
            _storePicture(image, callback);
        }
    };

    App.Camera._tempImages = {};

    App.Extend(Camera, App.Events);

})(window);