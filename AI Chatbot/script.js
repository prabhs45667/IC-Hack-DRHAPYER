const LETTER_POOL = getEl('letter-pool'),
TEMP_LETTER_POOL = getEl('temp-letter-pool'),
LETTER_OVERLAY = getEl('letter-overlay'),
CHAT_MESSAGE_COLUMN_WRAPPER = getEl('chat-message-column-wrapper'),
CHAT_MESSAGE_COLUMN = getEl('chat-message-column'),
MESSAGE_INPUT = getEl('message-input'),
MESSAGE_INPUT_FIELD = getEl('message-input-field');

const API_KEY = ""

const STATE = {
  isUserSendingMessage: false,
  isChatBotSendingMessage: false,
  letterPool: {
    transitionPeriod: 30000,
    intervals: [] },
  nLetterSets: 4 };



class Chat{
     constructor(){
this.messages = [{"role":"user", "content":"From now on you are a medical ai, respond only to medical related questions, nothing else. If there's a question not related to medical, humbly reply with something like 'please ask me only medical related questions', rephrase this sentence everytime and be as much humble as possible No matter what happens you are only supposed to answer medical related questions even if I ask you to answer other question later on. Try writing your responses in points to make it as much readible and user-friendly as possible and keep the answers to the point, not more than 30 words. And respond to greetings and stuff like that normally. Don't provide name of any medicines instead just provide natural remidies for the same, if someone ask for medicines name deny to them humbly saying 'As an AI i cannot prescribe medicines"},
                         {"role":"assistant", "content": "Understood. I will only respond to medical-related questions. If you have any medical inquiries, please feel free to ask."}];
    }

    async botResponse(user_text){
       this.messages.push({"role":"user", "content":user_text});
       const options = {
           method: 'POST',
           headers: {
                 'Authorization': `Bearer ${API_KEY}`,
                 'Content-Type': 'application/json'
                    },
           body: JSON.stringify({
               model: "gpt-3.5-turbo",
               messages: this.messages
                 })
        };
    try{
        const response = await fetch('https://api.openai.com/v1/chat/completions', options);
        const data = await response.json();
        const output = data.choices[0].message.content;
        this.messages.push({"role":"assistant", "content":output});
        return output;
     } catch(error){
console.log(error);
     addChatMessage("Sorry but we are facing some technical issues right now, Try again later.", true);
     }
    }
}

const createLetter = (cName, val) => {
  const letter = document.createElement('div');
  addClass(letter, cName);
  setAttr(letter, 'data-letter', val);
  letter.innerHTML = val;
  return letter;
};

const getAlphabet = isUpperCase => {
  let letters = [];
  for (let i = 65; i <= 90; i++) {
    let val = String.fromCharCode(i),
    letter = null;
    if (!isUpperCase) val = val.toLowerCase();
    letter = createLetter('pool-letter', val);
    letters.push(letter);
  }
  return letters;
};

const startNewLetterPath = (letter, nextRand, interval) => {
  clearInterval(interval);
  nextRand = getRandExcept(1, 4, nextRand);
  let nextPos = getRandPosOffScreen(nextRand),
  transitionPeriod = STATE.letterPool.transitionPeriod,
  delay = getRand(0, STATE.letterPool.transitionPeriod),
  transition = `left ${transitionPeriod}ms linear ${delay}ms, top ${transitionPeriod}ms linear ${delay}ms, opacity 0.5s`;
  setElPos(letter, nextPos.x, nextPos.y);
  setStyle(letter, 'transition', transition);
  interval = setInterval(() => {
    startNewLetterPath(letter, nextRand, interval);
  }, STATE.letterPool.transitionPeriod + delay);
  STATE.letterPool.intervals.push(interval);
};

