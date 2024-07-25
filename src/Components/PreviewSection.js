import './previewSection.css';
import Markdown from 'react-markdown'
import { useState, useEffect } from 'react';
import { useContext } from 'react';
import { Context } from '../App';

import Embed from './Embed';
const PreviewSection = () => {
    const [time, setTime] = useState(new Date());
    const {userName, avatarURL, content, embeds} = useContext(Context);

    useEffect(() => {
        const interval = setInterval(() => {
        setTime(new Date());
        }, 1000 * 15);

        return () => clearInterval(interval);
    }, []);
    
    return (
        <div>
            <h2>Preview</h2>
            <div id="userInf">
                <img id="userPfp" src={avatarURL} alt="User Avatar" />
                <h1 id="userName">{userName}</h1>
                <span id="botBadge">BOT</span>
                <span id='usertime' className="smol">{time.toLocaleDateString()}</span>
            </div>
            <div id="messageContent">
                <Markdown>{content}</Markdown>
            </div>
            {
                embeds && embeds.map((embed, index) => {
                    return (
                        <Embed embed={embed} key={index} />
                    )
                })
            }
        </div>
    );
}

export default PreviewSection;