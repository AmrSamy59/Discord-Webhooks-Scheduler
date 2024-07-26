import './App.css';
import MainSection from './Components/MainSection';
import PreviewSection from './Components/PreviewSection';
import LogsSection from './Components/LogsSection';
import { createContext, useState } from 'react';
import { Toaster } from 'react-hot-toast';

export const Context = createContext(null);
function App() {
  let defaultUser = 'Gat';
  let defaultAvatar = 'https://cdn.discordapp.com/avatars/271026539007574018/15af0dcf2578aef01a5e103457251f51.gif?size=1024';

  const [userName, setUserName] = useState(defaultUser);
  const [avatarURL, setAvatarURL] = useState(defaultAvatar);
  const [content, setContent] = useState('Hi there!');

  const [embeds, setEmbeds] = useState([]);
  const [file, setFile] = useState(undefined);

  
  return (
    <div className="App">
      <Context.Provider value={{userName, setUserName, avatarURL, 
        setAvatarURL, content, setContent, embeds, setEmbeds, 
        file, setFile, defaultAvatar, defaultUser}}>
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
