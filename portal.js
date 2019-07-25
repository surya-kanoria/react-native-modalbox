import { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

export default class Portal extends Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
  };

  state = {
    el: null,
    target: null,
  };

  componentDidMount() {
    const el = document.createElement('div');
    el.setAttribute("style", "position: fixed;top: 0;left: 0;bottom: 0;right: 0;z-index: 100;");
    this.setState(
      { el, target: document.body },
      () => {
        this.state.target.appendChild(this.state.el);
      }
    );
  }

  componentWillUnmount() {
    this.state.target.removeChild(this.state.el);
  }

  render() {
    const { children } = this.props;

    if (this.state.el) {
      return ReactDOM.createPortal(children, this.state.el);
    }

    return null;
  }
}
