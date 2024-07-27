import Log from './Log';
import './Logs.css';
import { useContext } from 'react';
import { Context } from '../App';


const LogsSection = () => {
    const { webhooks } = useContext(Context);

   

    return (
        <div>
            <h2>Logs</h2>
            <div id="logs">
                {
                   webhooks.map((webhook, index) => {
                    //console.log(webhook);
                        return (
                            <>
                            <Log log={webhook} key={toString(webhook.time) + webhook.id}/>
                            </>
                        )
                    })
                }
            </div>
        </div>
    );
}

export default LogsSection;