import { API_URL } from './config';

export const getWebhooksForUser = async (userId) => {
    const response = await fetch(`${API_URL}/schedule/${userId}`, { credentials: 'include' });
    if (!response.ok) {
      throw new Error('Failed to fetch webhooks');
    }
    const data = await response.json();
    return data;
  };
  
  export const deleteWebhook = async (id) => {
    const response = await fetch(`${API_URL}/schedule/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error('Failed to delete webhook');
    }
  };

  export const addWebhook = async (webhook) => {
    const response = await fetch(`${API_URL}/schedule`, {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify(webhook),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error('Failed to add webhook');
    }
    console.log(response);
    const data = await response.json();
    return data;
  };

