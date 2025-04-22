/**
 * Frontend JavaScript for OpenSenseMap Block
 *
 */

// Define Lucide-style SVG icons
const icons = {
	thermometer:
		'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-thermometer"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>',
	humidity:
		'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-droplets"><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/></svg>',
	cloud:
		'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cloud"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>',
	chart:
		'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-line-chart"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>',
};

const customWindow = window;

document.addEventListener('DOMContentLoaded', function () {
	// Get API settings from the data attribute
	const apiSettings = customWindow.opensensemapBlockApiSettings || {};

	// Check if API settings are available
	if (! apiSettings.root || ! apiSettings.nonce) {
		return;
	}

	// Find all sensor data blocks on the page
	const sensorBlocks = document.querySelectorAll('.wp-block-opensensemap-block-opensensemap-block');

	// Process each block
	sensorBlocks.forEach(block => {
		const element = block;

		const boxId = element.getAttribute('data-sensor-box-id');
		const displayName = element.getAttribute('data-display-name') === 'true';
		const displayLocation = element.getAttribute('data-display-location') === 'true';
		const displayTimestamp = element.getAttribute('data-display-timestamp') === 'true';

		if (! boxId) {
			renderError(element, 'No sensor box ID provided');
			return;
		}

		fetchSensorData(element, boxId, displayName, displayLocation, displayTimestamp);
	});

	/**
	 * Fetch sensor data from the WordPress REST API endpoint
	 *
	 * @param {HTMLElement} block            - The block element to update
	 * @param {string}      boxId            - The sensor box ID to fetch data for
	 * @param {boolean}     displayName      - Whether to display the sensor box name
	 * @param {boolean}     displayLocation  - Whether to display the sensor location
	 * @param {boolean}     displayTimestamp - Whether to display timestamps
	 * @return {void}
	 */
	function fetchSensorData(block, boxId, displayName, displayLocation, displayTimestamp) {
		const apiUrl = `${apiSettings.root}opensensemap-block/v1/opensensemap/${boxId}`;

		fetch(apiUrl, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'X-WP-Nonce': apiSettings.nonce,
			},
		})
			.then(response => {
				if (! response.ok) {
					throw new Error('Network response was not ok');
				}
				return response.json();
			})
			.then(data => {
				renderSensorData(block, data, displayName, displayLocation, displayTimestamp);
			})
			.catch(error => {
				renderError(block, error.message || 'Failed to fetch sensor data');
			});
	}

	/**
	 * Render sensor data in the block
	 *
	 * @param {HTMLElement} block            - The block element to update
	 * @param {Object}      data             - The sensor data to render
	 * @param {boolean}     displayName      - Whether to display the sensor box name
	 * @param {boolean}     displayLocation  - Whether to display the sensor location
	 * @param {boolean}     displayTimestamp - Whether to display timestamps
	 * @return {void}
	 */
	function renderSensorData(block, data, displayName, displayLocation, displayTimestamp) {
		// Clear loading message
		block.innerHTML = '';

		// Create container
		const container = document.createElement('div');
		container.className = 'sensor-data-block';

		// Add location if enabled
		if (displayLocation && data.currentLocation) {
			const headerEl = document.createElement('div');
			headerEl.className = 'sensor-data-header';

			const locationEl = document.createElement('h3');
			locationEl.className = 'sensor-data-location';
			locationEl.textContent = data.currentLocation;
			headerEl.appendChild(locationEl);

			container.appendChild(headerEl);
		}

		// Add sensor readings
		if (data.sensors && data.sensors.length > 0) {
			const gridEl = document.createElement('div');
			gridEl.className = 'sensor-data-grid';

			data.sensors.forEach(sensor => {
				const sensorEl = renderSensorItem(sensor, displayName);
				if (sensorEl) {
					gridEl.appendChild(sensorEl);
				}
			});

			container.appendChild(gridEl);
		}

		// Add timestamp if enabled
		if (displayTimestamp && data.lastMeasurementAt) {
			const timestampContainer = document.createElement('div');
			timestampContainer.className = 'sensor-data-timestamp-container';

			const timestampEl = document.createElement('span');
			timestampEl.className = 'sensor-data-timestamp';
			timestampEl.textContent = `Last updated: ${new Date(
				data.lastMeasurementAt
			).toLocaleString()}`;
			timestampContainer.appendChild(timestampEl);

			container.appendChild(timestampContainer);
		}

		block.appendChild(container);
	}

	/**
	 * Render a single sensor item
	 *
	 * @param {Object}  sensor      - The sensor data to render
	 * @param {boolean} displayName - Whether to display the sensor name
	 * @return {HTMLElement|null} The rendered sensor element or null if no measurement
	 */
	function renderSensorItem(sensor, displayName) {
		if (! sensor.lastMeasurement) {
			return null;
		}

		const { name, unit, lastMeasurement, icon } = sensor;

		const sensorEl = document.createElement('div');
		sensorEl.className = 'sensor-card';

		// Add sensor name if enabled
		if (displayName && name) {
			const titleEl = document.createElement('h4');
			titleEl.className = 'sensor-title';
			titleEl.textContent = name;
			sensorEl.appendChild(titleEl);
		}

		// Add sensor value with icon
		const valueEl = document.createElement('div');
		valueEl.className = 'sensor-value';

		// Determine icon based on sensor type or explicit icon
		let iconSvg;

		if (icon === 'thermometer' || name.toLowerCase().includes('temp')) {
			iconSvg = icons.thermometer;
		} else if (icon === 'humidity' || name.toLowerCase().includes('humid')) {
			iconSvg = icons.humidity;
		} else if (icon === 'cloud' || name.toLowerCase().includes('pm')) {
			iconSvg = icons.cloud;
		} else {
			iconSvg = icons.chart;
		}

		const iconEl = document.createElement('span');
		iconEl.className = 'sensor-icon';
		iconEl.innerHTML = iconSvg;
		valueEl.appendChild(iconEl);

		const valueNumberEl = document.createElement('span');
		valueNumberEl.className = 'sensor-value-number';
		valueNumberEl.textContent = lastMeasurement.value;

		const unitEl = document.createElement('span');
		unitEl.className = 'sensor-value-unit';
		unitEl.textContent = unit;
		valueNumberEl.appendChild(unitEl);

		valueEl.appendChild(valueNumberEl);
		sensorEl.appendChild(valueEl);

		return sensorEl;
	}

	/**
	 * Render an error message in the block
	 *
	 * @param {HTMLElement} block   - The block element to update
	 * @param {string}      message - The error message to display
	 * @return {void}
	 */
	function renderError(block, message) {
		block.innerHTML = '';

		const errorEl = document.createElement('div');
		errorEl.className = 'components-notice is-error';
		errorEl.textContent = `Error: ${message}`;

		block.appendChild(errorEl);
	}
});
