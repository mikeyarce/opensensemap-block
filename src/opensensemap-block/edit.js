/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	TextControl,
	ToggleControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { SensorDisplay } from './components/SensorDisplay';
import { useSensorData } from './hooks/useSensorData';

/**
 * Edit component for the opensensemap block
 *
 * @param {Object}   props               - Props for the component.
 * @param {Object}   props.attributes    - The block attributes.
 * @param {Function} props.setAttributes - Function to update block attributes.
 * @return {JSX.Element} The edit component
 */
export default function Edit( { attributes, setAttributes } ) {
	const { sensorBoxId, displayName, displayLocation, displayTimestamp } = attributes;
	const blockProps = useBlockProps();

	// Use our custom hook to fetch and manage sensor data
	const { data: sensorDataState, isLoading, error } = useSensorData( sensorBoxId );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Sensor Settings', 'opensensemap-block' ) }>
					<TextControl
						label={ __( 'Sensor Box ID', 'opensensemap-block' ) }
						value={ sensorBoxId }
						onChange={ ( value ) => setAttributes( { sensorBoxId: value } ) }
						help={ __( 'Enter the OpenSenseMap Box ID', 'opensensemap-block' ) }
					/>
				</PanelBody>
				<PanelBody title={ __( 'Display Options', 'opensensemap-block' ) } initialOpen={ true }>
					<ToggleControl
						label={ __( 'Display Sensor Names', 'opensensemap-block' ) }
						checked={ displayName }
						onChange={ ( value ) => setAttributes( { displayName: value } ) }
						help={ __( 'Show or hide the names of each sensor', 'opensensemap-block' ) }
					/>
					<ToggleControl
						label={ __( 'Display Location', 'opensensemap-block' ) }
						checked={ displayLocation }
						onChange={ ( value ) => setAttributes( { displayLocation: value } ) }
						help={ __( 'Show or hide the location name', 'opensensemap-block' ) }
					/>
					<ToggleControl
						label={ __( 'Display Timestamp', 'opensensemap-block' ) }
						checked={ displayTimestamp }
						onChange={ ( value ) => setAttributes( { displayTimestamp: value } ) }
						help={ __( 'Show or hide the last update time', 'opensensemap-block' ) }
					/>
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				<SensorDisplay
					data={ sensorDataState }
					displayName={ displayName }
					displayLocation={ displayLocation }
					displayTimestamp={ displayTimestamp }
					isLoading={ isLoading }
					error={ error }
				/>
			</div>
		</>
	);
}
