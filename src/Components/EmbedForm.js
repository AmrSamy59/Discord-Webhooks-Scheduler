import HiddenContent from "./HiddenContent";
import { useContext } from 'react';
import { Context } from '../App';

const EmbedForm = ({ embed, index }) => {

    const { embeds, setEmbeds } = useContext(Context);


    const editEmbed = (index, key, value, key2=undefined) => {
        const newEmbeds = [...embeds];
        if(key2) {
            newEmbeds[index][key][key2] = value;
        } else
            newEmbeds[index][key] = value;

        setEmbeds(newEmbeds);
    }
    const removeEmbed = (index) => {
        setEmbeds(embeds.filter((_, i) => i !== index));
    }

    const editFields = (fieldIndex, name, value, inline) => {
        let newEmbed = embed;
        newEmbed.fields[fieldIndex].name = name;
        newEmbed.fields[fieldIndex].value = value;
        newEmbed.fields[fieldIndex].inline = inline;
        editEmbed(index, 'fields', newEmbed.fields);
    }
    const editImages = (imageIndex, url) => {
        let newEmbed = embed;
        newEmbed.images[imageIndex] = url;
        editEmbed(index, 'images', newEmbed.images);
    }
    return (
        <HiddenContent title={`Embed ${index+1}`}>
            <HiddenContent title='Author'>
                <p>Author <span className='smol'><i>{embed.author.name? embed.author.name.length : 0}/256</i></span></p>
                <div className="row">
                    <input type='text' placeholder='Author' value={embed.author.name} onChange={(e) => editEmbed(index, 'author', e.target.value, 'name')} maxLength={256} />
                </div>
                <p>Author Icon URL</p>
                <div className="row">
                    <input type='text' placeholder='Author Icon URL' value={embed.author.icon_url} onChange={(e) => editEmbed(index, 'author', e.target.value, 'icon_url')} />
                </div>
                <p>Author URL</p>
                <div className="row">
                    <input type='text' placeholder='Author URL' value={embed.author.url} onChange={(e) => editEmbed(index, 'author', e.target.value, 'url')} />
                </div>
            </HiddenContent>
            <HiddenContent title='Embed Info'>
                <p>Title <span className='smol'><i>{embed.title.length}/256</i></span></p>
                <div className="row">
                    <input type='text' placeholder='Title' value={embed.title} onChange={(e) => editEmbed(index, 'title', e.target.value)} maxLength={256} />
                </div>
                <p>URL</p>
                <div className="row">
                    <input type='text' placeholder='URL' value={embed.url} onChange={(e) => editEmbed(index, 'url', e.target.value)} />
                </div>
                <p>Description <span className='smol'><i>{embed.description.length}/4096</i></span></p>
                <div className="row">
                    <textarea placeholder='Description' value={embed.desc} onChange={(e) => editEmbed(index, 'description', e.target.value)} maxLength={4096} />
                </div>
                <p>Color</p>
                <div className="row">
                    <input type='text' value={'#'+ (!isNaN(embed.color) ? embed.color.toString(16) : '')} onChange={(e) => editEmbed(index, 'color', parseInt(e.target.value.slice(1), 16))} />
                    <input type='color' value={'#'+ (!isNaN(embed.color) ? embed.color.toString(16) : '')} onChange={(e) => editEmbed(index, 'color', parseInt(e.target.value.slice(1), 16))} />
                </div>
            </HiddenContent>
            <HiddenContent title='Fields'>
                {
                    embed.fields && embed.fields.map((field, fieldIndex) => {
                        return (
                            <HiddenContent title={`Field ${fieldIndex+1}`}>
                                <p>Name  <span className='smol'><i>{field.name.length}/256</i></span></p>
                                <div className="row">
                                    <input type='text' placeholder='Field Name' value={field.name} onChange={(e) => editFields(fieldIndex, e.target.value, field.value, field.inline)} required maxLength={256}/>
                                </div>
                                <p>Value  <span className='smol'><i>{field.value.length}/1024</i></span></p>
                                <div className="row">
                                    <input type='text' placeholder='Field Value' value={field.value} onChange={(e) => editFields(fieldIndex, field.name, e.target.value, field.inline)} required maxLength={1024}/>
                                </div>
                                <div className="row">
                                    <input type='checkbox' checked={field.inline} onChange={(e) => editFields(fieldIndex, field.name, field.value, e.target.checked)} />
                                    <label>Inline</label>
                                </div>
                                <button className="red" onClick={() => editEmbed(index, 'fields', embed.fields.filter((_, i) => i !== fieldIndex))}>Delete Field {fieldIndex + 1}</button>
                            </HiddenContent>
                        )
                    })
                }
                <button onClick={() => editEmbed(index, 'fields', [...embed.fields, {name: '', value: '', inline: false}])}>Add Field</button>
            </HiddenContent>
            <HiddenContent title={'Images ' + embed.images.length + '/4'}>
                {
                    embed.images && embed.images.map((image, imageIndex) => {
                        return (
                            <div>
                                <p>Image {imageIndex+1}</p>
                                <div className="row">
                                    <input type='text' placeholder='Image URL' value={image} onChange={(e) => editImages(imageIndex, e.target.value)} />
                                    <span style={{cursor:'pointer'}} onClick={() => editEmbed(index, 'images', embed.images.filter((_, i) => i !== imageIndex))} >❌</span>
                                </div>
                            </div>
                        )
                    })
                }
                {
                    (!embed.images.length || (embed.images.length < 4 &&
                    embed.url && embed.url.length)) ? <button onClick={() => editEmbed(index, 'images', [...embed.images, ''])}>Add Image</button>
                    : <span className='smol'><strong><i>Add a URL to the embed to add multiple images</i></strong></span>
                }
                
                <p>Thumbnail URL</p>
                <div className="row">
                    <input type='text' placeholder='Thumbnail URL' value={embed.thumbnail.url} onChange={(e) => editEmbed(index, 'thumbnail', e.target.value, 'url')} />
                </div>
            </HiddenContent>
            <HiddenContent title='Footer'>
                <p>Footer Text</p>
                <div className="row">
                    <input type='text' placeholder='Footer Text' value={embed.footer.text} onChange={(e) => editEmbed(index, 'footer', e.target.value, 'text')} />
                </div>
                <p>Footer Icon</p>
                <div className="row">
                    <input type='text' placeholder='Footer Icon' value={embed.footer.icon} onChange={(e) => editEmbed(index, 'footer', e.target.value, 'icon_url')} />
                </div>
                <p>Timestamp <span className="smol">in Timezone UTC+0</span></p>
                <div className="row">
                    <input type='datetime-local' placeholder='Timestamp' value={embed.timestamp} onChange={(e) => editEmbed(index, 'timestamp', e.target.value)} />
                </div>
            </HiddenContent>

            <button className="red" onClick={() => removeEmbed(index)}>Remove Embed {index+1}</button>
        </HiddenContent>
    )
}

export default EmbedForm;