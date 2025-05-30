<?php
/**
 * Plugin Name:       openSenseMap Block
 * Description:       Display sensor data from the openSenseMap API
 * Version:           0.1.0
 * Requires at least: 6.8
 * Requires PHP:      7.4
 * Author:            Mikey Arce
 * Author URI:        https://mikeyarce.com
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       opensensemap-block
 *
 * @package OpenSenseMapBlock
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register block types.
 */
function opensensemap_block_block_init() {
	// Modern WordPress (5.8+)
	if ( function_exists( 'register_block_type_from_metadata' ) ) {
		register_block_type_from_metadata( __DIR__ . '/build/opensensemap-block' );
		return;
	}
	// Fallback for older versions of WordPress
	register_block_type( 'opensensemap-block/sensor-display', array(
		'editor_script' => 'opensensemap-block-editor',
		'editor_style'  => 'opensensemap-block-editor-style',
		'style'         => 'opensensemap-block-style',
		'script'        => 'opensensemap-block-script'
	));
}
add_action( 'init', 'opensensemap_block_block_init' );

/**
 * Enqueue scripts.
 */
function opensensemap_block_enqueue_scripts() {
	if ( has_block( 'opensensemap-block/sensor-display' ) ) {
		wp_localize_script(
			'opensensemap-block-sensor-display-view-script',
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

	register_rest_route(
		'opensensemap-block/v1',
		'opensensemap/(?P<id>[\w-]+)',
		array(
			'methods'             => array( 'GET' ),
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

		$api_url = 'https://api.opensensemap.org/boxes/' . $box_id;

		$cache_key   = 'opensensemap_data_' . $box_id;
		$cached_data = get_transient( $cache_key );

		if ( false !== $cached_data ) {
			return rest_ensure_response( $cached_data );
		}

		$response = wp_remote_get(
			$api_url,
			array(
				'timeout'    => 15,
				'user-agent' => 'WordPress/' . get_bloginfo( 'version' ),
			)
		);

		if ( is_wp_error( $response ) ) {
			return new WP_Error(
				'api_error',
				__( 'Error connecting to OpenSenseMap API', 'opensensemap-block' ),
				array( 'status' => 500 )
			);
		}

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

		$body = wp_remote_retrieve_body( $response );
		$data = json_decode( $body, true );

		if ( empty( $data ) || JSON_ERROR_NONE !== json_last_error() ) {
			return new WP_Error(
				'api_error',
				__( 'Invalid response from OpenSenseMap API', 'opensensemap-block' ),
				array( 'status' => 500 )
			);
		}

		$transformed_data = array(
			'currentLocation'   => $data['name'] ?? '',
			'lastMeasurementAt' => $data['lastMeasurementAt'] ?? '',
			'sensors'           => array(),
		);

		if ( ! empty( $data['sensors'] ) ) {
			foreach ( $data['sensors'] as $sensor ) {
				$sensor_name = $sensor['title'] ?? $sensor['sensorType'] ?? '';
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
