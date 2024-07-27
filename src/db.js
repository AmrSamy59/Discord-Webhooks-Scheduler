import { API_URL } from './config';

export const getWebhooksForUser = async (userId) => {
    const response = await fetch(`${API_URL}/schedule/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch webhooks');
    }
    const data = await response.json();
    return data;
  };
  
  export const deleteWebhook = async (id) => {
    const response = await fetch(`${API_URL}/schedule/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete webhook');
    }
  };

  export const addWebhook = async (webhook) => {
    const response = await fetch(`${API_URL}/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhook),
    });
    if (!response.ok) {
      throw new Error('Failed to add webhook');
    }
    console.log(response);
    const data = await response.json();
    return data;
  };

