// ==SoraModule==
// @name         Animekai
// @version      1.0.0
// @author       Assistant (Adapted from phisher98/CloudStream)
// @description  Animekai.to source for Sora, adapted from CloudStream 3 module
// ==/SoraModule==

export const metadata = {
    name: 'Animekai',
    baseURL: 'https://animekai.to',
    version: '1.0.0',
    author: 'Assistant',
    description: 'Animekai.to source for Sora, adapted from CloudStream 3',
    lang: 'en',
    type: 'anime',
    mode: 'async'
};

class AnimekaiDecoder {
    base64UrlEncode(str) {
        const base64Encoded = btoa(unescape(encodeURIComponent(str)));
        return base64Encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    base64UrlDecode(n) {
        const padded = n.padEnd(n.length + ((4 - (n.length % 4)) % 4), '=')
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        return decodeURIComponent(escape(atob(padded)));
    }

    transform(key, text) {
        const v = Array.from({ length: 256 }, (_, i) => i);
        let c = 0;
        const f = [];

        for (let w = 0; w < 256; w++) {
            c = (c + v[w] + key.charCodeAt(w % key.length)) % 256;
            [v[w], v[c]] = [v[c], v[w]]; // Swap elements
        }

        let a = 0, w = 0, sum = 0;
        while (a < text.length) {
            w = (w + 1) % 256;
            sum = (sum + v[w]) % 256;
            [v[w], v[sum]] = [v[sum], v[w]]; // Swap elements
            f.push(String.fromCharCode(text.charCodeAt(a) ^ v[(v[w] + v[sum]) % 256]));
            a++;
        }
        return f.join('');
    }

    reverseIt(input) {
        return input.split('').reverse().join('');
    }

    substitute(input, keys, values) {
        const map = {};
        for (let i = 0; i < keys.length; i++) {
            map[keys[i]] = values[i] || keys[i];
        }
        return input.split('').map(char => map[char] || char).join('');
    }

    generateToken(input) {
        const encodedInput = encodeURIComponent(input).replace(/\+/g, '%20');
        let temp = this.base64UrlEncode(this.transform("gEUzYavPrGpj", this.reverseIt(encodedInput)));
        temp = this.substitute(temp, "U8nv0tEFGTb", "bnGvE80UtTF");
        temp = this.substitute(temp, "9ysoRqBZHV", "oqsZyVHBR9");
        temp = this.reverseIt(this.base64UrlEncode(this.transform("CSk63F7PwBHJKa", temp)));
        temp = this.substitute(temp, "cKj9BMN15LsdH", "NL5cdKs1jB9MH");
        temp = this.base64UrlEncode(this.reverseIt(this.base64UrlEncode(this.transform("T2zEp1WHL9CsSk7", temp))));
        return temp;
    }

    decodeIframeData(n) {
        let temp = this.base64UrlDecode(this.reverseIt(this.base64UrlDecode(n)));
        temp = this.transform("T2zEp1WHL9CsSk7", temp);
        temp = this.reverseIt(this.substitute(temp, "NL5cdKs1jB9MH", "cKj9BMN15LsdH"));
        temp = this.transform("CSk63F7PwBHJKa", this.base64UrlDecode(temp));
        temp = this.substitute(temp, "oqsZyVHBR9", "9ysoRqBZHV");
        temp = this.base64UrlDecode(this.substitute(temp, "bnGvE80UtTF", "U8nv0tEFGTb"));
        return decodeURIComponent(this.reverseIt(this.transform("gEUzYavPrGpj", temp)));
    }
}

const decoder = new AnimekaiDecoder();

function getType(t) {
    if (t.includes('OVA') || t.includes('Special')) return 'OVA';
    if (t.includes('Movie')) return 'AnimeMovie';
    return 'Anime';
}

function getStatus(t) {
    switch (t.toLowerCase()) {
        case 'finished airing': return 'Completed';
        case 'releasing': return 'Ongoing';
        default: return 'Completed';
    }
}

export const search = async ({ query, page = 1 }) => {
    try {
        const searchUrl = `${metadata.baseURL}/browser?keyword=${encodeURIComponent(query)}&page=${page}`;
        const response = await fetch(searchUrl);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const results = [];
        const items = doc.querySelectorAll('.aitem-wrapper div.aitem');
        items.forEach(element => {
            const href = element.querySelector('a.poster')?.getAttribute('href') || '';
            const title = element.querySelector('a.title')?.textContent.trim() || 'Unknown Title';
            const subCount = element.querySelector('div.info span.sub')?.textContent.trim().match(/\d+/)?.[0] || 0;
            const dubCount = element.querySelector('div.info span.dub')?.textContent.trim().match(/\d+/)?.[0] || 0;
            const posterUrl = element.querySelector('a.poster img')?.getAttribute('data-src') || '';
            const typeText = element.querySelector('div.fd-infor > span.fdi-item')?.textContent.trim() || '';
            const type = getType(typeText);

            results.push({
                id: href.split('/').pop().split('-').pop() || href,
                title: title,
                url: href.startsWith('http') ? href : `${metadata.baseURL}${href}`,
                image: posterUrl.startsWith('http') ? posterUrl : `${metadata.baseURL}${posterUrl}`,
                type: type,
                dubStatus: dubCount > 0,
                subStatus: subCount > 0,
                dubEpisodes: dubCount > 0 ? parseInt(dubCount) : 0,
                subEpisodes: subCount > 0 ? parseInt(subCount) : 0
            });
        });

        const hasNextPage = doc.querySelector('.pagination .next') !== null;

        return {
            results: results.length ? results : [],
            hasNextPage: hasNextPage
        };
    } catch (error) {
        console.error(`Search error: ${error.message}`);
        return { results: [], hasNextPage: false };
    }
};

export const info = async ({ id }) => {
    try {
        const url = `${metadata.baseURL}/watch/${id}`;
        const response = await fetch(url);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const title = doc.querySelector('.title')?.textContent.trim() || 'Unknown Title';
        const japTitle = doc.querySelector('.title')?.getAttribute('data-jp') || title; // Assuming data-jp is available
        const poster = doc.querySelector('.watch-section-bg')?.getAttribute('style')?.match(/url\(['"]?(.*?)['"]?\)/)?.[1] || '';
        const animeId = doc.querySelector('.rate-box')?.getAttribute('data-id') || id;
        const malId = doc.querySelector('.watch-section')?.getAttribute('data-mal-id')?.match(/\d+/)?.[0] || null;
        const aniListId = doc.querySelector('.watch-section')?.getAttribute('data-al-id')?.match(/\d+/)?.[0] || null;

        const subCount = doc.querySelector('.info span.sub')?.textContent.trim().match(/\d+/)?.[0] || 0;
        const dubCount = doc.querySelector('.info span.dub')?.textContent.trim().match(/\d+/)?.[0] || 0;

        // Fetch episodes via AJAX (using AnimekaiDecoder for token)
        const token = decoder.generateToken(animeId);
        const episodesUrl = `${metadata.baseURL}/ajax/episodes/list?ani_id=${animeId}&_=${token}`;
        const episodesResponse = await fetch(episodesUrl);
        const episodesData = await episodesResponse.text();
        const episodesDoc = parser.parseFromString(episodesData, 'text/html');

        const subEpisodes = [];
        const dubEpisodes = [];
        episodesDoc.querySelectorAll('.eplist a').forEach(element => {
            const episodeNum = element.getAttribute('num')?.match(/\d+/)?.[0] || (subEpisodes.length + dubEpisodes.length + 1);
            const episodeToken = element.getAttribute('token') || '';
            const episodeName = element.querySelector('span')?.textContent.trim() || `Episode ${episodeNum}`;

            if (subEpisodes.length < subCount) {
                subEpisodes.push({
                    id: `sub|${episodeToken}`,
                    number: parseInt(episodeNum),
                    title: episodeName,
                    url: `${metadata.baseURL}/watch/${id}#ep=${episodeNum}`
                });
            }
            if (dubEpisodes.length < dubCount) {
                dubEpisodes.push({
                    id: `dub|${episodeToken}`,
                    number: parseInt(episodeNum),
                    title: episodeName,
                    url: `${metadata.baseURL}/watch/${id}#ep=${episodeNum}`
                });
            }
        });

        const genres = Array.from(doc.querySelectorAll('.detail a'))
            .filter(el => el.getAttribute('href')?.includes('/genres/'))
            .map(el => el.textContent.trim());
        const statusText = doc.querySelector('.detail div:contains(Status) span')?.textContent.trim() || 'Completed';
        const status = getStatus(statusText);

        const recommendations = [];
        doc.querySelectorAll('.aitem-col a').forEach(element => {
            const recHref = element.getAttribute('href') || '';
            const recTitle = element.querySelector('div.title')?.textContent.trim() || 'Unknown';
            const recPoster = element.getAttribute('style')?.match(/url\(['"]?(.*?)['"]?\)/)?.[1] || '';
            recommendations.push({
                title: recTitle,
                url: recHref.startsWith('http') ? recHref : `${metadata.baseURL}${recHref}`,
                image: recPoster.startsWith('http') ? recPoster : `${metadata.baseURL}${recPoster}`
            });
        });

        return {
            id,
            title,
            url,
            image: poster.startsWith('http') ? poster : `${metadata.baseURL}${poster}`,
            description: 'No description available', // Add if available in HTML
            type: 'Anime', // Default; refine if type varies
            status,
            japName: japTitle,
            genres,
            episodes: [...subEpisodes, ...dubEpisodes], // Combine Sub and Dub episodes
            recommendations,
            malId: malId ? parseInt(malId) : null,
            aniListId: aniListId ? parseInt(aniListId) : null
        };
    } catch (error) {
        console.error(`Info error: ${error.message}`);
        return null;
    }
};

export const sources = async ({ id }) => {
    try {
        // Extract episode number and type (sub/dub) from ID
        const [type, token] = id.split('|');
        const episodeNum = id.match(/#ep=(\d+)/)?.[1] || '1'; // Fallback to episode 1
        const fullUrl = `${metadata.baseURL}/watch/${token.split('=')[0]}#ep=${episodeNum}`; // Reconstruct URL

        // Fetch server list via AJAX (using AnimekaiDecoder for token)
        const serverToken = decoder.generateToken(token);
        const serversUrl = `${metadata.baseURL}/ajax/links/list?token=${token}&_=${serverToken}`;
        const serversResponse = await fetch(serversUrl);
        const serversData = await serversResponse.text();
        const serversDoc = new DOMParser().parseFromString(serversData, 'text/html');

        const sources = [];
        const serverIds = Array.from(serversDoc.querySelectorAll(`div.server-items[data-id="${type == 'sub' ? 'raw' : 'dub'}"] span[data-lid]`))
            .map(el => el.getAttribute('data-lid')).distinct();

        for (const serverId of serverIds) {
            const linkToken = decoder.generateToken(serverId);
            const linkUrl = `${metadata.baseURL}/ajax/links/view?id=${serverId}&_=${linkToken}`;
            const linkResponse = await fetch(linkUrl);
            const linkData = await linkResponse.text();
            const iframeUrl = decoder.decodeIframeData(linkData); // Use decodeIframeData for iframe URL

            if (iframeUrl) {
                // Check if the URL is from MegaUp or similar (based on CloudStream's MegaUp extractor)
                if (iframeUrl.includes('megaup.net') || iframeUrl.includes('megaupload')) {
                    sources.push({
                        url: iframeUrl,
                        quality: 'auto',
                        isM3U8: iframeUrl.includes('.m3u8'),
                        name: 'MegaUp', // Optional: Name for identification
                        subtitles: [] // Placeholder for soft subtitles; verify if available
                    });
                } else {
                    sources.push({
                        url: iframeUrl.startsWith('http') ? iframeUrl : `${metadata.baseURL}${iframeUrl}`,
                        quality: 'auto',
                        isM3U8: iframeUrl.includes('.m3u8'),
                        subtitles: [] // Placeholder for soft subtitles; verify if available
                    });
                }
            }
        }

        return sources.length ? sources : [];
    } catch (error) {
        console.error(`Sources error: ${error.message}`);
        return [];
    }
};

// Helper to remove duplicates from array
Array.prototype.distinct = function() {
    return [...new Set(this)];
};