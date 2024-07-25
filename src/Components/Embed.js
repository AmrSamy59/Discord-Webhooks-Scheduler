import './Embed.css';
import Markdown from 'react-markdown'


const Embed = ({embed}) => {
    let lastCol = 13;
    return (
        <div className="embed" style={embed.color ? {
            borderColor: '#'+ embed.color.toString(16)
        } : {}}>
            <div className="author">
                {
                    embed.author.icon_url &&
                    <img src={embed.author.icon_url} alt="Author Icon" />
                }
                {
                    embed.author.url ? <a href={embed.author.url} className="author_url">{embed.author.name}</a>
                        : <span className="author_url">{embed.author.name}</span>
                }
            </div>
            {
                embed.url ? <a href={embed.url} className="embedTitle">{embed.title}</a>
                    : <span className="embedTitle">{embed.title}</span>
            }
            <div className='embedDesc'><Markdown>{ embed.description }</Markdown></div>
            <div className='embedFields'>
            {
                embed.fields && embed.fields.map((field, index) => {
                    if (field.inline) {
                        if (lastCol + 4 > 9) {
                            lastCol = 1;
                        } else {
                            lastCol += 4;
                        }
                        return (
                            <div className="field inline" key={index} style={{gridColumn: `${lastCol} / ${lastCol+4}`}}>
                                <span className="fieldName"><Markdown>{field.name}</Markdown></span>
                                <span className="fieldValue"><Markdown>{field.value}</Markdown></span>
                            </div>
                        )
                    }
                    lastCol = 13;
                    return (
                        <div className="field" key={index}>
                            <span className="fieldName">{field.name}</span>
                            <span className="fieldValue">{field.value}</span>
                        </div>
                    )
                })
            }
            </div>

            {
                embed.images.length ? <div className='embedImages'>
                       { embed.images.map((image, index) => {
                        return (
                            <div className='embedImage'>
                                <img src={image} alt='img' key={index} />
                            </div>
                        )
                    })
                    }
                </div> : ""
            }
            <div className='embedFooter'>
                {
                    embed.footer.icon_url &&
                    <img src={embed.footer.icon_url} alt="Footer Icon" />
                }
                {
                    embed.footer.text &&
                    <span>{embed.footer.text}</span>
                }
                {
                    (embed.timestamp && embed.footer.text ) &&
                    <span> • </span>
                
                }
                {
                    embed.timestamp &&
                    <span>{(new Date(embed.timestamp)).toLocaleString()}</span>
                }
            </div>
            
                {
                    embed.thumbnail.url && 
                    <div className='embedAuthorIcon'>
                        <img src={embed.thumbnail.url} alt="Thumbnail" />
                    </div>
                }
            
        </div>
    )
}

export default Embed;