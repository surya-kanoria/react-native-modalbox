import React from 'react';
import Portal from './portal';
import {
    View,
    StyleSheet,
    PanResponder,
    Animated,
    TouchableWithoutFeedback,
    Dimensions,
    Easing,
    Platform
} from 'react-native';

const styles = StyleSheet.create({

    wrapper: {
        backgroundColor: "white"
    },

    transparent: {
        backgroundColor: 'rgba(0,0,0,0)'
    },

    absolute: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
    }

});

export default class ModalBox extends React.Component{
    constructor(props) {
        super(props);
        this.contentScreen = Dimensions.get('window');
        const position = this.props.inplace ? 0 : this.props.entry === 'top' ? -this.contentScreen.height : this.contentScreen.height;
        this.state = {
            position: new Animated.Value(position),
            backdropOpacity: new Animated.Value(0),
            isOpen: false,
            isAnimateClose: false,
            isAnimateOpen: false,
            swipeToClose: false,
            height: this.contentScreen.height,
            width: this.contentScreen.width,
            containerHeight: this.contentScreen.height,
            containerWidth: this.contentScreen.width,
            isInitialized: false
        };
    }

    componentWillMount() {
        this.createPanResponder();
        this.handleOpenning(this.props);
    }

    componentWillReceiveProps(nextProps) {
        // Since handleOpenning only checks for isOpen, so we should have a check here for the prop change.
        if(nextProps.isOpen !== this.props.isOpen) {
            this.handleOpenning(nextProps);
        }
    }

    handleOpenning = (props) => {
        if (typeof props.isOpen == "undefined") return;
        if (props.isOpen)
            this.open();
        else
            this.close();
    }

    /****************** ANIMATIONS **********************/

    /*
     * Open animation for the backdrop, will fade in
     */
    animateBackdropOpen = () => {
        if (this.state.isAnimateBackdrop) {
            this.state.animBackdrop.stop();
            this.state.isAnimateBackdrop = false;
        }

        this.state.isAnimateBackdrop = true;
        this.state.animBackdrop = Animated.timing(
            this.state.backdropOpacity,
            {
                toValue: 1,
                duration: this.props.animationDuration
            }
        );
        this.state.animBackdrop.start(() => {
            this.state.isAnimateBackdrop = false;
        });
    }

    /*
     * Close animation for the backdrop, will fade out
     */
    animateBackdropClose = () => {
        if (this.state.isAnimateBackdrop) {
            this.state.animBackdrop.stop();
            this.state.isAnimateBackdrop = false;
        }

        this.state.isAnimateBackdrop = true;
        this.state.animBackdrop = Animated.timing(
            this.state.backdropOpacity,
            {
                toValue: 0,
                duration: this.props.animationDuration
            }
        );
        this.state.animBackdrop.start(() => {
            this.state.isAnimateBackdrop = false;
        });
    }

    /*
     * Stop opening animation
     */
    stopAnimateOpen = () => {
        if (this.state.isAnimateOpen) {
            if (this.state.animOpen) this.state.animOpen.stop();
            this.state.isAnimateOpen = false;
        }
    }

    /*
     * Open animation for the modal, will move up
     */
    animateOpen = () => {
        this.stopAnimateClose();

        // Backdrop fadeIn
        if (this.props.backdrop)
            this.animateBackdropOpen();

        // Detecting modal position
        this.state.positionDest = this.calculateModalPosition(this.state.containerHeight, this.state.containerWidth);

        this.state.isAnimateOpen = true;
        this.state.animOpen = Animated.timing(
            this.state.position,
            {
                toValue: this.state.positionDest,
                duration: this.props.animationDuration,
                easing: Easing.bezier(0.4, 0, 0.2, 1)
            }
        );
        this.state.animOpen.start(() => {
            this.state.isAnimateOpen = false;
            this.state.isOpen = true;
            if (this.props.onOpened) this.props.onOpened();
        });
    }

    /*
     * Stop closing animation
     */
    stopAnimateClose = () => {
        if (this.state.isAnimateClose) {
            if (this.state.animClose) this.state.animClose.stop();
            this.state.isAnimateClose = false;
        }
    }

