import { useState } from 'react';

const HiddenContent = ({ title, children }) => {
    const [isVisible, setIsVisible] = useState(false);
    const showItems = (e) => {
        if(isVisible)
            e.currentTarget.firstChild.classList.remove('rotate');
        else
            e.currentTarget.firstChild.classList.add('rotate');
        setIsVisible(!isVisible);
    }
    return (
        <div>
            <div className='hiddenContent' onClick={showItems}><svg className='arrow' width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 10L8 6L4 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg><span>{title}</span></div>
            <div className={'hiddenContentItems ' + (!isVisible && 'hidden')}>
                {children}
            </div>
        </div>
    );
}

export default HiddenContent;