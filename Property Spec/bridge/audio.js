; (function (window, undefined) {

    if (window.App === void 0) {
        throw new Error('/bridge/core.js must be included before you can use audio.js');
    }

    var App = window.App || {};

    /**
     * @private
     * Play an audio stream using a direct stream URL.
     * @param  {String} url The streaming url
     * @throws {Error} If no valid url has been specified.
     */
    function _play(url) {

        if (!url) {
            throw new Error('You need to provide a valid playback url');
        }

        App.execute('app/audio/play', { 'url': url }, null);
    }

    /**
     * @private
     * Play a track using the audio playback of the device hosting this JavaScript block.
     * @param  {Object} track The track that should be played.
     * @throws {Error} If no valid track object has been specified.
     */
    function _playTrack(track) {

        if (!track) {
            throw new Error('You need to provide a valid track instance');
        }

        App.execute('app/audio/playTrack', track, null);
    }

    /**
     * @private
     * Will stop the current audio playback.
     */
    function _pause() {
        App.execute('app/audio/pause', null, null);
    }

    /**
     * @private
     * Will stop the current audio playback.
     */
    function _stop() {
        App.execute('app/audio/stop', null, null);
    }

    /**
     * The Audio module can be used to perform simple audio playback operations using the audio services provided by the platform.
     */
    var Audio = App.Audio = {

        /**
         * The current version of the Audio module.
         * @type {String}
         */
        VERSION: '2.0',

        /**
         * @public
         * Play an audio stream using a url.
         * @param  {String} url The url of the audio stream you would like to play.
         * @throws {Error} If no valid track object has been specified.
         */
        play: function (url) {
            _play(url);
        },

        /**
         * @public
         * Play an audio stream using an audio track object.
         * @param  {Object} track The track that should be played.
         * @throws {Error} If no valid track object has been specified.
         */
        playTrack: function (track) {
            _playTrack(track);
        },

        /**
         * @public
         * Will pause the current audio playback.
         */
        pause: function () {
            _pause();
        },

        /**
         * @public
         * Will stop the current audio playback.
         */
        stop: function () {
            _stop();
        }
    };

    App.Extend(Audio, App.Events);

})(window);