    /*
     * Close animation for the modal, will move down
     */
    animateClose = () => {
        this.stopAnimateOpen();

        // Backdrop fadeout
        if (this.props.backdrop)
            this.animateBackdropClose();

        this.state.isAnimateClose = true;
        this.state.animClose = Animated.timing(
            this.state.position,
            {
                toValue: this.props.inplace ? 0 : this.props.entry === 'top' ? -(this.state.containerHeight + this.contentScreen.height) : (this.state.containerHeight + this.contentScreen.height),
                duration: this.props.animationDuration,
                easing: Easing.bezier(0.4, 0, 0.2, 1)
            }
        );
        this.state.animClose.start(() => {
            this.state.isAnimateClose = false;
            this.state.isOpen = false;
            this.setState({});
            if (this.props.onClosed) this.props.onClosed();
        });
    }

    /*
     * Calculate when should be placed the modal
     */
    calculateModalPosition = (containerHeight, containerWidth) => {
        var position = 0;
        if (this.props.position == 'bottom') {
            if(this.props.resizeToFullscreen) {
                position = containerHeight - this.state.height;
            } else {
                if (containerHeight != this.state.height) {
                    position = containerHeight - this.state.height;
                } else {
                    position = containerHeight;
                }
            }
        } else if (this.props.position == 'center') {
            position = containerHeight / 2 - this.state.height / 2;
        }
        // Checking if the position >= 0
        if (position < 0) position = 0;
        return position;
    }

    /*
     * Create the pan responder to detect gesture
     * Only used if swipeToClose is enabled
     */
    createPanResponder = () => {
        var closingState = false;
        var inSwipeArea = false;

        var onPanRelease = (evt, state) => {
            if (!inSwipeArea) return;
            inSwipeArea = false;
            if (this.props.entry === 'top' ? -state.dy > this.props.swipeThreshold : state.dy > this.props.swipeThreshold)
                this.animateClose();
            else
                this.animateOpen();
        };

        var animEvt = Animated.event([null, { customY: this.state.position }]);

        var onPanMove = (evt, state) => {
            var newClosingState = this.props.entry === 'top' ? -state.dy > this.props.swipeThreshold : state.dy > this.props.swipeThreshold;
            if (this.props.entry === 'top' ? state.dy > 0 : state.dy < 0) return;
            if (newClosingState != closingState && this.props.onClosingState)
                this.props.onClosingState(newClosingState);
            closingState = newClosingState;
            state.customY = state.dy + this.state.positionDest;

            animEvt(evt, state);
        };

        var onPanStart = (evt, state) => {
            if (!this.props.swipeToClose || Platform.OS === 'web' || this.props.isDisabled || (this.props.swipeArea && (evt.nativeEvent.pageY - this.state.positionDest) > this.props.swipeArea)) {
                inSwipeArea = false;
                return false;
            }
            inSwipeArea = true;
            return true;
        };

        this.state.pan = PanResponder.create({
            onStartShouldSetPanResponder: onPanStart,
            onPanResponderMove: onPanMove,
            onPanResponderRelease: onPanRelease,
            onPanResponderTerminate: onPanRelease,
        });
    }

    /*
     * Event called when the modal view layout is calculated
     */
    onViewLayout = (evt) => {
        this.state.height = evt.nativeEvent.layout.height;
        this.state.width = evt.nativeEvent.layout.width;

        if (this.onViewLayoutCalculated) this.onViewLayoutCalculated();
    }

    /*
     * Event called when the container view layout is calculated
     */
    onContainerLayout = (evt) => {
        var height = evt.nativeEvent.layout.height;
        var width = evt.nativeEvent.layout.width;

        // If the container size is still the same we're done
        if (height == this.state.containerHeight && width == this.state.containerWidth) {
            this.state.isInitialized = true;
            return;
        }

        var modalPosition = this.calculateModalPosition(height, width);
        var coords = {};

        // Fixing the position if the modal was already open or an animation was in progress
        if (this.state.isInitialized && (this.state.isOpen || this.state.isAnimateOpen || this.state.isAnimateClose)) {
            var position = this.state.isOpen ? modalPosition : this.state.containerHeight;

            // Checking if a animation was in progress
            if (this.state.isAnimateOpen) {
                position = modalPosition;
                this.stopAnimateOpen();
            } else if (this.state.isAnimateClose) {
                position = this.state.containerHeight;
                this.stopAnimateClose();
            }
            this.state.position.setValue(position);
            coords = { positionDest: position };
        }

        this.setState({
            isInitialized: true,
            containerHeight: height,
            containerWidth: width,
            ...coords
        });
    }

