/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { fetchSensorData } from '../utils/api';

/**
 * Custom hook to fetch and manage sensor data
 *
 * @param {string} sensorBoxId The sensor box ID to fetch data for
 * @return {Object} Object containing data, loading state, and error
 */
export const useSensorData = ( sensorBoxId ) => {
	const [ data, setData ] = useState( null );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ error, setError ] = useState( null );

	useEffect( () => {
		if ( ! sensorBoxId ) {
			return;
		}

		setIsLoading( true );
		setError( null );

		fetchSensorData( sensorBoxId )
			.then( ( response ) => {
				setData( response );
				setIsLoading( false );
			} )
			.catch( ( err ) => {
				setError( err.message || 'Failed to fetch sensor data' );
				setIsLoading( false );
			} );
	}, [ sensorBoxId ] );

	return { data, isLoading, error };
};
