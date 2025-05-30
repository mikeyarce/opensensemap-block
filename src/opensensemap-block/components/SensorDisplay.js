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
		className="opensensemap-block__sensor-icon"
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
		<div className="opensensemap-block__sensor-value">
			<SensorIcon icon={ iconSvg } iconName={ name } />
			<span className="opensensemap-block__sensor-value-number">
				{ lastMeasurement.value }
				<span className="opensensemap-block__sensor-value-unit">{ unit }</span>
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
			<div className="opensensemap-block opensensemap-block--error">
				<div className="opensensemap-block__error">
					{ error }
				</div>
			</div>
		);
	}

	if ( isLoading ) {
		return (
			<div className="opensensemap-block opensensemap-block--loading">
				<div className="opensensemap-block__loading">
					{ __( 'Loading sensor data…', 'opensensemap-block' ) }
				</div>
			</div>
		);
	}

	if ( ! data ) {
		return (
			<div className="opensensemap-block opensensemap-block--empty">
				<div className="opensensemap-block__empty-message">
					{ __( 'Enter a Sensor Box ID in the block settings', 'opensensemap-block' ) }
				</div>
			</div>
		);
	}

	return (
		<div className="opensensemap-block">
			{ displayLocation && data.currentLocation && (
				<header className="opensensemap-block__header">
					<h3 className="opensensemap-block__location">{ data.currentLocation }</h3>
				</header>
			) }
			<div className="opensensemap-block__grid">
				{ data.sensors && data.sensors.map( ( sensor ) => (
					<div key={ sensor.name } className="opensensemap-block__card">
						{ displayName && <h4 className="opensensemap-block__card-title">{ sensor.name }</h4> }
						<SensorValue sensor={ sensor } />
					</div>
				) ) }
			</div>
			{ displayTimestamp && data.lastMeasurementAt && (
				<footer className="opensensemap-block__footer">
					<time className="opensensemap-block__timestamp">
						{ __( 'Last updated:', 'opensensemap-block' ) } { new Date( data.lastMeasurementAt ).toLocaleString() }
					</time>
				</footer>
			) }
		</div>
	);
};
