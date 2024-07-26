const Log = ({ log }) => {
    return (
        <div className="log">
            <div className="log-header">
                <div className="col">
                    <h3>{log.title}</h3>
                    
                </div>
                <p>{log.timestamp}</p>
            </div>
            <div className="log-content">
                <p>{log.message.content.slice(0, 100)}{log.message.content.length > 100 && "..."}</p>
                <span className="smol">{log.message.embeds.length} embeds</span>
                <span className="smol">{log.message.files.length} files</span>
            </div>
        </div>
    );
}

export default Log;