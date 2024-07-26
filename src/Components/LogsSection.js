import Log from './Log';
import './Logs.css';

const LogsSection = () => {
    const messages = [
        {title: 'Webhook Sent', timestamp: new Date().toLocaleString(), message: {content: 'Webhook sent successfully', embeds: [], files: []}},
        {title: 'Webhook Sent', timestamp: new Date().toLocaleString(), message: {content: 'Webhook sent successfully', embeds: [], files: []}},
        {title: 'Webhook Sent', timestamp: new Date().toLocaleString(), message: {content: 'Webhook sent successfully', embeds: [], files: []}},
        {title: 'Webhook Sent', timestamp: new Date().toLocaleString(), message: {content: 'Webhook sent successfully', embeds: [], files: []}},
        {title: 'Webhook Sent', timestamp: new Date().toLocaleString(), message: {content: 'Webhook sent successfully', embeds: [], files: []}},
        {title: 'Webhook Sent', timestamp: new Date().toLocaleString(), message: {content: 'Webhook sent successfully', embeds: [], files: []}},
        {title: 'Webhook Sent', timestamp: new Date().toLocaleString(), message: {content: 'Webhook sent successfully', embeds: [], files: []}},
        {title: 'Webhook Sent', timestamp: new Date().toLocaleString(), message: {content: 'Webhook sent successfully', embeds: [], files: []}},
        {title: 'Webhook Sent', timestamp: new Date().toLocaleString(), message: {content: 'Webhook sent successfully', embeds: [], files: []}},
        {title: 'Webhook Sent', timestamp: new Date().toLocaleString(), message: {content: 'Webhook sent successfully', embeds: [], files: []}},
    ]
    return (
        <div>
            <h2>Logs</h2>
            <div id="logs">
                {
                    messages.map((message, index) => {
                        return (
                            <Log log={message} key={index} />
                        )
                    })
                }
            </div>
        </div>
    );
}

export default LogsSection;