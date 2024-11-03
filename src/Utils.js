import { API_URL } from './config';

export const getTimeZone = () => {
    const timeOffset = new Date().getTimezoneOffset();
    let sign = timeOffset > 0 ? '-' : '+';
    return `UTC${sign}${Math.abs(timeOffset / 60)}`;
  }

export const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_URL}/upload`, { // Adjust the endpoint
        method: 'POST',
        body: formData,
    });
    if (!response.ok) {
        throw new Error('Failed to upload file');
    }
    const data = await response.json();
    return data.fileUrl; // The URL of the uploaded file
};