'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import ReactNative, { requireNativeComponent, View, Platform } from 'react-native';

var {
    // addons: { PureRenderMixin },
    NativeModules: { UIManager, CrosswalkWebViewManager: { JSNavigationScheme } }
} = ReactNative;

var resolveAssetSource = require('react-native/Libraries/Image/resolveAssetSource');

var WEBVIEW_REF = 'crosswalkWebView';

class CrosswalkWebView extends React.PureComponent {

    // statics = { JSNavigationScheme }

    state = {
      webviewLoaded: false
    }

    render () {
        var source = this.props.source || {};
        // console.log('loading: ' + source.uri);
        if (this.props.url) {
            source.uri = this.props.url;
        }
        var nativeProps = Object.assign({}, this.props, {
            messagingEnabled: typeof this.props.onMessage === 'function',
            onCrosswalkWebViewNavigationStateChange: this.onNavigationStateChange,
            onCrosswalkWebViewError: this.onError,
            onCrosswalkWebViewProgress: this.onProgress
        });
        var resolvedSource = resolveAssetSource(source);
        // console.log('creating with props: ', nativeProps);
        // console.log('creating with props: ' + JSON.stringify(nativeProps));
        return (
            <NativeCrosswalkWebView
                { ...nativeProps }
                ref={ WEBVIEW_REF }
                source={ resolvedSource }
            />
        );
    }

    getWebViewHandle = () => {
        return ReactNative.findNodeHandle(this.refs[WEBVIEW_REF]);
    }

    onNavigationStateChange = (event) => {
        var { onNavigationStateChange } = this.props;
        if (onNavigationStateChange) {
            onNavigationStateChange(event.nativeEvent);
        }
    }

    onError = (event) => {
        var { onError } = this.props;
        if (onError) {
            onError(event.nativeEvent);
        }
    }

    onProgress = (event) => {
        var { onProgress, onLoad } = this.props;
        if (onProgress) {
            onProgress(event.nativeEvent.progress / 100);
        }
        if (onLoad && event.nativeEvent.progress === 100 && !this.state.webviewLoaded) {
          this.setState({webviewLoaded: true});
          onLoad();
        }
    }

    goBack = () => {
        UIManager.dispatchViewManagerCommand(
            this.getWebViewHandle(),
            UIManager.CrosswalkWebView.Commands.goBack,
            null
        );
    }

    goForward = () => {
        UIManager.dispatchViewManagerCommand(
            this.getWebViewHandle(),
            UIManager.CrosswalkWebView.Commands.goForward,
            null
        );
    }

    reload = () => {
        UIManager.dispatchViewManagerCommand(
            this.getWebViewHandle(),
            UIManager.CrosswalkWebView.Commands.reload,
            null
        );
    }

    postMessage = (data) => {
        UIManager.dispatchViewManagerCommand(
            this.getWebViewHandle(),
            UIManager.CrosswalkWebView.Commands.postMessage,
            [String(data)]
        );
    }

    onMessage = (event) => {
        // console.log('CWV got message: ' + event);
        var {onMessage} = this.props;
        onMessage && onMessage(event);
    }
}

CrosswalkWebView.propTypes = {
    injectedJavaScript:      PropTypes.string,
    localhost:               PropTypes.bool.isRequired,
    onError:                 PropTypes.func,
    onMessage:               PropTypes.func,
    onNavigationStateChange: PropTypes.func,
    onProgress:              PropTypes.func,
    source:                  PropTypes.oneOfType([
        PropTypes.shape({
            uri: PropTypes.string,  // URI to load in WebView
        }),
        PropTypes.shape({
            html: PropTypes.string, // static HTML to load in WebView
        }),
        PropTypes.number,           // used internally by React packager
    ]),
    url:                     PropTypes.string,
    ...View.propTypes
};

CrosswalkWebView.defaultProps = {
  localhost: false
};

var NativeCrosswalkWebView = requireNativeComponent('CrosswalkWebView', CrosswalkWebView, {
    nativeOnly: {
        messagingEnabled: PropTypes.bool,
    },
});

export default CrosswalkWebView;
