/**
 * Frontend JavaScript for OpenSenseMap Block
 *
 */

import icons from './icons.js';

const customWindow = window;

document.addEventListener('DOMContentLoaded', function () {
	const apiSettings = customWindow.opensensemapBlockApiSettings || {};

	if (! apiSettings.root || ! apiSettings.nonce) {
		return;
	}
	const sensorBlocks = document.querySelectorAll('.wp-block-opensensemap-block-opensensemap-block');

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
		block.innerHTML = '';
		const container = document.createElement('div');
		container.className = 'sensor-data-block';

		if (displayLocation && data.currentLocation) {
			const headerEl = document.createElement('div');
			headerEl.className = 'sensor-data-header';

			const locationEl = document.createElement('h3');
			locationEl.className = 'sensor-data-location';
			locationEl.textContent = data.currentLocation;
			headerEl.appendChild(locationEl);

			container.appendChild(headerEl);
		}

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

		if (displayName && name) {
			const titleEl = document.createElement('h4');
			titleEl.className = 'sensor-title';
			titleEl.textContent = name;
			sensorEl.appendChild(titleEl);
		}

		const valueEl = document.createElement('div');
		valueEl.className = 'sensor-value';

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
