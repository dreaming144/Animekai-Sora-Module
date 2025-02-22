# Animekai Sora Module

This repository contains a source module for Animekai.to, compatible with the Sora app (https://github.com/cranci1/Sora), adapted from the CloudStream 3 module by phisher98.

## Installation

1. **Clone or Download**:
   - Clone this repository or download the `Sources/Modules/` directory.

2. **Add to Sora**:
   - Place the `animekai-to.js` and `animekai-to.json` files in the `Sources/Modules/` directory of your Sora installation.
   - If Sora uses a different module directory, consult the Sora documentation or README.

3. **Import in Sora**:
   - Open Sora on your iOS/macOS device.
   - Go to Settings > Add Module, and select the Animekai module to import it.
   - Test the module by searching for anime (e.g., "Sailor Moon"), viewing details (Sub/Dub episodes), and playing episodes (note: streams may use MegaUp, ensure Sora supports external URLs).

## Dependencies
- This module uses `cheerio` for HTML parsing. Ensure Sora’s environment supports it via `require('cheerio')`. If not, use the alternative version with `DOMParser` (see module comments).
- Requires Node.js `Buffer` for base64 encoding/decoding. If Sora uses a browser-like environment, adjust `base64UrlEncode` and `base64UrlDecode` in `animekai-to.js` to use `btoa`/`atob`.

## Known Issues
- Stream URLs may be hosted on MegaUp. If streams don’t play, verify Sora can handle `megaup.net` URLs directly or consult the Sora community for extractor support.
- Token generation and decoding accuracy depend on `AnimekaiDecoder`. Test thoroughly and refine if streams fail.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support
For issues or questions, open an issue on this GitHub repository or consult the Sora community/documentation.
