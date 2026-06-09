import axios from 'axios'

export const validateYoutubeVideo = async (url) => {
    try {
        await axios.get(
            `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
        );

        return true;
    } catch {
        return false;
    }
}

