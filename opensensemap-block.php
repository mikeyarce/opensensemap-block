<?php
/**
 * Plugin Name:       OpenSenseMap Block
 * Description:       Display sensor data from OpenSenseMap API.
 * Version:           0.1.0
 * Requires at least: 6.7
 * Requires PHP:      7.4
 * Author:            The WordPress Contributors
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       opensensemap-block
 *
 * @package OpenSenseMapBlock
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Registers the block using a `blocks-manifest.php` file, which improves the performance of block type registration.
 * Behind the scenes, it also registers all assets so they can be enqueued
 * through the block editor in the corresponding context.
 *
 * @see https://make.wordpress.org/core/2025/03/13/more-efficient-block-type-registration-in-6-8/
 * @see https://make.wordpress.org/core/2024/10/17/new-block-type-registration-apis-to-improve-performance-in-wordpress-6-7/
 */
function opensensemap_block_block_init() {
	/**
	 * Registers the block(s) metadata from the `blocks-manifest.php` and registers the block type(s)
	 * based on the registered block metadata.
	 * Added in WordPress 6.8 to simplify the block metadata registration process added in WordPress 6.7.
	 *
	 * @see https://make.wordpress.org/core/2025/03/13/more-efficient-block-type-registration-in-6-8/
	 */
	if ( function_exists( 'wp_register_block_types_from_metadata_collection' ) ) {
		wp_register_block_types_from_metadata_collection( __DIR__ . '/build', __DIR__ . '/build/blocks-manifest.php' );
		return;
	}

	/**
	 * Registers the block(s) metadata from the `blocks-manifest.php` file.
	 * Added to WordPress 6.7 to improve the performance of block type registration.
	 *
	 * @see https://make.wordpress.org/core/2024/10/17/new-block-type-registration-apis-to-improve-performance-in-wordpress-6-7/
	 */
	if ( function_exists( 'wp_register_block_metadata_collection' ) ) {
		wp_register_block_metadata_collection( __DIR__ . '/build', __DIR__ . '/build/blocks-manifest.php' );
	}
	/**
	 * Registers the block type(s) in the `blocks-manifest.php` file.
	 *
	 * @see https://developer.wordpress.org/reference/functions/register_block_type/
	 */
	$manifest_data = require __DIR__ . '/build/blocks-manifest.php';
	foreach ( array_keys( $manifest_data ) as $block_type ) {
		register_block_type( __DIR__ . "/build/{$block_type}" );
	}
}
add_action( 'init', 'opensensemap_block_block_init' );

/**
 * Enqueue frontend scripts for the block
 */
function opensensemap_block_enqueue_scripts() {
	// Only enqueue if the block is used on the page.
	if ( has_block( 'opensensemap-block/opensensemap-block' ) ) {
		// Pass API settings to frontend JavaScript.
		wp_localize_script(
			'opensensemap-block-opensensemap-block-view-script',
			'opensensemapBlockApiSettings',
			array(
				'root'  => esc_url_raw( rest_url() ),
				'nonce' => wp_create_nonce( 'wp_rest' ),
			)
		);
	}
}
add_action( 'wp_enqueue_scripts', 'opensensemap_block_enqueue_scripts' );

/**
 * Register REST API routes.
 */
function opensensemap_block_register_api_routes() {
	if ( ! function_exists( 'register_rest_route' ) ) {
		return;
	}

	if ( ! class_exists( 'WP_REST_Server' ) ) {
		return;
	}

	// Remove the leading slash from the route.
	register_rest_route(
		'opensensemap-block/v1',
		'opensensemap/(?P<id>[\w-]+)', // Simplified pattern.
		array(
			'methods'             => array( 'GET' ), // Array of methods for better compatibility.
			'callback'            => 'opensensemap_block_get_opensensemap_data',
			'permission_callback' => '__return_true',
			'args'                => array(
				'id' => array(
					'required'          => true,
					'type'              => 'string',
					'validate_callback' => function ( $param ) {
						return is_string( $param ) && ! empty( $param );
					},
				),
			),
		)
	);
}

// Only register on rest_api_init.
add_action( 'rest_api_init', 'opensensemap_block_register_api_routes' );

/**
 * Get data from OpenSenseMap API.
 *
 * @param WP_REST_Request $request The request object.
 * @return WP_REST_Response|WP_Error Response object or error.
 */