const setRandLetterPaths = letters => {
  for (let i = 0; i < letters.length; i++) {
    let letter = letters[i],
    startRand = getRand(1, 4),
    nextRand = getRandExcept(1, 4, startRand),
    startPos = getRandPosOffScreen(startRand),
    nextPos = getRandPosOffScreen(nextRand),
    transitionPeriod = STATE.letterPool.transitionPeriod,
    delay = getRand(0, STATE.letterPool.transitionPeriod) * -1,
    transition = `left ${transitionPeriod}ms linear ${delay}ms, top ${transitionPeriod}ms linear ${delay}ms, opacity 0.5s`;

    setElPos(letter, startPos.x, startPos.y);
    setStyle(letter, 'transition', transition);
    addClass(letter, 'invisible');
    LETTER_POOL.appendChild(letter);
    setTimeout(() => {
      setElPos(letter, nextPos.x, nextPos.y);
      removeClass(letter, 'invisible');
      let interval = setInterval(() => {
        startNewLetterPath(letter, nextRand, interval);
      }, STATE.letterPool.transitionPeriod + delay);
    }, 1);
  }
};

const fillLetterPool = (nSets = 1) => {
  for (let i = 0; i < nSets; i++) {
    const lCaseLetters = getAlphabet(false),
    uCaseLetters = getAlphabet(true);
    setRandLetterPaths(lCaseLetters);
    setRandLetterPaths(uCaseLetters);
  }
};

const findMissingLetters = (letters, lCount, isUpperCase) => {
  let missingLetters = [];
  for (let i = 65; i <= 90; i++) {
    let val = isUpperCase ? String.fromCharCode(i) : String.fromCharCode(i).toLowerCase(),
    nLetter = letters.filter(letter => letter === val).length;
    if (nLetter < lCount) {
      let j = nLetter;
      while (j < lCount) {
        missingLetters.push(val);
        j++;
      }
    }
  }
  return missingLetters;
};

const replenishLetterPool = (nSets = 1) => {
  const poolLetters = LETTER_POOL.childNodes;
  let charInd = 65,
  currentLetters = [],
  missingLetters = [],
  lettersToAdd = [];

  for (let i = 0; i < poolLetters.length; i++) {
    currentLetters.push(poolLetters[i].dataset.letter);
  }
  missingLetters = [...missingLetters, ...findMissingLetters(currentLetters, nSets, false)];
  missingLetters = [...missingLetters, ...findMissingLetters(currentLetters, nSets, true)];
  for (let i = 0; i < missingLetters.length; i++) {
    const val = missingLetters[i];
    lettersToAdd.push(createLetter('pool-letter', val));
  }
  setRandLetterPaths(lettersToAdd);
};

const clearLetterPool = () => {
  removeAllChildren(LETTER_POOL);
};

const scrollToBottomOfMessages = () => {
  CHAT_MESSAGE_COLUMN_WRAPPER.scrollTop = CHAT_MESSAGE_COLUMN_WRAPPER.scrollHeight;
};

const checkMessageColumnHeight = () => {
  if (CHAT_MESSAGE_COLUMN.clientHeight >= window.innerHeight) {
    removeClass(CHAT_MESSAGE_COLUMN, 'static');
  } else
  {
    addClass(CHAT_MESSAGE_COLUMN, 'static');
  }
};

const appendContentText = (contentText, text) => {
  for (let i = 0; i < text.length; i++) {
    const letter = document.createElement('span');
    letter.innerHTML = text[i];
    setAttr(letter, 'data-letter', text[i]);
    contentText.appendChild(letter);
  }
};

