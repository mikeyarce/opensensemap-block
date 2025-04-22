=== Opensensemap Block ===
Contributors:      mikeyarce
Tags:              block, weather, opensensemap, sensors, IoT
Tested up to:      6.8
Stable tag:        0.1.0
License:           GPL-2.0-or-later
License URI:       https://www.gnu.org/licenses/gpl-2.0.html

== Description ==

**Display live environmental sensor data from openSenseMap.org directly in your WordPress site**

openSenseMap is a citizen science platform for publishing and exploring sensor data as open data. Anyone can build their own sensor box (called a senseBox), register it on openSenseMap, and contribute to a global network of environmental measurements. Learn more at [openSenseMap.org](https://opensensemap.org/) and [About openSenseMap](https://opensensemap.org/about).

Want to build your own sensor? Check out the [sensor.community guides](https://sensor.community/en/sensors/airrohr/).

This plugin provides a custom WordPress block that lets you display live data from any openSenseMap sensor box by entering its Box ID. Perfect for schools, makers, weather enthusiasts, and anyone who wants to share real-time environmental data on their website.

== Features ==

* Display live sensor readings (temperature, humidity, air pressure, and more) from any openSenseMap box
* Customizable display: show/hide sensor names, location, and last update time
* Responsive, modern design
* Easy to use – just add the block and enter a Box ID

== How to Use ==

1. Add the "OpenSenseMap Block" to any post or page using the WordPress block editor.
2. In the block settings, enter the Sensor Box ID you want to display. (You can find this on [openSenseMap.org](https://opensensemap.org/) by selecting a box and copying its ID from the URL or details panel.)
3. Choose which details to display: sensor names, location, and last update time.
4. Publish or update your post/page. The block will show live data from the selected sensor box!

== Installation ==

1. Upload the plugin files to the `/wp-content/plugins/opensensemap-block` directory, or install the plugin through the WordPress plugins screen directly.
2. Activate the plugin through the 'Plugins' screen in WordPress.

== Frequently Asked Questions ==

= Where do I find my Sensor Box ID? =
Go to [openSenseMap.org](https://opensensemap.org/), select your sensor box, and copy the ID from the URL or the box details panel.

= Can I use multiple blocks for different sensor boxes? =
Yes! You can add as many blocks as you like, each with a different Box ID.

= How often does the data update? =
The block fetches the latest data from openSenseMap and caches it for 5 minutes in a transient.

== Screenshots ==

1. Example of the block displaying live sensor data
2. Block settings in the editor

== Changelog ==

= 0.1.0 =
* Initial release

== Links & Resources ==

* openSenseMap: https://opensensemap.org/
* About openSenseMap: https://opensensemap.org/about
* Build your own sensor: https://sensebox.de/en/
* Plugin author: https://mikeyarce.com

== Arbitrary section ==

openSenseMap and senseBox are open-source projects. Learn more and get involved at [openSenseMap GitHub](https://github.com/sensebox/openSenseMap-API) and [senseBox GitHub](https://github.com/sensebox).
