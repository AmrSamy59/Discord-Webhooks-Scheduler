import './previewSection.css';
import Markdown from 'react-markdown'
import { useState, useEffect } from 'react';
import { useContext } from 'react';
import { Context } from '../App';
import rehypeRaw from 'rehype-raw';


import Embed from './Embed';
const PreviewSection = () => {
    const [time, setTime] = useState(new Date());
    const {userName, avatarURL, content, embeds, file} = useContext(Context);
    const [newContent, setNewContent] = useState(content);
    const imageTypes = ['image/gif', 'image/jpeg', 'image/png'];

    useEffect(() => {
        const interval = setInterval(() => {
        setTime(new Date());
        }, 1000 * 15);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // regex to match <:emoji:1234567890> and replace with <img src="https://cdn.discordapp.com/emojis/1234567890.png" alt="emoji" />
        const emojiRegex = /<:([^:]+):(\d+)>/g;
        const emojiReplace = '<img src="https://cdn.discordapp.com/emojis/$2.png" alt="$1" class="rendered-emoji" />';

        const animatedEmojiRegex = /<a:([^:]+):(\d+)>/g;
        const animatedEmojiReplace = '<img src="https://cdn.discordapp.com/emojis/$2.gif" alt="$1" class="rendered-emoji" />';

        const everyoneRoleRegex = /@everyone/g;
        const hereRoleRegex = /@here/g;
        const roleRegex = /<@&(\d+)>/g;
        const userRegex = /<@!?(\d+)>/g;
        let updatedContent = content.replace(emojiRegex, emojiReplace)
        .replace(animatedEmojiRegex, animatedEmojiReplace)
        .replace(everyoneRoleRegex, '<span class="rendered-mention">@everyone</span>')
        .replace(hereRoleRegex, '<span class="rendered-mention">@here</span>')
        .replace(roleRegex, '<span class="rendered-mention">@Role</span>')
        .replace(userRegex, '<span class="rendered-mention">@User</span>');

        // Escape all other HTML tags to show them as text
        updatedContent = updatedContent.replace(/</g, '&lt;').replace(/>/g, '&gt;');

        // Allow only the <img> tags by reversing the escape for <img>
        updatedContent = updatedContent.replace(
            /&lt;img src="([^"]+)" alt="([^"]+)" class="rendered-emoji" \/&gt;/g,
            '<img src="$1" alt="$2" class="rendered-emoji" />'
        );

        updatedContent = updatedContent.replace(/&lt;span class="rendered-mention"&gt;([^"]+)&lt;\/span&gt;/g, 
            '<span class="rendered-mention">$1</span>');
        setNewContent(updatedContent);
    }, [content]);
    
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
                <Markdown rehypePlugins={[rehypeRaw]} >{newContent}</Markdown>
            </div>
            {
                file && (imageTypes.includes(file['type']) ? <img src={URL.createObjectURL(file)}alt="Attachment" className='msgFile' />
                : <div className='msgFile'><a href={URL.createObjectURL(file)} >{file.name}</a></div>
            ) 
            }
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