function opensensemap_block_get_opensensemap_data( $request ) {
	try {
		$box_id = sanitize_text_field( $request['id'] );

		if ( empty( $box_id ) ) {
			return new WP_Error(
				'missing_id',
				__( 'Box ID is required', 'opensensemap-block' ),
				array( 'status' => 400 )
			);
		}

		// Set up API URL.
		$api_url = 'https://api.opensensemap.org/boxes/' . $box_id;

		// Get transient first to avoid unnecessary API calls.
		$cache_key   = 'opensensemap_data_' . $box_id;
		$cached_data = get_transient( $cache_key );

		if ( false !== $cached_data ) {
			return rest_ensure_response( $cached_data );
		}

		// Make API request.
		$response = wp_remote_get(
			$api_url,
			array(
				'timeout'    => 15,
				'user-agent' => 'WordPress/' . get_bloginfo( 'version' ),
			)
		);

		// Check for errors.
		if ( is_wp_error( $response ) ) {
			return new WP_Error(
				'api_error',
				__( 'Error connecting to OpenSenseMap API', 'opensensemap-block' ),
				array( 'status' => 500 )
			);
		}

		// Check response code.
		$response_code = wp_remote_retrieve_response_code( $response );
		if ( 200 !== $response_code ) {
			return new WP_Error(
				'api_error',
				sprintf(
					/* translators: %d: HTTP response code */
					__( 'Error fetching data from OpenSenseMap API: %d', 'opensensemap-block' ),
					$response_code
				),
				array( 'status' => $response_code )
			);
		}

		// Get response body.
		$body = wp_remote_retrieve_body( $response );
		$data = json_decode( $body, true );

		if ( empty( $data ) || JSON_ERROR_NONE !== json_last_error() ) {
			return new WP_Error(
				'api_error',
				__( 'Invalid response from OpenSenseMap API', 'opensensemap-block' ),
				array( 'status' => 500 )
			);
		}

		// Transform the data into our expected format.
		$transformed_data = array(
			'currentLocation'   => $data['name'] ?? '',
			'lastMeasurementAt' => $data['lastMeasurementAt'] ?? '',
			'sensors'           => array(),
		);

		// Process sensors.
		if ( ! empty( $data['sensors'] ) ) {
			foreach ( $data['sensors'] as $sensor ) {
				$sensor_name = $sensor['title'] ?? $sensor['sensorType'] ?? '';
				// Translate German sensor names to English.
				$sensor_name = opensensemap_block_translate_sensor_name( $sensor_name );

				$transformed_data['sensors'][] = array(
					'name'            => $sensor_name,
					'unit'            => $sensor['unit'] ?? '',
					'icon'            => opensensemap_block_get_sensor_icon( $sensor['sensorType'] ?? '' ),
					'lastMeasurement' => ! empty( $sensor['lastMeasurement'] ) ? array(
						'value'     => $sensor['lastMeasurement']['value'] ?? 0,
						'timestamp' => $sensor['lastMeasurement']['createdAt'] ?? '',
					) : null,
				);
			}
		}

		// Cache the transformed data for 5 minutes.
		set_transient( $cache_key, $transformed_data, 5 * MINUTE_IN_SECONDS );

		return rest_ensure_response( $transformed_data );
	} catch ( Exception $e ) {
		return new WP_Error(
			'api_error',
			__( 'An unexpected error occurred', 'opensensemap-block' ),
			array( 'status' => 500 )
		);
	}
}

/**
 * Get the appropriate icon for a sensor type.
 *
 * @param string $sensor_type The sensor type.
 * @return string The icon name.
 */
function opensensemap_block_get_sensor_icon( $sensor_type ) {
	$icon_map = array(
		'temperature' => 'thermometer',
		'humidity'    => 'humidity',
		'pressure'    => 'cloud',
		'default'     => 'chart',
	);

	return $icon_map[ strtolower( $sensor_type ) ] ?? $icon_map['default'];
}

/**
 * Translate German sensor names to English.
 *
 * @param string $sensor_name The sensor name that might be in German.
 * @return string The translated sensor name in English.
 */
function opensensemap_block_translate_sensor_name( $sensor_name ) {
	$translations = array(
		'Temperatur'         => 'Temperature',
		'rel. Luftfeuchte'   => 'Relative Humidity',
		'Luftdruck'          => 'Air Pressure',
		'Luftfeuchtigkeit'   => 'Humidity',
		'Helligkeit'         => 'Brightness',
		'Beleuchtungsstärke' => 'Illuminance',
		'UV-Intensität'      => 'UV Intensity',
	);

	return $translations[ $sensor_name ] ?? $sensor_name;
}
