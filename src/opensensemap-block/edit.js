/**
 * WordPress dependencies
 */
import React from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	TextControl,
	ToggleControl,
	Placeholder,
	Spinner,
	Notice,
} from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

// Import custom SVG icons
import icons from './icons';

/**
 * Edit component for the opensensemap block
 *
 * @param {Object} props - Component props
 * @return {Object} Block edit component
 */
export default function Edit({ attributes, setAttributes }) {
	const { sensorBoxId, displayName, displayLocation, displayTimestamp } = attributes;
	const blockProps = useBlockProps();

	const [sensorDataState, setSensorDataState] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);

	// Fetch sensor data when the sensorBoxId changes
	useEffect(() => {
		if (! sensorBoxId) {
			return;
		}

		setIsLoading(true);
		setError(null);

		// Using wp.apiFetch to make the external API request
		// This will be proxied through WordPress to avoid CORS issues
		apiFetch({
			path: `/opensensemap-block/v1/opensensemap/${sensorBoxId}`,
			method: 'GET',
		})
			.then((response) => {
				setSensorDataState(response);
				setIsLoading(false);
			})
			.catch(err => {
				setError(err.message || 'Failed to fetch sensor data');
				setIsLoading(false);
			});
	}, [sensorBoxId]);

	// Helper function to render sensor value with appropriate icon and formatting
	/**
	 * @param {Object} sensor
	 * @return {Object|null} Returns a JSX element representing the sensor value with icon, or null if no measurement is available
	 */
	const renderSensorValue = sensor => {
		const { unit, lastMeasurement, icon } = sensor;

		if (! lastMeasurement) {
			return null;
		}

		// Get the appropriate icon component or use a default
		let IconComponent;
		if (icon && typeof icons[icon] !== 'undefined') {
			IconComponent = icons[icon];
		} else {
			IconComponent = icons.chart;
		}

		return (
			<div className="sensor-value">
				<span className="sensor-icon">{IconComponent}</span>
				<span className="sensor-value-number">
					{lastMeasurement.value}
					<span className="sensor-value-unit">{unit}</span>
				</span>
			</div>
		);
	};

	/**
	 * Renders the main content of the block
	 *
	 * @return {Object} The rendered content
	 */
	const renderContent = () => {
		if (error) {
			return (
				<Notice status="error" isDismissible={false}>
					{error}
				</Notice>
			);
		}

		if (isLoading) {
			return (
				<Placeholder>
					<Spinner />
					{__('Loading sensor data…', 'opensensemap-block')}
				</Placeholder>
			);
		}

		if (! sensorDataState) {
			return (
				<Placeholder>
					{__('Enter a Sensor Box ID in the block settings', 'opensensemap-block')}
				</Placeholder>
			);
		}

		// Get data from state
		const data = sensorDataState;

		return (
			<div className="sensor-data-block">
				{displayLocation && data.currentLocation && (
					<div className="sensor-data-header">
						<h3 className="sensor-data-location">{data.currentLocation}</h3>
					</div>
				)}
				<div className="sensor-data-grid">
					{data.sensors && data.sensors.map(sensor => (
						<div key={sensor.name} className="sensor-card">
							{displayName && <h4 className="sensor-title">{sensor.name}</h4>}
							{renderSensorValue(sensor)}
						</div>
					))}
				</div>
				{displayTimestamp && data.lastMeasurementAt && (
					<div className="sensor-data-timestamp-container">
						<span className="sensor-data-timestamp">
							Last updated: {new Date(data.lastMeasurementAt).toLocaleString()}
						</span>
					</div>
				)}
			</div>
		);
	};

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Sensor Settings', 'opensensemap-block')}>
					<TextControl
						label={__('Sensor Box ID', 'opensensemap-block')}
						value={sensorBoxId}
						onChange={value => setAttributes({ sensorBoxId: value })}
						help={__('Enter the OpenSenseMap Box ID', 'opensensemap-block')}
					/>
				</PanelBody>
				<PanelBody title={__('Display Options', 'opensensemap-block')} initialOpen={true}>
					<ToggleControl
						label={__('Display Sensor Names', 'opensensemap-block')}
						checked={displayName}
						onChange={value => setAttributes({ displayName: value })}
						help={__('Show or hide the names of each sensor', 'opensensemap-block')}
					/>
					<ToggleControl
						label={__('Display Location', 'opensensemap-block')}
						checked={displayLocation}
						onChange={value => setAttributes({ displayLocation: value })}
						help={__('Show or hide the location name', 'opensensemap-block')}
					/>
					<ToggleControl
						label={__('Display Timestamp', 'opensensemap-block')}
						checked={displayTimestamp}
						onChange={value => setAttributes({ displayTimestamp: value })}
						help={__('Show or hide the last update time', 'opensensemap-block')}
					/>
				</PanelBody>
			</InspectorControls>

			<div {...blockProps}>{renderContent()}</div>
		</>
	);
}
