import React, { useEffect, useState } from 'react';
import HiddenContent from './HiddenContent';
import EmbedForm from './EmbedForm';
import { useContext } from 'react';
import { Context } from '../App';
import toast from 'react-hot-toast';

const MainSection = () => {
    const {userName, setUserName, avatarURL, 
        setAvatarURL, content, setContent, 
        embeds, setEmbeds, defaultAvatar,
        defaultUser} = useContext(Context);
    
    const [webhook, setWebhook] = useState('');
    const [fetchedName, setFetchedName] = useState(null);
    const [fetchedAvatar, setFetchedAvatar] = useState(null);

    useEffect(() => {
        fetch(webhook).then(res => {
            if(res.status !== 200)
                console.error('Invalid Webhook URL');
            return res.json();
        }).then(data => {
            if(data.avatar) {
                setAvatarURL(`https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`);
                setFetchedAvatar(`https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`);
            }
            else
                {
                    setAvatarURL(undefined);
                    setFetchedAvatar(undefined);
                }
            if(data.name)
            {
                setUserName(data.name);
                setFetchedName(data.name);
            }
            else
                {
                    setUserName('');
                    setFetchedName('');
                }
        })
        .catch(err => {
            setAvatarURL(defaultAvatar);
            setUserName(defaultUser);
            setFetchedAvatar(null);
            setFetchedName(null);
            console.error('Invalid Webhook URL 2');
        });
    }, [webhook]);

    const onNameChange = (e) => {
        if(e.target.value.length > 0)
          setUserName(e.target.value);
        else if(fetchedName)
            setUserName(fetchedName);
        else
          setUserName(defaultUser);
    }

    const onAvatarChange = (e) => {
      if(e.target.value.length > 0)
        setAvatarURL(e.target.value);
      else if(fetchedAvatar)
        setAvatarURL(fetchedAvatar);
      else
        setAvatarURL(defaultAvatar);
    }

    
    const addEmbed = () => {
        setEmbeds([...embeds, {
            title: '',
            url: undefined,
            color: 16777215,
            author: {
                name: undefined,
                icon_url: undefined,
                url: undefined
            },
            description: '',
            fields: [],
            images: [],
            image: {
                url: undefined
            },
            thumbnail: {
                url: undefined
            },
            footer: {
                icon_url: undefined,
                text: undefined
            },
            timestamp: undefined,
        }]);
    }

    const sendWebhook = () => {
        const _embeds = []
        embeds.map(embed => {
            let _embed = embed;
            if(embed.images.length) {
                if(embed.url && embed.url.length) {
                    for(let i = 0; i < embed.images.length; i++) {
                        _embed.image.url = embed.images[i];
                        _embeds.push(_embed);
                    }
                    return _embed;
                }
                else if (embed.images.length === 1) {
                    _embed.image.url = embed.images[0];
                    return _embeds.push(_embed);
                }
            }
            return _embeds.push(_embed);
        });
        console.log(JSON.stringify(_embeds));
        fetch(webhook, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: content,
                username: userName,
                avatar_url: avatarURL,
                embeds: _embeds
            })
        }).then(res => {
            console.log(res);
            if(res.status !== 204)
                {
                    toast('Failed to send your webhook', {icon: '❌'});
                    console.error('Failed to send webhook');
                    return;
                }
            toast('Webhook sent successfully', {icon: '✅'});
        })
        .catch(err => {
            toast('Failed to send your webhook', {icon: '❌'});
            console.error('Failed to send webhook ' + err);
        }) 
    }
    
    
    return (
        <div>
            <h2>Schedule a webhook</h2>
            <p>Webhook URL</p>
            <div className="row">
                <input type='text' placeholder='Webhook URL' value={webhook} onChange={e => setWebhook(e.target.value)} />
                <button>Schedule</button>
                <button className='green' onClick={sendWebhook}>Send Now</button>
            </div>
            <hr />
            <p>Set Time</p>
            <div className="row">
                <input type='datetime-local' />
            </div>
            <hr />
            <p>Content <span className='smol'><i>{content.length}/2000</i></span></p>
            <div className="row">
                <textarea placeholder='Content...' maxLength={2000}
                onChange={e => setContent(e.target.value)} value={content} />
            </div>
            <hr />
            <HiddenContent title='User Info'>
                <p>Username <span className='smol'><i>{userName.length}/80</i> {"(Leave Blank For Default Username)"}</span></p>
                <div className="row">
                    <input type='text' placeholder='Username' onChange={onNameChange}  maxLength={80} />
                </div>
                <p>Avatar URL <span className='smol'>{"(Leave Blank For Default Avatar)"}</span></p>
                <div className="row">
                    <input type='text' placeholder='Avatar URL' onChange={onAvatarChange} />
                </div>
            </HiddenContent>
            
            <hr />
            <p>Add File <span className='smol'><i>Max 25MB</i></span></p>
            <div className="row">
                <input type='file' />
                <button>Upload</button>
            </div>
            <hr />
            <p>Embeds</p>
            <div className="col">
                {
                    embeds.map((embed, index) => {
                        console.log(embed);
                        return <EmbedForm embed={embed} index={index} key={index} />
                    })
                }
                <button onClick={addEmbed}>Add A New Embed</button>
            </div>
            <hr />
        </div>
    );
}

export default MainSection;