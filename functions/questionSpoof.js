const phrases = [ 
    "🔥 Get good, get [**Khanware**](https://github.com/Niximkk/khanware/)!",
    "🤍 Made by [**@im.nix**](https://e-z.bio/sounix).",
    "☄️ By [**Niximkk/khanware**](https://github.com/Niximkk/khanware/).",
    "🌟 Star the project on [GitHub](https://github.com/Niximkk/khanware/)!",
    "🦢 Nix é lindo e maravilhoso!",
    "💠 Doe para o dev [**Aqui**](https://pixie.gg/nixyy)!"
];

const originalFetch = window.fetch;
const correctAnswers = new Map();

const toFraction = (d) => { if (d === 0 || d === 1) return String(d); const decimals = (String(d).split('.')[1] || '').length; let num = Math.round(d * Math.pow(10, decimals)), den = Math.pow(10, decimals); const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; }; const div = gcd(Math.abs(num), Math.abs(den)); return den / div === 1 ? String(num / div) : `${num / div}/${den / div}`; };

window.fetch = async function(input, init) {
    const url = input instanceof Request ? input.url : input;
    let body = input instanceof Request ? await input.clone().text() : init?.body;
    
    if (features.questionSpoof && url.includes('getAssessmentItem') && body) {
        const res = await originalFetch.apply(this, arguments);
        const clone = res.clone();
        
        try {
            const data = await clone.json();
            const item = data?.data?.assessmentItem?.item;
            if (!item?.itemData) return res;
            
            let itemData = JSON.parse(item.itemData);
            const answers = [];
            
            for (const [key, w] of Object.entries(itemData.question.widgets)) {
                if (w.type === 'radio' && w.options?.choices) {
                    const choices = w.options.choices.map((c, i) => ({ ...c, id: c.id || `radio-choice-${i}` }));
                    const correct = choices.find(c => c.correct);
                    if (correct) answers.push({ type: 'radio', choiceId: correct.id, widgetKey: key });
                }
                else if (w.type === 'numeric-input' && w.options?.answers) {
                    const correct = w.options.answers.find(a => a.status === 'correct');
                    if (correct) {
                        const val = correct.answerForms?.some(f => f === 'proper' || f === 'improper') 
                            ? toFraction(correct.value) : String(correct.value);
                        answers.push({ type: 'numeric', value: val, widgetKey: key });
                    }
                }
                else if (w.type === 'expression' && w.options?.answerForms) {
                    const correct = w.options.answerForms.find(f => f.considered === 'correct' || f.form === true);
                    if (correct) answers.push({ type: 'expression', value: correct.value, widgetKey: key });
                }
                else if (w.type === 'grapher' && w.options?.correct) {
                    const c = w.options.correct;
                    if (c.type && c.coords) answers.push({ 
                        type: 'grapher', graphType: c.type, coords: c.coords, 
                        asymptote: c.asymptote || null, widgetKey: key 
                    });
                }
            }
            
            if (answers.length > 0) {
                correctAnswers.set(item.id, answers);
                sendToast(`📦 ${answers.length} resposta(s) capturada(s).`, 750);
            }
            
            if (itemData.question.content?.[0] === itemData.question.content[0].toUpperCase()) {
                itemData.answerArea = { calculator: false, chi2Table: false, periodicTable: false, tTable: false, zTable: false };
                itemData.question.content = phrases[Math.floor(Math.random() * phrases.length)] +"\n\n**Onde você deve obter seus scripts?**" + `[[☃ radio 1]]`;
                itemData.question.widgets = {
                    "radio 1": {
                        type: "radio", alignment: "default", static: false, graded: true,
                        options: {
                            choices: [
                                { content: "**I Can Say** e **Platform Destroyer**.", correct: true, id: "correct-choice" },
                                { content: "Qualquer outro kibador **viado**.", correct: false, id: "incorrect-choice" }
                            ],
                            randomize: false, multipleSelect: false, displayCount: null, deselectEnabled: false
                        },
                        version: { major: 1, minor: 0 }
                    }
                };
                
                const modified = { ...data };
                modified.data.assessmentItem.item.itemData = JSON.stringify(itemData);
                sendToast("🔓 Questão exploitada.", 750);
                return new Response(JSON.stringify(modified), { 
                    status: res.status, statusText: res.statusText, headers: res.headers 
                });
            }
        } catch (e) { debug(`🚨 Error @ questionSpoof.js\n${e}`); }
        return res;
    }
    
    if (features.questionSpoof && body?.includes('"operationName":"attemptProblem"')) {
        try {
            let bodyObj = JSON.parse(body);
            const itemId = bodyObj.variables?.input?.assessmentItemId;
            const answers = correctAnswers.get(itemId);
            
            if (answers?.length > 0) {
                const content = [], userInput = {};
                let state = bodyObj.variables.input.attemptState ? JSON.parse(bodyObj.variables.input.attemptState) : null;
                
                answers.forEach(a => {
                    if (a.type === 'radio') {
                        content.push({ selectedChoiceIds: [a.choiceId] });
                        userInput[a.widgetKey] = { selectedChoiceIds: [a.choiceId] };
                    }
                    else if (a.type === 'numeric') {
                        content.push({ currentValue: a.value });
                        userInput[a.widgetKey] = { currentValue: a.value };
                        if (state?.[a.widgetKey]) state[a.widgetKey].currentValue = a.value;
                    }
                    else if (a.type === 'expression') {
                        content.push(a.value);
                        userInput[a.widgetKey] = a.value;
                        if (state?.[a.widgetKey]) state[a.widgetKey].value = a.value;
                    }
                    else if (a.type === 'grapher') {
                        const graph = { type: a.graphType, coords: a.coords, asymptote: a.asymptote };
                        content.push(graph);
                        userInput[a.widgetKey] = graph;
                        if (state?.[a.widgetKey]) state[a.widgetKey].plot = graph;
                    }
                });
                
                bodyObj.variables.input.attemptContent = JSON.stringify([content, []]);
                bodyObj.variables.input.userInput = JSON.stringify(userInput);
                if (state) bodyObj.variables.input.attemptState = JSON.stringify(state);
                
                body = JSON.stringify(bodyObj);
                if (input instanceof Request) input = new Request(input, { body });
                else init.body = body;
                sendToast(`✨ ${answers.length} resposta(s) aplicada(s).`, 750);
            }
        } catch (e) { debug(`🚨 Error @ questionSpoof.js\n${e}`); }
    }
    
    return originalFetch.apply(this, arguments);
};