const phrases = [ 
    "🔥 Get good, get [**Khanware**](https://github.com/Niximkk/khanware/)!",
    "🤍 Made by [**@im.nix**](https://e-z.bio/sounix).",
    "☄️ By [**Niximkk/khanware**](https://github.com/Niximkk/khanware/).",
    "🌟 Star the project on [GitHub](https://github.com/Niximkk/khanware/)!"
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

            let item = null;
            if (data?.data) {
                for (const key in data.data) {
                    if (data.data[key]?.item) {
                        item = data.data[key].item;
                        break;
                    }
                }
            }
            
            if (!item?.itemData) return res;
            
            let itemData = JSON.parse(item.itemData);
            const answers = [];
            
            for (const [key, w] of Object.entries(itemData.question.widgets)) {
                if ((w.type === 'radio') && w.options?.choices) {
                    const choices = w.options.choices.map((c, i) => ({ ...c, id: c.id || `radio-choice-${i}` }));
                    const correctChoices = choices.filter(c => c.correct);
                    
                    if (correctChoices.length > 0) {
                        answers.push({ 
                            type: 'radio', 
                            choiceIds: correctChoices.map(c => c.id),
                            multipleSelect: w.options.multipleSelect || false,
                            widgetKey: key 
                        });
                    }
                }
                else if ((w.type === 'dropdown') && w.options?.choices) {
                    const correct = w.options.choices.find(c => c.correct);
                    if (correct) {
                        answers.push({ 
                            type: 'dropdown', 
                            value: correct.content, 
                            widgetKey: key 
                        });
                    }
                }
                else if ((w.type === 'numeric-input') && w.options?.answers) {
                    const correct = w.options.answers.find(a => a.status === 'correct');
                    if (correct && correct.value !== null) {
                        let val = correct.value;
                        
                        const forms = correct.answerForms || [];
                        if (forms.includes('proper') || forms.includes('improper') || forms.includes('mixed')) {
                            val = toFraction(val);
                        } else {
                            val = String(val);
                        }
                        
                        answers.push({ 
                            type: 'numeric',
                            value: val, 
                            widgetKey: key 
                        });
                    }
                }
                else if ((w.type === 'input-number') && w.options?.value !== undefined) {
                    answers.push({ 
                        type: 'numeric',
                        value: String(w.options.value), 
                        widgetKey: key 
                    });
                }
                else if ((w.type === 'expression') && w.options?.answerForms) {
                    const correct = w.options.answerForms.find(f => f.considered === 'correct' || f.form === true);
                    if (correct) {
                        answers.push({ 
                            type: 'expression', 
                            value: correct.value, 
                            widgetKey: key 
                        });
                    }
                }
                else if ((w.type === 'grapher') && w.options?.correct) {
                    const c = w.options.correct;
                    if (c.type && c.coords) {
                        answers.push({ 
                            type: 'grapher', 
                            graphType: c.type, 
                            coords: c.coords, 
                            asymptote: c.asymptote || null, 
                            widgetKey: key 
                        });
                    }
                }
                else if ((w.type === 'interactive-graph') && w.options?.correct) {
                    const c = w.options.correct;
                    if (c.coords) {
                        answers.push({ 
                            type: 'interactive-graph', 
                            coords: c.coords,
                            match: c.match || 'congruent',
                            graphType: c.type,
                            showSides: c.showSides,
                            snapTo: c.snapTo,
                            widgetKey: key 
                        });
                    }
                }
                else if ((w.type === 'categorizer') && w.options?.values) {
                    answers.push({ 
                        type: 'categorizer', 
                        values: w.options.values,
                        widgetKey: key 
                    });
                }
                else if ((w.type === 'matcher') && w.options?.left && w.options?.right) {
                    answers.push({ 
                        type: 'matcher', 
                        left: w.options.left,
                        right: w.options.right,
                        widgetKey: key 
                    });
                }
                else if ((w.type === 'orderer') && w.options?.correctOptions) {
                    answers.push({ 
                        type: 'orderer', 
                        correctOptions: w.options.correctOptions,
                        widgetKey: key 
                    });
                }
                else if ((w.type === 'sorter') && w.options?.correct) {
                    answers.push({ 
                        type: 'sorter', 
                        correct: w.options.correct,
                        widgetKey: key 
                    });
                }
                else if ((w.type === 'number-line') && w.options?.correctX !== null) {
                    answers.push({ 
                        type: 'number-line', 
                        correctX: w.options.correctX,
                        correctRel: w.options.correctRel || 'eq',
                        widgetKey: key 
                    });
                }
                else if ((w.type === 'plotter') && w.options?.correct) {
                    answers.push({ 
                        type: 'plotter', 
                        correct: w.options.correct,
                        plotType: w.options.type,
                        widgetKey: key 
                    });
                }
                else if ((w.type === 'matrix') && w.options?.answers) {
                    answers.push({ 
                        type: 'matrix', 
                        answers: w.options.answers,
                        widgetKey: key 
                    });
                }
                else if ((w.type === 'table') && w.options?.answers) {
                    answers.push({ 
                        type: 'table', 
                        answers: w.options.answers,
                        widgetKey: key 
                    });
                }
            }
            
            if (answers.length > 0) {
                correctAnswers.set(item.id, answers);
                sendToast(`📦 ${answers.length} resposta(s) capturada(s).`, 750);
            }
            
            if (itemData.question.content?.[0] === itemData.question.content[0].toUpperCase()) {
                itemData.answerArea = { calculator: false, chi2Table: false, periodicTable: false, tTable: false, zTable: false };
                itemData.question.content = phrases[Math.floor(Math.random() * phrases.length)] + "\n\n**Onde você deve obter seus scripts?**" + `[[☃ radio 1]]`+ `\n\n**💎 Quer ter a sua mensagem lida para TODOS utilizando o Khanware?** \nFaça uma [Donate Aqui](https://livepix.gg/nixyy)!` ;
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
                if (modified.data) {
                    for (const key in modified.data) {
                        if (modified.data[key]?.item?.itemData) {
                            modified.data[key].item.itemData = JSON.stringify(itemData);
                            break;
                        }
                    }
                }
                
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
                        const selectedIds = a.multipleSelect ? a.choiceIds : [a.choiceIds[0]];
                        content.push({ selectedChoiceIds: selectedIds });
                        userInput[a.widgetKey] = { selectedChoiceIds: selectedIds };
                    }
                    else if (a.type === 'dropdown') {
                        content.push({ value: a.value });
                        userInput[a.widgetKey] = { value: a.value };
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
                    else if (a.type === 'interactive-graph') {
                        const graph = { 
                            coords: a.coords,
                            match: a.match,
                            type: a.graphType,
                            showSides: a.showSides,
                            snapTo: a.snapTo
                        };
                        content.push(graph);
                        userInput[a.widgetKey] = graph;
                        if (state?.[a.widgetKey]) state[a.widgetKey].coords = a.coords;
                    }
                    else if (a.type === 'categorizer') {
                        content.push({ values: a.values });
                        userInput[a.widgetKey] = { values: a.values };
                    }
                    else if (a.type === 'matcher') {
                        const pairs = a.left.map((_, i) => [i, i]);
                        content.push({ pairs });
                        userInput[a.widgetKey] = { pairs };
                    }
                    else if (a.type === 'orderer') {
                        content.push({ options: a.correctOptions });
                        userInput[a.widgetKey] = { options: a.correctOptions };
                    }
                    else if (a.type === 'sorter') {
                        content.push({ correct: a.correct });
                        userInput[a.widgetKey] = { correct: a.correct };
                    }
                    else if (a.type === 'number-line') {
                        content.push({ x: a.correctX, rel: a.correctRel });
                        userInput[a.widgetKey] = { x: a.correctX, rel: a.correctRel };
                    }
                    else if (a.type === 'plotter') {
                        content.push({ values: a.correct });
                        userInput[a.widgetKey] = { values: a.correct };
                    }
                    else if (a.type === 'matrix') {
                        content.push({ answers: a.answers });
                        userInput[a.widgetKey] = { answers: a.answers };
                    }
                    else if (a.type === 'table') {
                        content.push({ answers: a.answers });
                        userInput[a.widgetKey] = { answers: a.answers };
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