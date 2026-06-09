import axios from "axios";


export const isUrlAvailable = async (url) => {
    try {
        const response = await axios.get(url, {
            timeout: 5000,
            maxRedirects: 5,
        });

        return response.status >= 200 &&
            response.status < 400;
    } catch (error) {
        return false;
    }

}