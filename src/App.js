import './App.css';
import MainSection from './Components/MainSection';
import PreviewSection from './Components/PreviewSection';
import LogsSection from './Components/LogsSection';
import { createContext, useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { getWebhooksForUser } from './db';
import DiscordAuthPage from './Components/AuthPage';
import { API_URL } from './config';


export const Context = createContext(null);
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(API_URL + '/me', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          //console.log(data);
          setUser(data);
        }
        setLoading(false);

      } catch (error) {
        //console.error(error);
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  
  let defaultUser = 'Gat';
  let defaultAvatar = 'https://cdn.discordapp.com/avatars/271026539007574018/15af0dcf2578aef01a5e103457251f51.gif?size=1024';

  const [userName, setUserName] = useState(defaultUser);
  const [avatarURL, setAvatarURL] = useState(defaultAvatar);
  const [content, setContent] = useState('Hi there!');

  const [embeds, setEmbeds] = useState([]);
  const [file, setFile] = useState(undefined);

  const [webhook, setWebhook] = useState('');

  const [webhooks, setWebhooks] = useState([]);
  const [needFetch, setNeedFetch] = useState(0);

  //const userId = 123; // Replace this with the actual user ID

  useEffect(() => {
      const _fetchWebhooks = async () => {
          try {
          const data = await getWebhooksForUser(user.id);
          //console.log(data);
          setWebhooks(data);
          } catch (error) {
          console.error(error);
          }
      };

      if(user) {
        console.log(user)

      _fetchWebhooks();
      }
  }, [needFetch, user]);

  const fetchWebhooks = () => {
    setNeedFetch(needFetch + 1);
  }

  if (!user) {
    return <DiscordAuthPage loading={loading} />;
  }
  return (
    <div className="App">
      <Context.Provider value={{user, userName, setUserName, avatarURL, 
        setAvatarURL, content, setContent, embeds, setEmbeds, 
        file, setFile, defaultAvatar, defaultUser, webhooks, setWebhooks, fetchWebhooks, webhook, setWebhook}}>
          <Toaster
            position="top-center"
            reverseOrder={false}
          />
        <section id='main'>
          <MainSection />
        </section>
        <section id='preview'>
          <PreviewSection />
        </section>
        <section id='logs'>
          <LogsSection />
        </section>
      </Context.Provider>
    </div>
  );
}

export default App;
