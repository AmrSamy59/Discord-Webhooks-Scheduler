import { getTimeZone } from '../Utils';
import { deleteWebhook } from '../db';
import { useContext } from 'react';
import { Context } from '../App';
import { useEffect, useState } from 'react';

const Log = ({ log }) => {
    const { fetchWebhooks } = useContext(Context);
    
    const [date] = useState(new Date(log.time));
    const [timeLeft, setTimeLeft] = useState('0h 0m 0s');

    useEffect(() => {
        const id = setInterval(() => getTimeLeft(), 1000);
    
        return () => {
          clearInterval(id);
        };
        // eslint-disable-next-line
      }, []);


    const handleDelete = async () => {
        await deleteWebhook(log.id);
        fetchWebhooks();
    };

    const getTimeLeft = () => {
        const now = new Date();
        const diff = date.getTime() - now.getTime();
        const secs = Math.floor(diff / 1000) % 60;
        const mins = Math.floor(diff / 1000 / 60) % 60;
        const hrs = Math.floor(diff / 1000 / 60 / 60);
        if (diff <= 0) {
            setTimeLeft('0h 0m 0s will be sent shortly...');
            setTimeout(() => {
                fetchWebhooks();
            }, 1000);
        }
        else
        setTimeLeft(`${hrs}h ${mins}m ${secs}s`);
    }
        
    return (
        <div className="log">
            <div className="log-header">
                <div className="col">
                    <h3>{log.content}</h3>
                    
                </div>
                <p>{(date).toLocaleString()} <span className="smol">{getTimeZone()}</span></p>
                <span className='smol'>time left: {timeLeft}</span>
            </div>
            <div className="log-content">
                <p>{log.message.content.slice(0, 100)}{log.message.content.length > 100 && "..."}</p>
                <span className="smol">{log.message.embeds ? log.message.embeds.length: 0} embeds</span>
                <button className='red' onClick={handleDelete}>Cancel</button>
            </div>
        </div>
    );
}

export default Log;