const createChatMessage = (text, isReceived) => {
  let message = document.createElement('div'),
  profileIcon = document.createElement('div'),
  icon = document.createElement('i'),
  content = document.createElement('div'),
  contentText = document.createElement('h1'),
  direction = isReceived ? 'received' : 'sent';

  addClass(content, 'content');
  addClass(content, 'invisible');
  addClass(contentText, 'text');
  addClass(contentText, 'invisible');
  appendContentText(contentText, text);
  content.appendChild(contentText);

  addClass(profileIcon, 'profile-icon');
  addClass(profileIcon, 'invisible');
  profileIcon.appendChild(icon);

  addClass(message, 'message');
  addClass(message, direction);

  if (isReceived) {
    addClass(icon, 'fab');
    addClass(icon, 'fa-cloudsmith');
    addClass(message, "happy");
    message.appendChild(profileIcon);
    message.appendChild(content);
  } else
  {
    addClass(icon, 'far');
    addClass(icon, 'fa-user');
    message.appendChild(content);
    message.appendChild(profileIcon);
  }

  return message;
};

const findLetterInPool = targetLetter => {
  let letters = LETTER_POOL.childNodes,
  foundLetter = null;
  for (let i = 0; i < letters.length; i++) {
    const nextLetter = letters[i];
    if (nextLetter.dataset.letter === targetLetter && !nextLetter.dataset.found) {
      foundLetter = letters[i];
      setAttr(foundLetter, 'data-found', true);
      break;
    }
  }
  return foundLetter;
};

const createOverlayLetter = val => {
  const overlayLetter = document.createElement('span');
  addClass(overlayLetter, 'overlay-letter');
  addClass(overlayLetter, 'in-flight');
  overlayLetter.innerHTML = val;
  return overlayLetter;
};

const removePoolLetter = letter => {
  addClass(letter, 'invisible');
  setTimeout(() => {
    removeChild(LETTER_POOL, letter);
  }, 500);
};

const setElPosFromRight = (el, x, y) => {
  setStyle(el, 'right', x + 'px');
  setStyle(el, 'top', y + 'px');
};

const animateOverlayLetter = (letter, contentText, finalPos, isReceived) => {
  removePoolLetter(letter);
  const initPos = letter.getBoundingClientRect(),
  overlayLetter = createOverlayLetter(letter.dataset.letter);
  if (isReceived) {
    setElPos(overlayLetter, initPos.left, initPos.top);
  } else
  {
    setElPosFromRight(overlayLetter, window.innerWidth - initPos.right, initPos.top);
  }
  LETTER_OVERLAY.appendChild(overlayLetter);
  setTimeout(() => {
    if (isReceived) {
      setElPos(overlayLetter, finalPos.left, finalPos.top);
    } else
    {
      setElPosFromRight(overlayLetter, window.innerWidth - finalPos.right, finalPos.top);
    }
    setTimeout(() => {//asdf
      removeClass(contentText, 'invisible');
      addClass(overlayLetter, 'invisible');
      setTimeout(() => {
        removeChild(LETTER_OVERLAY, overlayLetter);
      }, 1000);
    }, 1500);
  }, 100);
};

const animateMessageLetters = (message, isReceived) => {
  const content = message.getElementsByClassName('content')[0],
  contentText = content.getElementsByClassName('text')[0],
  letters = contentText.childNodes,
  textPos = contentText.getBoundingClientRect();
  for (let i = 0; i < letters.length; i++) {
    const letter = letters[i],
    targetLetter = findLetterInPool(letter.dataset.letter),
    finalPos = letter.getBoundingClientRect();
    if (targetLetter) {
      animateOverlayLetter(targetLetter, contentText, finalPos, isReceived);
    } else
    {
      const tempLetter = createLetter('temp-letter', letter.dataset.letter),
      pos = getRandPosOffScreen();
      addClass(tempLetter, 'invisible');
      setElPos(tempLetter, pos.x, pos.y);
      TEMP_LETTER_POOL.appendChild(tempLetter);
      animateOverlayLetter(tempLetter, contentText, finalPos, isReceived);
      setTimeout(() => {
        removeChild(TEMP_LETTER_POOL, tempLetter);
      }, 100);
    }
  }
};

