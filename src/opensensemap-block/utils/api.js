/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * API utilities for OpenSenseMap Block
 */

/**
 * Fetch sensor data from OpenSenseMap API
 * Works in both editor (via apiFetch) and frontend (via fetch with nonce)
 *
 * @param {string} sensorBoxId The sensor box ID to fetch data for
 * @return {Promise<Object>} Promise resolving to sensor data
 */
export const fetchSensorData = ( sensorBoxId ) => {
	if ( ! sensorBoxId ) {
		return Promise.reject( new Error( 'No sensor box ID provided' ) );
	}

	const isFrontend = typeof window !== 'undefined' &&
		// @ts-ignore
		typeof window.opensensemapBlockApiSettings !== 'undefined';

	if ( isFrontend ) {
		// @ts-ignore
		const apiSettings = window.opensensemapBlockApiSettings || { root: '', nonce: '' };

		const apiUrl = apiSettings.root
			? `${ apiSettings.root }opensensemap-block/v1/opensensemap/${ sensorBoxId }`
			: `https://api.opensensemap.org/boxes/${ sensorBoxId }`;

		const headers = {
			'Content-Type': 'application/json',
			...( apiSettings.nonce && { 'X-WP-Nonce': apiSettings.nonce } ),
		};

		return fetch( apiUrl, { headers } )
			.then( ( response ) => {
				if ( ! response.ok ) {
					throw new Error( 'Network response was not ok' );
				}
				return response.json();
			} );
	}

	return apiFetch( {
		path: `/opensensemap-block/v1/opensensemap/${ sensorBoxId }`,
		method: 'GET',
	} );
};
