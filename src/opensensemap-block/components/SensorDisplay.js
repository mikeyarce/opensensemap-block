/**
 * Shared component for displaying sensor data
 * Used by both editor and frontend
 */
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import icons from '../icons';

/**
 * Component to display a sensor icon
 *
 * @param {Object} props          Component props
 * @param {string} props.icon     Icon SVG string or component
 * @param {string} props.iconName Name of the icon for accessibility
 * @return {JSX.Element} Icon component
 */
export const SensorIcon = ( { icon, iconName } ) => (
	<span
		className="sensor-icon"
		aria-label={ iconName || 'Sensor icon' }
		title={ iconName || 'Sensor icon' }
		dangerouslySetInnerHTML={ { __html: icon } }
	/>
);

/**
 * Map sensor name to icon key
 */
export const nameToIcon = {
	Temperature: 'thermometer',
	'Relative Humidity': 'humidity',
	'Air Pressure': 'chart',
	PM10: 'cloud',
	'PM2.5': 'cloud',
};

/**
 * Component to display a sensor value with its icon
 *
 * @param {Object} props        Component props
 * @param {Object} props.sensor Sensor data object
 * @return {JSX.Element|null} Sensor value component or null if no measurement
 */
export const SensorValue = ( { sensor } ) => {
	const { unit, lastMeasurement, name } = sensor;
	if ( ! lastMeasurement ) {
		return null;
	}

	const iconKey = nameToIcon[ name ] || 'chart';
	const iconSvg = icons[ iconKey ];

	return (
		<div className="sensor-value">
			<SensorIcon icon={ iconSvg } iconName={ name } />
			<span className="sensor-value-number">
				{ lastMeasurement.value }
				<span className="sensor-value-unit">{ unit }</span>
			</span>
		</div>
	);
};

/**
 * Main component for displaying sensor data
 *
 * @param {Object}      props                  Component props
 * @param {Object}      props.data             Sensor data
 * @param {boolean}     props.displayName      Whether to display sensor names
 * @param {boolean}     props.displayLocation  Whether to display location
 * @param {boolean}     props.displayTimestamp Whether to display timestamp
 * @param {boolean}     props.isLoading        Whether data is loading
 * @param {string|null} props.error            Error message if any
 * @return {JSX.Element} Sensor display component
 */
export const SensorDisplay = ( {
	data,
	displayName,
	displayLocation,
	displayTimestamp,
	isLoading,
	error,
} ) => {
	if ( error ) {
		return (
			<div className="components-notice is-error">
				{ error }
			</div>
		);
	}

	if ( isLoading ) {
		return (
			<div className="loading-placeholder">
				{ __( 'Loading sensor data…', 'opensensemap-block' ) }
			</div>
		);
	}

	if ( ! data ) {
		return (
			<div className="empty-placeholder">
				{ __( 'Enter a Sensor Box ID in the block settings', 'opensensemap-block' ) }
			</div>
		);
	}

	return (
		<div className="sensor-data-block">
			{ displayLocation && data.currentLocation && (
				<div className="sensor-data-header">
					<h3 className="sensor-data-location">{ data.currentLocation }</h3>
				</div>
			) }
			<div className="sensor-data-grid">
				{ data.sensors && data.sensors.map( ( sensor ) => (
					<div key={ sensor.name } className="sensor-card">
						{ displayName && <h4 className="sensor-title">{ sensor.name }</h4> }
						<SensorValue sensor={ sensor } />
					</div>
				) ) }
			</div>
			{ displayTimestamp && data.lastMeasurementAt && (
				<div className="sensor-data-timestamp-container">
					<span className="sensor-data-timestamp">
						Last updated: { new Date( data.lastMeasurementAt ).toLocaleString() }
					</span>
				</div>
			) }
		</div>
	);
};
