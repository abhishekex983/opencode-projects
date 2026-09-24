=== Haircare Affiliate Products ===
Contributors: haircare-team
Tags: affiliate, amazon, shortcode, products
Requires at least: 5.0
Tested up to: 6.5
Stable tag: 1.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Amazon Affiliate product shortcode plugin for haircare content.

== Description ==

Display responsive Amazon Affiliate product cards in your posts and pages using shortcodes.

**Features:**

* Custom post type "Affiliate Products" in WordPress admin
* Single product shortcode: `[affiliate_product id="123"]`
* Grid shortcode: `[affiliate_products count="3" category="shampoo"]`
* Filter by specific IDs: `[affiliate_products ids="1,2,3"]`
* Responsive design: 3 cols desktop, 2 tablet, 1 mobile
* Amazon Associates compliant with auto-disclosure
* Links use `rel="noopener sponsored nofollow"`
* Customizable button text per product
* Optional price display with date disclaimer
* Inherits your theme's CSS custom properties
* Sidebar widget for displaying products
* Per-post sidebar product selection via meta box
* Genius Links integration (Quick Build method)

== Installation ==

1. Upload `haircare-affiliate-products` folder to `/wp-content/plugins/`
2. Activate the plugin through the Plugins menu in WordPress
3. Go to Affiliate Products in admin menu to add products
4. Use shortcodes in your posts/pages

== Usage ==

**Step 1: Add a Product**

1. Go to Affiliate Products > Add New Product
2. Enter the product title and description
3. Upload a product image as Featured Image (use your own photos)
4. Fill in Affiliate Product Details:
   - ASIN: Amazon product ID (found on product page)
   - Marketplace: Amazon.ca, .com, .co.uk, or .in
   - Associates Tag: Your Amazon Associates tag (default: YOURTAG-20)
   - Price: Optional static price
   - Price Date: When price was last verified
   - Button Text: Custom CTA (default: "Buy on Amazon")

**Step 2: Use Shortcodes**

Single product:
`[affiliate_product id="123"]`

Product grid:
`[affiliate_products count="3"]`

Grid with category filter:
`[affiliate_products count="4" category="shampoo"]`

**Step 3: Update Your Associates Tag**

After activation, edit any product and replace YOURTAG-20 with your real Amazon Associates tag. The placeholder tag is used by default until you change it.

== Amazon Associates Compliance ==

This plugin helps you comply with Amazon Associates Program requirements:

* Automatically adds "As an Amazon Associate I earn from qualifying purchases" disclosure
* Affiliate links include `rel="noopener sponsored nofollow"` attribute
* Links open in new tab with `target="_blank"`
* Product images should be your own (do not use Amazon product images without API)

== Frequently Asked Questions ==

= Can I use Amazon product images? =

Amazon prohibits using their product images without the Product Advertising API. Upload your own product photos or photos of products you own/use.

= How do I update prices? =

Prices are static. Edit the product in WordPress admin and update the price field manually. The plugin displays "Price as of [date]" disclaimer.

= Can I use this for other affiliate programs? =

This version is built for Amazon. The link format can be adapted by editing the `hap_build_affiliate_url()` function.

= Is it mobile responsive? =

Yes. Cards stack vertically on mobile (< 768px) with full-width buttons and optimized tap targets (48px minimum).

== Changelog ==

= 1.1.0 =
* Added Genius Links integration (Quick Build method)
* Added Settings page under Settings > Affiliate Products for TSID configuration
* Added per-post sidebar product selection via meta box on blog posts
* Added sidebar widget: Featured Products (Affiliate)
* Added `ids` attribute to `[affiliate_products]` shortcode for specific product selection
* New file: includes/settings.php
* New file: includes/post-meta.php
* New file: includes/widgets/featured-products.php

= 1.0.0 =
* Initial release
* Custom post type for affiliate products
* Single and grid shortcodes
* Responsive mobile-first CSS
* Amazon Associates compliance features
