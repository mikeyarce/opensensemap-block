/**
 * Frontend JavaScript for OpenSenseMap Block
 */

/**
 * WordPress dependencies
 */
import { createRoot } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { SensorDisplay } from './components/SensorDisplay';
import { useSensorData } from './hooks/useSensorData';

document.addEventListener( 'DOMContentLoaded', () => {
	const sensorBlocks = document.querySelectorAll( '.wp-block-opensensemap-block-sensor-display' );

	sensorBlocks.forEach( ( block ) => {
		if ( ! ( block instanceof HTMLElement ) ) {
			return;
		}
		const element = block;

		const boxId = element.getAttribute( 'data-sensor-box-id' );
		const displayName = element.getAttribute( 'data-display-name' ) === 'true';
		const displayLocation = element.getAttribute( 'data-display-location' ) === 'true';
		const displayTimestamp = element.getAttribute( 'data-display-timestamp' ) === 'true';

		if ( ! boxId ) {
			renderError( element, 'No sensor box ID provided' );
			return;
		}

		initializeSensorBlock( element, boxId, displayName, displayLocation, displayTimestamp );
	} );

	/**
	 * Initialize a sensor block with React
	 *
	 * @param {HTMLElement} block            - The block element to update
	 * @param {string}      boxId            - The sensor box ID to fetch data for
	 * @param {boolean}     displayName      - Whether to display the sensor box name
	 * @param {boolean}     displayLocation  - Whether to display the sensor location
	 * @param {boolean}     displayTimestamp - Whether to display timestamps
	 * @return {void}
	 */
	function initializeSensorBlock( block, boxId, displayName, displayLocation, displayTimestamp ) {
		// Create a React component to use our hook and render the display
		const SensorBlockComponent = () => {
			// Use our custom hook to fetch and manage sensor data
			const { data, isLoading, error } = useSensorData( boxId );

			return (
				<SensorDisplay
					data={ data }
					displayName={ displayName }
					displayLocation={ displayLocation }
					displayTimestamp={ displayTimestamp }
					isLoading={ isLoading }
					error={ error }
				/>
			);
		};

		// Create a root for React to render into
		const root = createRoot( block );

		// Render our component
		root.render( <SensorBlockComponent /> );
	}

	// Note: We're now using the useSensorData hook instead of this function
	// The API settings are configured in the utils/api.js file

	/**
	 * Render an error message in the block
	 *
	 * @param {HTMLElement} block   - The block element to update
	 * @param {string}      message - The error message to display
	 * @return {void}
	 */
	function renderError( block, message ) {
		block.innerHTML = '';

		const errorEl = document.createElement( 'div' );
		errorEl.className = 'components-notice is-error';
		errorEl.textContent = `Error: ${ message }`;

		block.appendChild( errorEl );
	}
} );
