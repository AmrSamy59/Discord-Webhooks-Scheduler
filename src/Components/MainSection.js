import React, { useEffect, useState } from 'react';
import HiddenContent from './HiddenContent';
import EmbedForm from './EmbedForm';
import { useContext } from 'react';
import { Context } from '../App';
import toast from 'react-hot-toast';
import { addWebhook } from '../db';
import { getTimeZone } from '../Utils';

const MainSection = () => {
    const { userName, setUserName, avatarURL, 
        setAvatarURL, content, setContent, 
        embeds, setEmbeds, defaultAvatar,
        defaultUser, file, setFile,
        fetchWebhooks, webhook, setWebhook } = useContext(Context);
    
    const [isValidWebhook, setIsValidWebhook] = useState(false);
    const [fetchedName, setFetchedName] = useState(null);
    const [fetchedAvatar, setFetchedAvatar] = useState(null);
    const [schedTime, setSchedTime] = useState(null);

    useEffect(() => {
        const controller = new AbortController();
        fetch(webhook, { signal: controller.signal }).then(res => {
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
            if(data.id) {
                setIsValidWebhook(true);
            }
        })
        .catch(err => {
            setAvatarURL(defaultAvatar);
            setUserName(defaultUser);
            setFetchedAvatar(null);
            setFetchedName(null);
            setIsValidWebhook(false);
            console.error('Invalid Webhook URL 2');
        });
        return () => controller.abort
        // eslint-disable-next-line
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


    useEffect(() => {
        setFileKey(fileKey + 1);
        setFile(undefined);
        return () => {
            setFileKey(fileKey + 1);
            setFile(undefined);
        }
        // eslint-disable-next-line
    }, []);

    const [fileKey, setFileKey] = useState(0);

    const onFileChange = (e) => {
        if(e.target.files[0].size > 25000000)
        {
            e.preventDefault();
            toast('File size too large', {icon: '❌'});
            e.target.value = null;
            setFileKey(fileKey + 1);
            setFile(undefined);
            return;
        }
        setFile(e.target.files[0]);
        console.log(e.target.files[0]);
    }

    const clearFile = () => {
        setFile(undefined);
        setFileKey(fileKey + 1);
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
        if(!isValidWebhook)
        {
            toast('Invalid Webhook URL', {icon: '❌'});
            return;
        }
        if(content.trim().length === 0 && embeds.length === 0)
            {
                toast('Please add some content or embeds', {icon: '❌'});
                return;
            }
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
        let formData = new FormData();
        formData.append('payload_json', JSON.stringify({
            content: content,
            username: userName,
            avatar_url: avatarURL,
            embeds: _embeds
        }));
        if(file)
            formData.append('file[0]', file, file.name);

        fetch(webhook + "?wait=true", {
            method: 'POST',
            body: formData
        }).then(res => {
            console.log(res);
            if(!res.ok)
                {
                    toast('Failed to send your webhook', {icon: '❌'});
                    console.error('Failed to send webhook');
                    return res.json();

                }
            toast('Webhook sent successfully', {icon: '✅'});
            return res.json();

        }).then(data => {
            console.log("data: ", data);
            if(data.message)
            {
                toast(data.message, {icon: '❌'});
                return;
            }

        })
        .catch(err => {
            toast('Failed to send your webhook', {icon: '❌'});
            console.error('Failed to send webhook ' + err);
        }) 
    }
    
    const scheduleWebhook = () => {
        if(!isValidWebhook)
            {
                toast('Invalid Webhook URL', {icon: '❌'});
                return;
            }
        if(!schedTime)
        {
            toast('Please set a time', {icon: '❌'});
            return;
        }
        const now = new Date();
        if(schedTime <= now)
        {
            toast('Please set a time in the future', {icon: '❌'});
            return;
        }
        if(content.trim().length === 0 && embeds.length === 0)
        {
            toast('Please add some content or embeds', {icon: '❌'});
            return;
        }
        if(file) {
            toast('Files cannot be scheduled', {icon: '❌'});
            return;
        }
        console.log('Scheduling webhook');
        console.log(schedTime);
        addWebhook({
            user_id: 271026539007574018,
            time: schedTime,
            webhook_url: webhook,
            message: {
                content: content,
                username: userName,
                avatar_url: avatarURL,
                embeds: embeds,
                file: file
            }
        }).then(data => {
            console.log(data);
            if(data.user_id) {
                fetchWebhooks();
                toast('Webhook scheduled successfully', {icon: '✅'});
            }
            else
                toast('Failed to schedule webhook', {icon: '❌'});
        })
        .catch(err => {
            console.error(err);
        })
    }
    return (
        <div>
            <h2>Schedule a webhook</h2>
            <p>Webhook URL</p>
            <div className="row">
                <input type='text' placeholder='Webhook URL' value={webhook} onChange={e => setWebhook(e.target.value)} />
                <button onClick={scheduleWebhook}>Schedule</button>
                <button className='green' onClick={sendWebhook}>Send Now</button>
            </div>
            <hr />
            <p>Set Time <span className="smol">in Timezone {getTimeZone()}</span></p>
            <div className="row">
                <input type='datetime-local' onChange={(e) => setSchedTime((new Date(e.target.value)))} />
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
                <input type='file' onChange={onFileChange} key={fileKey} />
                <button className='red' onClick={clearFile}>Clear</button>
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