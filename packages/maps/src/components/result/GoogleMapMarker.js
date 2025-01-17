/** @jsx jsx */
import { jsx } from '@emotion/core';
import React from 'react';

import types from '@appbaseio/reactivecore/lib/utils/types';
import { connect, ReactReduxContext } from '@appbaseio/reactivesearch/lib/utils';

import { InfoWindow, Marker } from '@react-google-maps/api';
import MarkerWithLabel from './addons/components/MarkerWithLabel';
import { MapPin, MapPinArrow, mapPinWrapper } from './addons/styles/MapPin';

class GoogleMapMarker extends React.Component {
	static contextType = ReactReduxContext;

	shouldComponentUpdate(nextProps) {
		if (
			nextProps.markerOnTop === this.props.marker._id
			|| (this.props.marker._id === this.props.markerOnTop && nextProps.markerOnTop === null)
		) {
			return true;
		}

		if (
			this.props.openMarkers[this.props.marker._id]
			!== nextProps.openMarkers[this.props.marker._id]
		) {
			return true;
		}

		return false;
	}

	triggerAnalytics = () => {
		// click analytics would only work client side and after javascript loads
		const { triggerClickAnalytics, marker, index } = this.props;

		triggerClickAnalytics(index, marker._id);
	};

	openMarker = () => {
		const {
			setOpenMarkers: handleOpenMarkers,
			openMarkers,
			marker,
			autoClosePopover,
			handlePreserveCenter,
		} = this.props;
		const id = marker._id;
		const newOpenMarkers = autoClosePopover ? { [id]: true } : { ...openMarkers, [id]: true };

		handleOpenMarkers(newOpenMarkers);
		handlePreserveCenter(true);
		this.triggerAnalytics();
	};

	closeMarker = () => {
		const {
			setOpenMarkers: handleOpenMarkers,
			marker,
			autoClosePopover,
			handlePreserveCenter,
			openMarkers,
		} = this.props;
		const id = marker._id;

		const { [id]: del, ...activeMarkers } = openMarkers;
		const newOpenMarkers = autoClosePopover ? {} : activeMarkers;

		handleOpenMarkers(newOpenMarkers);
		handlePreserveCenter(true);
	};

	renderPopover = (item, includeExternalSettings = false) => {
		let additionalProps = {};
		const { getPosition, onPopoverClick, openMarkers } = this.props;
		if (includeExternalSettings) {
			// to render pop-over correctly with MarkerWithLabel
			additionalProps = {
				position: getPosition(item),
				defaultOptions: {
					pixelOffset: new window.google.maps.Size(0, -30),
				},
			};
		}

		if (item._id in openMarkers) {
			return (
				<InfoWindow
					zIndex={500}
					key={`${item._id}-InfoWindow`}
					onCloseClick={() => this.closeMarker()}
					{...additionalProps}
				>
					<div>{onPopoverClick(item)}</div>
				</InfoWindow>
			);
		}
		return null;
	};

	increaseMarkerZIndex = () => {
		const { setMarkerOnTop: handleTopMarker, handlePreserveCenter, marker } = this.props;
		handleTopMarker(marker._id);
		handlePreserveCenter(true);
	};

	removeMarkerZIndex = () => {
		const { setMarkerOnTop: handleTopMarker, handlePreserveCenter } = this.props;
		handleTopMarker(null);
		handlePreserveCenter(true);
	};

	render() {
		const {
			getPosition,
			renderItem,
			defaultPin,
			onPopoverClick,
			marker,
			markerOnTop,
			clusterer,
		} = this.props;
		const markerProps = {
			position: getPosition(marker),
		};

		if (markerOnTop === marker._id) {
			markerProps.zIndex = window.google.maps.Marker.MAX_ZINDEX + 1;
		}
		if (renderItem) {
			const data = renderItem(marker);

			if ('label' in data) {
				return (
					<MarkerWithLabel
						key={marker._id}
						labelAnchor={new window.google.maps.Point(0, 0)}
						icon="https://i.imgur.com/h81muef.png" // blank png to remove the icon
						onClick={this.openMarker}
						onMouseOver={this.increaseMarkerZIndex}
						onFocus={this.increaseMarkerZIndex}
						onMouseOut={this.removeMarkerZIndex}
						onBlur={this.removeMarkerZIndex}
						{...markerProps}
						clusterer={clusterer}
					>
						<div css={mapPinWrapper}>
							<MapPin>{data.label}</MapPin>
							<MapPinArrow />
							{onPopoverClick ? this.renderPopover(marker, true) : null}
						</div>
					</MarkerWithLabel>
				);
			} else if ('icon' in data) {
				markerProps.icon = data.icon;
			} else {
				return (
					<MarkerWithLabel
						key={marker._id}
						labelAnchor={new window.google.maps.Point(0, 0)}
						icon="https://i.imgur.com/h81muef.png" // blank png to remove the icon
						onClick={this.openMarker}
						onMouseOver={this.increaseMarkerZIndex}
						onFocus={this.increaseMarkerZIndex}
						onMouseOut={this.removeMarkerZIndex}
						onBlur={this.removeMarkerZIndex}
						{...markerProps}
						clusterer={clusterer}
					>
						<div css={mapPinWrapper}>
							{data.custom}
							{onPopoverClick ? this.renderPopover(marker, true) : null}
						</div>
					</MarkerWithLabel>
				);
			}
		} else if (defaultPin) {
			markerProps.icon = defaultPin;
		}

		return (
			<Marker
				key={marker._id}
				onClick={() => this.openMarker()}
				onMouseOver={this.increaseMarkerZIndex}
				onFocus={this.increaseMarkerZIndex}
				onMouseOut={this.removeMarkerZIndex}
				onBlur={this.removeMarkerZIndex}
				{...markerProps}
				clusterer={clusterer}
			>
				{onPopoverClick ? this.renderPopover(marker) : null}
			</Marker>
		);
	}
}

const mapStateToProps = state => ({
	config: state.config,
	headers: state.appbaseRef.headers,
	analytics: state.analytics,
});

GoogleMapMarker.propTypes = {
	getPosition: types.func,
	renderItem: types.func,
	defaultPin: types.string,
	autoClosePopover: types.bool,
	handlePreserveCenter: types.func,
	onPopoverClick: types.func,
	markerProps: types.props,
	marker: types.props,
	openMarkers: types.props,
	openMarkerInfo: types.func,
	closeMarkerInfo: types.func,
	setMarkerOnTop: types.func,
	markerOnTop: types.string,
	setOpenMarkers: types.func,
	index: types.number,
	config: types.props,
	analytics: types.props,
	headers: types.headers,
};

export default connect(mapStateToProps, null)(GoogleMapMarker);
