/**
 * WordPress dependencies
 */
import React from '@wordpress/element';
import { useBlockProps } from '@wordpress/block-editor';

/**
 * @typedef {Object} SaveProps
 * @property {Object} attributes - Block attributes
 */

/**
 * The save function defines the way in which the different attributes should
 * be combined into the final markup, which is then serialized by the block
 * editor into `post_content`.
 *
 * @param {SaveProps} props - Component props
 * @return {JSX.Element} Element to render
 */
export default function save({ attributes }) {
	const { sensorBoxId, displayName, displayLocation, displayTimestamp } = attributes;
	const blockProps = useBlockProps.save();

	// Add data attributes for the frontend JavaScript
	return (
		<div
			{...blockProps}
			data-sensor-box-id={sensorBoxId}
			data-display-name={displayName.toString()}
			data-display-location={displayLocation.toString()}
			data-display-timestamp={displayTimestamp.toString()}
		>
			{/* Content will be populated by frontend JavaScript */}
			<div className="loading-placeholder">Loading sensor data...</div>
		</div>
	);
}
