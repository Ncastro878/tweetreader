(function () {
  const BUTTON_ATTR = 'data-tweet-reader-injected';
  let activeBtn = null;
  let threadReading = false;

  // --- Text cleaning ---
  function cleanText(text) {
    // Strip emoji characters
    let cleaned = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}\u{231A}-\u{231B}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2614}-\u{2615}\u{2648}-\u{2653}\u{267F}\u{2693}\u{26A1}\u{26AA}-\u{26AB}\u{26BD}-\u{26BE}\u{26C4}-\u{26C5}\u{26CE}\u{26D4}\u{26EA}\u{26F2}-\u{26F3}\u{26F5}\u{26FA}\u{26FD}\u{2702}\u{2705}\u{2708}-\u{270D}\u{270F}]/gu, '');
    // Strip # from hashtags so "hashtag" isn't spoken
    cleaned = cleaned.replace(/#(\w)/g, '$1');
    // Collapse extra whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    return cleaned;
  }

  // --- Word highlighting ---
  function wrapWords(tweetTextEl) {
    const walker = document.createTreeWalker(tweetTextEl, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    let wordIndex = 0;
    for (const node of textNodes) {
      const parts = node.textContent.split(/(\s+)/);
      if (parts.length <= 1 && !parts[0].trim()) continue;

      const frag = document.createDocumentFragment();
      for (const part of parts) {
        if (part.trim()) {
          const span = document.createElement('span');
          span.textContent = part;
          span.dataset.trWordIdx = wordIndex++;
          frag.appendChild(span);
        } else {
          frag.appendChild(document.createTextNode(part));
        }
      }
      node.parentNode.replaceChild(frag, node);
    }
    return wordIndex; // total word count
  }

  function highlightWord(tweetTextEl, charIndex, text) {
    // Map charIndex to word index
    const prefix = text.substring(0, charIndex);
    const wordIdx = prefix.split(/\s+/).filter(Boolean).length;
    // Clear previous highlights
    tweetTextEl.querySelectorAll('span[data-tr-word-idx]').forEach(s => {
      s.style.backgroundColor = '';
    });
    const span = tweetTextEl.querySelector(`span[data-tr-word-idx="${wordIdx}"]`);
    if (span) {
      span.style.backgroundColor = 'rgba(29, 155, 240, 0.25)';
    }
  }

  function unwrapWords(tweetTextEl) {
    tweetTextEl.querySelectorAll('span[data-tr-word-idx]').forEach(s => {
      s.replaceWith(document.createTextNode(s.textContent));
    });
    tweetTextEl.normalize();
  }

  // --- Core speak function ---
  function speakTweet(tweet, btn, onDone) {
    const tweetTextEl = tweet.querySelector('[data-testid="tweetText"]');
    if (!tweetTextEl) { if (onDone) onDone(); return; }

    const rawText = tweetTextEl.innerText;
    const text = cleanText(rawText);
    if (!text) { if (onDone) onDone(); return; }

    window.speechSynthesis.cancel();

    wrapWords(tweetTextEl);

    const utterance = new SpeechSynthesisUtterance(text);

    if (btn) {
      btn.textContent = '\u23F9';
      btn.title = 'Stop reading';
      btn.style.opacity = '1';
      activeBtn = btn;
    }

    utterance.onboundary = (e) => {
      if (e.name === 'word') {
        highlightWord(tweetTextEl, e.charIndex, text);
      }
    };

    utterance.onend = utterance.onerror = () => {
      unwrapWords(tweetTextEl);
      if (btn) {
        resetButton(btn);
        btn.style.opacity = '0.6';
        activeBtn = null;
      }
      if (onDone) onDone();
    };

    window.speechSynthesis.speak(utterance);
  }

  function resetButton(btn) {
    if (btn.dataset.trRole === 'thread') {
      btn.textContent = '\uD83D\uDCD6';
      btn.title = 'Read thread';
    } else {
      btn.textContent = '\uD83D\uDD0A';
      btn.title = 'Read tweet aloud';
    }
  }

  // --- Read thread ---
  function readThread() {
    if (threadReading) {
      window.speechSynthesis.cancel();
      threadReading = false;
      return;
    }

    const tweets = Array.from(document.querySelectorAll('[data-testid="tweet"]'));
    if (!tweets.length) return;

    threadReading = true;
    let idx = 0;

    function readNext() {
      // Remove highlight from previous tweet
      if (idx > 0) {
        tweets[idx - 1].style.borderLeft = '';
      }

      if (idx >= tweets.length || !threadReading) {
        threadReading = false;
        if (idx > 0) tweets[idx - 1].style.borderLeft = '';
        return;
      }

      const tweet = tweets[idx];
      tweet.style.borderLeft = '3px solid rgb(29, 155, 240)';
      tweet.scrollIntoView({ behavior: 'smooth', block: 'center' });
      idx++;
      speakTweet(tweet, null, readNext);
    }

    readNext();
  }

  // --- Button injection ---
  function injectButtons(tweet) {
    if (tweet.hasAttribute(BUTTON_ATTR)) return;

    const tweetTextEl = tweet.querySelector('[data-testid="tweetText"]');
    if (!tweetTextEl) return;

    const actionBar = tweet.querySelector('[role="group"]');
    if (!actionBar) return;

    tweet.setAttribute(BUTTON_ATTR, 'true');

    const baseStyle = [
      'background: none',
      'border: none',
      'outline: none',
      'cursor: pointer',
      'font-size: 1.1em',
      'padding: 0 8px',
      'opacity: 0.6',
      'transition: opacity 0.15s',
      'vertical-align: middle',
      'line-height: inherit',
    ].join(';');

    // Read single tweet button
    const readBtn = document.createElement('button');
    readBtn.textContent = '\uD83D\uDD0A';
    readBtn.title = 'Read tweet aloud';
    readBtn.dataset.trRole = 'single';
    readBtn.style.cssText = baseStyle;

    readBtn.addEventListener('mouseenter', () => { readBtn.style.opacity = '1'; });
    readBtn.addEventListener('mouseleave', () => { if (activeBtn !== readBtn) readBtn.style.opacity = '0.6'; });

    readBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();

      if (activeBtn === readBtn) {
        window.speechSynthesis.cancel();
        return;
      }

      speakTweet(tweet, readBtn);
    });

    // Read thread button
    const threadBtn = document.createElement('button');
    threadBtn.textContent = '\uD83D\uDCD6';
    threadBtn.title = 'Read thread';
    threadBtn.dataset.trRole = 'thread';
    threadBtn.style.cssText = baseStyle;

    threadBtn.addEventListener('mouseenter', () => { threadBtn.style.opacity = '1'; });
    threadBtn.addEventListener('mouseleave', () => { threadBtn.style.opacity = '0.6'; });

    threadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      readThread();
    });

    actionBar.appendChild(readBtn);
    actionBar.appendChild(threadBtn);
  }

  // --- Keyboard shortcut: Alt+S ---
  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.key.toLowerCase() === 's') {
      e.preventDefault();

      // Find the tweet currently under the cursor via :hover
      const hovered = document.querySelectorAll('[data-testid="tweet"]:hover');
      let tweet = hovered.length ? hovered[hovered.length - 1] : null;

      // Fallback: find tweet closest to viewport center
      if (!tweet) {
        const tweets = document.querySelectorAll('[data-testid="tweet"]');
        const centerY = window.innerHeight / 2;
        let bestDist = Infinity;
        for (const t of tweets) {
          const rect = t.getBoundingClientRect();
          const mid = (rect.top + rect.bottom) / 2;
          const dist = Math.abs(mid - centerY);
          if (dist < bestDist) {
            bestDist = dist;
            tweet = t;
          }
        }
      }

      if (tweet) {
        speakTweet(tweet, tweet.querySelector('button[data-tr-role="single"]'));
      }
    }
  });

  // --- Process tweets ---
  function processTweets(root) {
    const tweets = (root instanceof Element && root.matches('[data-testid="tweet"]'))
      ? [root]
      : Array.from(root.querySelectorAll('[data-testid="tweet"]'));

    for (const tweet of tweets) {
      injectButtons(tweet);
    }
  }

  processTweets(document.body);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        processTweets(node);
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