    /*
     * Render the backdrop element
     */
    renderBackdrop = (size) => {
        return (
            <TouchableWithoutFeedback onPress={this.props.backdropPressToClose ? () => { this.close() } : null}>
                <Animated.View style={[styles.absolute, size, { opacity: this.state.backdropOpacity }]}>
                    <View style={[styles.absolute, { backgroundColor: this.props.backdropColor, opacity: this.props.backdropOpacity }]} />
                    {this.props.backdropContent || []}
                </Animated.View>
            </TouchableWithoutFeedback>
        );
    }

    /*
     * Render the component
     */
    render() {
        var visible = this.state.isOpen || this.state.isAnimateOpen || this.state.isAnimateClose;
        var size = { height: this.state.containerHeight, width: this.state.containerWidth };
        var offsetX = this.props.inplace ? 0 : (this.state.containerWidth - this.state.width) / 2;
        var backdrop = this.renderBackdrop(size);

        if (!visible) {
            return <View />
        }
        const content = <View style={[styles.transparent, styles.absolute]} pointerEvents={'box-none'} onLayout={this.onContainerLayout}>
            {backdrop}
            <Animated.View
                onLayout={this.onViewLayout}
                style={[styles.wrapper, size, this.props.style, { transform: [{ translateY: this.state.position }, { translateX: offsetX }] }, Platform.OS === 'web' ? { willChange: 'transform' } : {}]}
                {...this.state.pan.panHandlers}>
                {this.props.children}
            </Animated.View>
        </View>;
        const modalBox = this.props.showFullscreen ? <Portal>{content}</Portal> : content;
        return modalBox;
    }

    /****************** PUBLIC METHODS **********************/

    open = () => {
        if (this.props.isDisabled) return;
        if (!this.state.isAnimateOpen && (!this.state.isOpen || this.state.isAnimateClose)) {
            this.onViewLayoutCalculated = () => {
                this.setState({});
                this.animateOpen();
            };
            this.setState({ isAnimateOpen: true });
            if (window && window.history && window.history.pushState) {
                // Since we can have multiple instances of modalBox then all instances will listen to popstate.
                // So all the instance will close with a single back.
                // To make it work we will pass the id (default id is 'MODAL_BOX') to each instance and we will use that id to decide which instance to close.
                window.currState = {id: this.props.id};
                window.history.pushState(window.currState, document.title, window.location.href);
                // added a registry in batman that will subscribe to popstate once and we will subscribe to registry to avoid multiple onpopstate subscriptions.
                if (window.HistoryPopStateRegistry) {
                    window.HistoryPopStateRegistry.subscribe({callback: this.popStateHandler, stopImmediatePropagation: this.props.stopImmediatePropagation});
                } else {
                    window.addEventListener('popstate', this.popStateHandler);
                }
            }
        }
    }

    popStateHandler = (event) => {
        if(window.currState && window.currState.id === this.props.id && this.state.isOpen) {
            window.currState = event.state;
            this.closeModal();
            if (window.HistoryPopStateRegistry) {
                window.HistoryPopStateRegistry.unsubscribe({callback: this.popStateHandler});
            } else {
                window.removeEventListener('popstate', this.popStateHandler);
            }
        }
    }

    closeModal = () => {
        if (this.props.isDisabled) return;
        if (!this.state.isAnimateClose && (this.state.isOpen || this.state.isAnimateOpen)) {
            delete this.onViewLayoutCalculated;
            this.animateClose();
        }
    }

    close = () => {
        if (this.props.isDisabled) return;
        if (!this.state.isAnimateClose && (this.state.isOpen || this.state.isAnimateOpen) && window && window.history) {
            window.history.back();
        }
    }
};

ModalBox.defaultProps = {
    backdropPressToClose: true,
    swipeToClose: true,
    swipeThreshold: 50,
    position: "center",
    backdrop: true,
    backdropOpacity: 0.5,
    backdropColor: "black",
    backdropContent: null,
    animationDuration: 400,
    inplace: false,
    showFullscreen: false,
    resizeToFullscreen: false,
    id: 'MODAL_BOX',
    stopImmediatePropagation: false
}
