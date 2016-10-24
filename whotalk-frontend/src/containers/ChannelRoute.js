import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {Channel} from 'components';
import * as ui from 'actions/ui';
import autobind from 'autobind-decorator';

class ChannelRoute extends Component {
    constructor(props) {
        super(props);
        this.state = {
            unmounting: false
        };
    }
    componentDidMount() {
        const {UIActions} = this.props;
        UIActions.setHeaderTransparency(false);
        UIActions.setFooterSpace(false);
        UIActions.setChannelBoxState('default');

        // disable overflow for 0.7 seconds
        document.body.style.overflow = "hidden";
        setTimeout(() => {
            document.body.style.overflow = ""
        }, 700);
    }

    @autobind
    handleCloseBox() {
        const {UIActions} = this.props;

        UIActions.setChannelBoxState('closing');
        setTimeout(() => {
            UIActions.setChannelBoxState('closed')
        }, 700);
    }

    @autobind
    handleEnterChannel() {
        this.handleCloseBox();
    }

    render() {
        const {params, pathname, status} = this.props;
        const {handleEnterChannel} = this;

        return (
            <div className="channel">
            
                {status.boxState !== 'closed'
                    ? (
                        <Channel.Box isClosing={status.boxState === 'closing'}>
                            <Channel.Circle/>
                            <Channel.Profile username={params.username} channelInfo={status.channelInfo}/>
                            <Channel.Info/>
                            <Channel.Buttons onEnter={handleEnterChannel}/>
                        </Channel.Box>
                    )
                    : undefined}

            </div>
        );
    }
}

ChannelRoute.contextTypes = {
    router: React.PropTypes.object
};

ChannelRoute = connect(state => ({
    status: {
        channelInfo: state.channel.info,
        boxState: state.ui.channel.box.state
    }
}), dispatch => ({
    UIActions: bindActionCreators({
        setHeaderTransparency: ui.setHeaderTransparency,
        setFooterSpace: ui.setFooterSpace,
        setChannelBoxState: ui.setChannelBoxState
    }, dispatch)
}))(ChannelRoute);

export default ChannelRoute;