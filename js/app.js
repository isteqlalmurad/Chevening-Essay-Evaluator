document.addEventListener('DOMContentLoaded', function() {
    const _0x5e8a = {
        _k1: "sk-proj-IjbnbvKdX6QNWEeONkMomf5Bbk2JIdI5gnflfZD8iBQ13sd5_Gd",
        _k2: "fUOWYk_T3BlbkFJbR2HjOD6gNlqutM0Mlba0szn9u9cLL1Nuqm9axLl-O6veJ06WvV5pP5MUA",
        get _key() {
            return this._k1 + this._k2;
        }
    };

    let _et = '';
    const _ca = document.getElementById('chatArea');
    const _ui = document.getElementById('userInput');
    const _sb = document.getElementById('submitBtn');

    const _criteria = {
        'leadership': `
            - Quality of leadership examples
            - Impact measurement
            - Personal growth demonstration
            - Future application of leadership skills`,
        'networking': `
            - Network building capabilities
            - Cultural awareness
            - Future networking plans
            - Relationship sustainability`,
        'career': `
            - Career trajectory clarity
            - Goal setting and specificity
            - UK degree relevance
            - Home country impact`,
        'study': `
            - Course selection justification
            - University fit
            - Academic background relevance
            - UK-specific benefits`
    };

    document.querySelectorAll('.essay-type').forEach(_t => {
        _t.addEventListener('click', function() {
            _et = this.dataset.type;
            document.querySelectorAll('.essay-type').forEach(_x => 
                _x.style.border = 'none'
            );
            this.style.border = '2px solid var(--accent-blue)';
            _addMsg(`I'll help you evaluate your ${_et} essay. Please paste your essay in the text area below.`, 'bot');
        });
    });

    const _createAnim = () => {
        const _ld = document.createElement('div');
        _ld.className = 'loading-animation';
        const _dt = document.createElement('div');
        _dt.className = 'dots';
        for(let i = 0; i < 3; i++) {
            const _d = document.createElement('div');
            _d.className = 'dot';
            _dt.appendChild(_d);
        }
        _ld.appendChild(_dt);
        return _ld;
    };

    const _valEt = async (_e, _t) => {
        const _p = `Analyze this essay and determine if it is a ${_t} essay for Chevening Scholarship. 
Reply with only "true" if it matches the type, or "false" if it doesn't match. Essay:
${_e}`;

        const _r = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${_0x5e8a._key}`
            },
            body: JSON.stringify({
                model: "gpt-4",
                messages: [{
                    role: "user",
                    content: _p
                }],
                temperature: 0.1
            })
        });

        if(!_r.ok) throw new Error('Validation failed');
        const _d = await _r.json();
        return _d.choices[0].message.content.toLowerCase().includes('true');
    };

    const _addMsg = (_t, _s) => {
        const _md = document.createElement('div');
        _md.classList.add('message', `${_s}-message`);
        if(_s === 'bot' && _t.includes('Strong Points')) {
            _md.innerHTML = _parseFb(_t);
        } else {
            _md.textContent = _t;
        }
        _ca.appendChild(_md);
        _ca.scrollTop = _ca.scrollHeight;
    };

    const _parseFb = (_t) => {
        _t = _t.replace(/\*\*\*\*/g, '**')
             .replace(/\*\*\s+/g, '**')
             .replace(/\s+\*\*/g, '**');
        
        const _secs = _t.split(/\d\.\s*\*\*/).filter(Boolean);
        let _html = '';
        
        const _sm = _t.match(/Overall score.*?(\d+\.?\d*)/i);
        const _sc = _sm ? parseFloat(_sm[1]) : null;

        const _si = {
            'Strong Points': '💪',
            'Weak Points': '⚠️',
            'Feedback for Improvement': '📝'
        };

        _secs.forEach(_s => {
            const _tm = _s.match(/([^:]*?):/);
            if(_tm) {
                const _ti = _tm[1].replace(/\*\*/g, '').trim();
                const _ic = _si[_ti] || '';
                const _ct = _s.replace(_tm[0], '').trim();
                const _pts = _ct.split('\n').filter(_p => _p.trim());

                _html += `
                    <div class="feedback-section">
                        <div class="feedback-header">${_ic} ${_ti}</div>
                        <ul class="feedback-list">
                            ${_pts.map(_p => `<li>${_p.replace(/^-\s*/, '')}</li>`).join('')}
                        </ul>
                    </div>`;
            }
        });

        if(_sc !== null) {
            const _ds = Number.isInteger(_sc) ? _sc : _sc.toFixed(1);
            _html += `
                <div class="feedback-score">
                    Overall Score: ${_ds}/10
                </div>`;
        }

        return _html;
    };

    const _getAIF = async (_e, _t) => {
        const _p = `Please evaluate this ${_t} essay for a Chevening Scholarship application. Consider the following criteria:
${_criteria[_t]}

Essay to evaluate:
${_e}

Please provide detailed feedback in the following format:
1. **Strong Points**: List 3 strong points of the essay.
2. **Weak Points**: List at least 2 weak points of the essay.
3. **Feedback for Improvement**: Provide suggestions on how to improve the weak points.

Overall score out of 10.`;

        const _r = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${_0x5e8a._key}`
            },
            body: JSON.stringify({
                model: "gpt-4",
                messages: [{
                    role: "user",
                    content: _p
                }],
                temperature: 0.1
            })
        });

        if(!_r.ok) throw new Error('Failed to get AI feedback');
        const _d = await _r.json();
        return _d.choices[0].message.content;
    };

    _sb.addEventListener('click', async function() {
        if(!_et) {
            _addMsg('Please select an essay type first.', 'bot');
            return;
        }

        const _txt = _ui.value.trim();
        if(!_txt) {
            _addMsg('Please enter your essay text.', 'bot');
            return;
        }

        _sb.disabled = true;
        
        try {
            const _la = _createAnim();
            _ca.appendChild(_la);

            const _isValid = await _valEt(_txt, _et);
            
            _ca.removeChild(_la);

            if(!_isValid) {
                _addMsg(`This appears to be a different type of essay than "${_et}". Please check your selection or essay content.`, 'bot');
                _sb.disabled = false;
                _ui.value = '';
                return;
            }

            _addMsg(_txt, 'user');
            _ui.value = '';
            
            const _fla = _createAnim();
            _ca.appendChild(_fla);

            const _fb = await _getAIF(_txt, _et);
            
            _ca.removeChild(_fla);
            _addMsg(_fb, 'bot');

            const _sm = _fb.match(/Overall score.*?(\d+\.?\d*)/i);
            const _sc = _sm ? parseFloat(_sm[1]) : 0;

            const _cg = document.getElementById('dataConsent').checked;
            if(_cg && _sc >= 6) {
                try {
                    const _fs = Number.isInteger(_sc) ? _sc : _sc.toFixed(1);
                    await emailjs.send(
                        'service_4caaf5f',
                        'template_5dhjfx4',
                        {
                            to_email: 'murad@leximos.com',
                            subject: `New ${_et} Essay Submission (Score: ${_fs}/10)`,
                            message: `A new ${_et} essay has been submitted for evaluation.
                            \nScore: ${_fs}/10
                            \nEssay Content:\n${_txt}`
                        }
                    );
                    console.log('Notification email sent successfully');
                } catch(_e) {
                    console.error('Failed to send notification email:', _e);
                }
            }
        } catch(_e) {
            _addMsg('Sorry, there was an error evaluating your essay. Please try again.', 'bot');
            console.error('Error:', _e);
        } finally {
            _sb.disabled = false;
            _ui.value = '';
            _ui.focus();
        }
    });
});