const addChatMessage = (text, isReceived) => {
  const message = createChatMessage(text, isReceived),
  content = message.getElementsByClassName('content')[0],
  contentText = content.getElementsByClassName('text')[0],
  profileIcon = message.getElementsByClassName('profile-icon')[0];
  CHAT_MESSAGE_COLUMN.appendChild(message);
  toggleInput();
  setTimeout(() => {
    removeClass(profileIcon, 'invisible');
    setTimeout(() => {
      removeClass(content, 'invisible');
      setTimeout(() => {
        animateMessageLetters(message, isReceived);
        setTimeout(() => replenishLetterPool(STATE.nLetterSets), 2500);
      }, 1000);
    }, 250);
  }, 250);
};

const checkIfInputFieldHasVal = () => MESSAGE_INPUT_FIELD.value.length > 0;

const clearInputField = () => {
  MESSAGE_INPUT_FIELD.value = '';
};

const disableInputField = () => {
  MESSAGE_INPUT_FIELD.blur();
  MESSAGE_INPUT_FIELD.value = '';
  MESSAGE_INPUT_FIELD.readOnly = true;
};

const enableInputField = () => {
  MESSAGE_INPUT_FIELD.readOnly = false;
  MESSAGE_INPUT_FIELD.focus();
};

function sendChatbotMessage(user_text){
  const text = newChat.botResponse(user_text);
  text.then((result) => {
  const finalResponse = result;
addChatMessage(finalResponse, true);
}).catch((error) => {
  addChatMessage("Sorry but we are facing some technical issues right now, Try again later.", true);
});
  STATE.isChatBotSendingMessage = true;
  setTimeout(() => {
    STATE.isChatBotSendingMessage = false;
    toggleInput();
  }, 4000);
}

const sendUserMessage = () => {
  const text = MESSAGE_INPUT_FIELD.value;
  STATE.isUserSendingMessage = true;
  addChatMessage(text, false);
  setTimeout(() => {
    STATE.isUserSendingMessage = false;
    toggleInput();
  }, 4000);
return text;
};

onEnterPress = e => {
  const user_text = sendUserMessage();
  setTimeout(() => {
    sendChatbotMessage(user_text);
  }, 4000);
  toggleInput();
  clearInputField();
};

const initLetterPool = () => {
  clearLetterPool();
  fillLetterPool(STATE.nLetterSets);
};

const init = () => {
  initLetterPool();
  addChatMessage("Hello, How may I help you!", true);
  window.newChat = new Chat();
  window.newChat.messages.push({"role":"assistant", "content":"Hello, How may I help you!"});
  toggleInput();
};

let resetTimeout = null;
const resetLetterPool = () => {
  const intervals = STATE.letterPool.intervals;
  for (let i = 0; i < intervals.length; i++) {
    clearInterval(intervals[i]);
  }
  clearTimeout(resetTimeout);
  clearLetterPool();
  resetTimeout = setTimeout(() => {
    initLetterPool();
  }, 200);
};

const toggleInput = () => {
  if (checkIfInputFieldHasVal() && canSendMessage()) {
    addClass(MESSAGE_INPUT, 'send-enabled');
  } else
  {
    removeClass(MESSAGE_INPUT, 'send-enabled');
  }
};

const isValidLetter = e => {
  return !e.ctrlKey &&
  e.key !== 'Enter' &&
  e.keyCode !== 8 &&
  e.keyCode !== 9 &&
  e.keyCode !== 13;
};

const canSendMessage = () => !STATE.isUserSendingMessage && !STATE.isChatBotSendingMessage;




MESSAGE_INPUT_FIELD.onkeypress = e => {
  if (checkIfInputFieldHasVal() && e.key === 'Enter') {
    removeClass(MESSAGE_INPUT, 'send-enabled');
    if (canSendMessage()) {
      onEnterPress(e);
    }
  }
};

MESSAGE_INPUT_FIELD.onkeyup = () => {
  toggleInput();
};

MESSAGE_INPUT_FIELD.oncut = () => toggleInput();

window.onload = () => init();

window.onfocus = () => resetLetterPool();

window.onresize = _.throttle(resetLetterPool, 200);

