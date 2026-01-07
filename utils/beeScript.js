/* 🐝 I will be used on ../functions/workerBees.js */

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const findAndClickBySelector = selector => { const element = document.querySelector(selector); if (element) element.click(); };

const originalFetch = window.fetch;
const correctAnswers = new Map();

const toFraction = (d) => { if (d === 0 || d === 1) return String(d); const decimals = (String(d).split('.')[1] || '').length; let num = Math.round(d * Math.pow(10, decimals)), den = Math.pow(10, decimals); const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; }; const div = gcd(Math.abs(num), Math.abs(den)); return den / div === 1 ? String(num / div) : `${num / div}/${den / div}`; };
const createEmptyResponse = (bodyObj) => { const emptyBody = JSON.parse(JSON.stringify(bodyObj)); emptyBody.variables.input.attemptContent = "[[]]"; emptyBody.variables.input.userInput = "{}"; return emptyBody; };
const isWidgetUsed = (widgetKey, questionContent, hints) => {
    const widgetPattern = `☃ ${widgetKey.replace(/\s+/g, ' ')}`;
    
    if (questionContent.includes(widgetPattern)) return true;
    // Fucking type 2
    // 2
    if (hints && Array.isArray(hints)) {
        for (const hint of hints) {
            if (hint.content && hint.content.includes(widgetPattern)) return true;
            if (hint.widgets) {
                for (const hintWidget of Object.values(hint.widgets)) {
                    if (hintWidget.options?.content?.includes(widgetPattern)) return true;
                }
            }
        }
    }
    
    return false;
};
const extractAnswers = (itemData) => {
    const answers = [];
    for (const [key, w] of Object.entries(itemData.question.widgets)) {
        if (!isWidgetUsed(key, itemData.question.content, itemData.hints)) { continue; }
        
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
                const correctIndex = w.options.choices.findIndex(c => c.correct);
                answers.push({ 
                    type: 'dropdown', 
                    value: correctIndex + 1,
                    choices: w.options.choices.map(c => c.content),
                    placeholder: w.options.placeholder || '',
                    widgetKey: key 
                });
            }
        }
        else if ((w.type === 'numeric-input') && w.options?.answers) {
            const correct = w.options.answers.find(a => a.status === 'correct');
            if (correct && correct.value !== null && correct.value !== undefined) {
                let val = correct.value;
                const simplify = correct.simplify || 'required';
                const answerForms = correct.answerForms || [];
                
                if (answerForms.includes('proper') || answerForms.includes('improper') || answerForms.includes('mixed')) {
                    val = toFraction(val);
                } else {
                    val = String(val);
                }
                
                answers.push({ 
                    type: 'numeric-input',
                    value: val,
                    simplify: simplify,
                    widgetKey: key 
                });
            }
        }
        else if ((w.type === 'input-number') && w.options?.value !== undefined) {
            let val = w.options.value;
            const simplify = w.options.simplify || 'required';
            
            if (val > 0 && val < 1 && String(val).includes('.')) {
                val = toFraction(val);
            } else {
                val = String(val);
            }
            
            answers.push({ 
                type: 'input-number',
                value: val,
                simplify: simplify,
                answerType: w.options.answerType || 'number',
                widgetKey: key 
            });
        }
        else if ((w.type === 'expression') && w.options?.answerForms) {
            const correct = w.options.answerForms.find(f => f.considered === 'correct' || f.form === true);
            if (correct) {
                answers.push({ 
                    type: 'expression', 
                    value: correct.value,
                    buttonSets: w.options.buttonSets || ['basic'],
                    functions: w.options.functions || ['f', 'g', 'h'],
                    times: w.options.times || false,
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
                layout: w.options.layout || "horizontal",
                padding: w.options.padding !== undefined ? w.options.padding : true,
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
                plotType: w.options.type || 'bar',
                categories: w.options.categories || [],
                labels: w.options.labels || [],
                maxY: w.options.maxY || 24,
                scaleY: w.options.scaleY || 1,
                snapsPerLine: w.options.snapsPerLine || 1,
                labelInterval: w.options.labelInterval || 1,
                starting: w.options.starting || [],
                picUrl: w.options.picUrl || null,
                widgetKey: key 
            });
        }
        else if ((w.type === 'matrix') && w.options?.answers) {
            answers.push({ 
                type: 'matrix', 
                answers: w.options.answers,
                widgetKey: key,
                prefix: w.options.prefix || "",
                suffix: w.options.suffix || "",
                matrixBoardSize: w.options.matrixBoardSize || [3, 3],
                cursorPosition: w.options.cursorPosition || [0, 0]
            });
        }
        else if ((w.type === 'table') && w.options?.answers) {
            answers.push({ 
                type: 'table', 
                answers: w.options.answers,
                widgetKey: key 
            });
        }
        else if ((w.type === 'label-image') && w.options?.markers) {
            const markers = w.options.markers.map(marker => ({
                label: marker.label,
                answers: marker.answers,
                x: marker.x,
                y: marker.y
            }));
            
            answers.push({ 
                type: 'label-image', 
                markers: markers,
                choices: w.options.choices || [],
                imageUrl: w.options.imageUrl || "",
                imageWidth: w.options.imageWidth || 0,
                imageHeight: w.options.imageHeight || 0,
                imageAlt: w.options.imageAlt || "",
                multipleAnswers: w.options.multipleAnswers || false,
                hideChoicesFromInstructions: w.options.hideChoicesFromInstructions || false,
                widgetKey: key 
            });
        }
    }
    return answers;
};
const applyAnswers = (bodyObj, answers) => {
    const content = [], userInput = {};
    let state = bodyObj.variables.input.attemptState ? JSON.parse(bodyObj.variables.input.attemptState) : {};
    
    const answerKeys = new Set(answers.map(a => a.widgetKey));
    const stateKeys = Object.keys(state);
    
    const hasInvalidWidgets = stateKeys.some(key => !answerKeys.has(key) && key !== 'hint');
    if (hasInvalidWidgets) { state = {}; answers.forEach(a => { state[a.widgetKey] = {}; }); }

    answers.forEach(a => {
        if (a.type === 'radio') {
            const selectedIds = a.multipleSelect ? a.choiceIds : [a.choiceIds[0]];
            content.push({ selectedChoiceIds: selectedIds });
            userInput[a.widgetKey] = { selectedChoiceIds: selectedIds };
        }
        else if (a.type === 'dropdown') {
            content.push({ value: a.value });
            userInput[a.widgetKey] = { value: a.value };
            
            state[a.widgetKey] = {
                placeholder: a.placeholder || '',
                static: false,
                alignment: 'default',
                dependencies: { analytics: {} },
                choices: a.choices || [],
                selected: a.value
            };
        }
        else if (a.type === 'numeric-input') {
            userInput[a.widgetKey] = { currentValue: a.value };
            if (state?.[a.widgetKey]) {
                state[a.widgetKey].currentValue = a.value;
                if (a.simplify) state[a.widgetKey].simplify = a.simplify;
            }
        }
        else if (a.type === 'input-number') {
            content.push({ currentValue: a.value });
            userInput[a.widgetKey] = { currentValue: a.value };
            if (state?.[a.widgetKey]) {
                state[a.widgetKey].currentValue = a.value;
                if (a.simplify) state[a.widgetKey].simplify = a.simplify;
                if (a.answerType) state[a.widgetKey].answerType = a.answerType;
            }
        }
        else if (a.type === 'expression') {
            content.push(a.value);
            userInput[a.widgetKey] = a.value;
            if (state?.[a.widgetKey]) {
                state[a.widgetKey].value = a.value;
            } else if (state) {
                state[a.widgetKey] = {
                    buttonSets: a.buttonSets || ['basic'],
                    functions: a.functions || ['f', 'g', 'h'],
                    times: a.times || false,
                    extraKeys: [],
                    alignment: 'default',
                    static: false,
                    value: a.value,
                    keypadConfiguration: {
                        keypadType: 'EXPRESSION',
                        extraKeys: [],
                        times: a.times || false
                    }
                };
            }
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
            const matcherData = {
                left: a.left,
                right: a.right
            };
            
            content.push(matcherData);
            userInput[a.widgetKey] = matcherData;
            
            if (state?.[a.widgetKey]) {
                state[a.widgetKey].left = a.left;
                state[a.widgetKey].right = a.right;
            }
        }
        else if (a.type === 'orderer') {
            content.push({ options: a.correctOptions });
            userInput[a.widgetKey] = { options: a.correctOptions };
        }
        else if (a.type === 'sorter') {
            content.push({ 
                options: a.correct,
                changed: true 
            });
            
            userInput[a.widgetKey] = { 
                options: a.correct,
                changed: true 
            };
            
            if (state?.[a.widgetKey]) {
                state[a.widgetKey].correct = a.correct;
                state[a.widgetKey].options = a.correct;
                state[a.widgetKey].changed = true;
                state[a.widgetKey].layout = a.layout || "horizontal";
                state[a.widgetKey].padding = a.padding !== undefined ? a.padding : true;
                state[a.widgetKey].alignment = "default";
                state[a.widgetKey].static = false;
                state[a.widgetKey].dependencies = { analytics: {} };
            }
        }
        else if (a.type === 'number-line') {
            let numDivisions = 1;
            if (state?.[a.widgetKey]?.numDivisions) {
                numDivisions = state[a.widgetKey].numDivisions;
            }
            
            const numLinePosition = a.correctX;
            
            content.push({ 
                numDivisions: numDivisions,
                numLinePosition: numLinePosition,
                rel: a.correctRel 
            });
            
            userInput[a.widgetKey] = { 
                numDivisions: numDivisions,
                numLinePosition: numLinePosition,
                rel: a.correctRel 
            };
            
            if (state?.[a.widgetKey]) {
                state[a.widgetKey].numLinePosition = numLinePosition;
                state[a.widgetKey].rel = a.correctRel;
            }
        }
        else if (a.type === 'plotter') {
            content.push(a.correct);
            userInput[a.widgetKey] = a.correct;
            
            if (state?.[a.widgetKey]) {
                state[a.widgetKey].values = a.correct;
                state[a.widgetKey].correct = [1];
                state[a.widgetKey].type = a.plotType;
                state[a.widgetKey].categories = a.categories;
                state[a.widgetKey].labels = a.labels;
                state[a.widgetKey].maxY = a.maxY;
                state[a.widgetKey].scaleY = a.scaleY;
                state[a.widgetKey].snapsPerLine = a.snapsPerLine;
                state[a.widgetKey].labelInterval = a.labelInterval;
                state[a.widgetKey].starting = a.starting;
                state[a.widgetKey].picUrl = a.picUrl;
                state[a.widgetKey].picSize = 30;
                state[a.widgetKey].picBoxHeight = 36;
                state[a.widgetKey].plotDimensions = [380, 300];
                state[a.widgetKey].alignment = "default";
                state[a.widgetKey].static = false;
                state[a.widgetKey].dependencies = { analytics: {} };
            }
        }
        else if (a.type === 'matrix') {
            const stringAnswers = a.answers.map(row => row.map(val => String(val)));
            
            content.push({ answers: stringAnswers });
            userInput[a.widgetKey] = { answers: stringAnswers };
            
            if (state?.[a.widgetKey]) {
                state[a.widgetKey].answers = stringAnswers;
                state[a.widgetKey].cursorPosition = a.cursorPosition || [0, 0];
                state[a.widgetKey].matrixBoardSize = a.matrixBoardSize || [3, 3];
                state[a.widgetKey].prefix = a.prefix || "";
                state[a.widgetKey].suffix = a.suffix || "";
                state[a.widgetKey].alignment = "default";
                state[a.widgetKey].dependencies = { analytics: {} };
                state[a.widgetKey].static = false;
            }
        }
        else if (a.type === 'table') {
            content.push({ answers: a.answers });
            userInput[a.widgetKey] = { answers: a.answers };
        }
        else if (a.type === 'label-image') {
            const markersWithAnswers = a.markers.map(marker => ({
                label: marker.label,
                selected: marker.answers
            }));
            
            content.push(null);
            content.push({ markers: markersWithAnswers });
            
            userInput[a.widgetKey] = { markers: markersWithAnswers };
            
            if (state?.[a.widgetKey]) {
                state[a.widgetKey].markers = a.markers.map(marker => ({
                    label: marker.label,
                    x: marker.x,
                    y: marker.y,
                    selected: marker.answers
                }));
                state[a.widgetKey].choices = a.choices;
                state[a.widgetKey].imageUrl = a.imageUrl;
                state[a.widgetKey].imageWidth = a.imageWidth;
                state[a.widgetKey].imageHeight = a.imageHeight;
                state[a.widgetKey].imageAlt = a.imageAlt;
                state[a.widgetKey].multipleAnswers = a.multipleAnswers;
                state[a.widgetKey].hideChoicesFromInstructions = a.hideChoicesFromInstructions;
                state[a.widgetKey].static = false;
                state[a.widgetKey].alignment = "default";
            }
        }
    });

    const numericInputs = answers.filter(a => a.type === 'numeric-input');
    if (numericInputs.length > 0) {
        if (content.length === 0) { numericInputs.forEach(a => { content.push({ currentValue: a.value }); });
        } else { numericInputs.forEach(a => { content.push({ currentValue: a.value }); }); }
    }
    
    bodyObj.variables.input.attemptContent = JSON.stringify([content, []]);
    bodyObj.variables.input.userInput = JSON.stringify(userInput);
    if (state) bodyObj.variables.input.attemptState = JSON.stringify(state);
    
    return bodyObj;
};
const modifyItemData = (itemData) => {
    if (itemData.question.content?.[0] === itemData.question.content[0].toUpperCase()) {
        itemData.answerArea = { calculator: false, chi2Table: false, periodicTable: false, tTable: false, zTable: false };
        itemData.question.content = "Q?[[☃ radio 1]]";
        itemData.question.widgets = {
           "radio 1": {
               type: "radio", alignment: "default", static: false, graded: true,
               options: {
                   choices: [
                       { content: "A", correct: true, id: "correct-choice" },
                       { content: "B", correct: false, id: "incorrect-choice" }
                   ],
                   randomize: false, multipleSelect: false, displayCount: null, deselectEnabled: false
               },
               version: { major: 1, minor: 0 }
           }
        };
        
        return true;
    }
    return false;
};


window.fetch = async function(input, init) {
    const url = input instanceof Request ? input.url : input;
    let body = input instanceof Request ? await input.clone().text() : init?.body;
    
    if (url.includes('getAssessmentItem') && body) {
        const res = await originalFetch.apply(this, arguments);
        const clone = res.clone();
        try {
            const data = await clone.json();
            let item = null;
            
            if (data?.data) { for (const key in data.data) { if (data.data[key]?.item) { item = data.data[key].item; break; } } }
            
            if (!item?.itemDataAnswerless) return res;
            
            let itemData = JSON.parse(item.itemDataAnswerless);
            
            if (modifyItemData(itemData)) {
                const modified = { ...data };
                if (modified.data) {
                    for (const key in modified.data) {
                        if (modified.data[key]?.item?.itemDataAnswerless) {
                            modified.data[key].item.itemDataAnswerless = JSON.stringify(itemData);
                            break;
                        }
                    }
                }
                
                return new Response(JSON.stringify(modified), { 
                    status: res.status, 
                    statusText: res.statusText, 
                    headers: res.headers 
                });
            }
        } catch (e) { }
        return res;
    }
    
    if (body?.includes('"operationName":"attemptProblem"')) {
        try {
            let bodyObj = JSON.parse(body);
            const itemId = bodyObj.variables?.input?.assessmentItemId;
                        
            const emptyBody = createEmptyResponse(bodyObj);
            const emptyBodyStr = JSON.stringify(emptyBody);
            
            let emptyInput;
            if (input instanceof Request) { emptyInput = new Request(input, { body: emptyBodyStr });
            } else { emptyInput = input; init = { ...init, body: emptyBodyStr }; }
            
            const firstAttempt = await originalFetch.apply(this, [emptyInput, init]);
            const clone = firstAttempt.clone();
            
            try {
                const responseData = await clone.json();
                const itemData = responseData?.data?.attemptProblem?.result?.itemData;
                
                if (itemData) {
                    const parsedItemData = JSON.parse(itemData);
                    answers = extractAnswers(parsedItemData);
                    
                    if (answers.length > 0) {
                        correctAnswers.set(itemId, answers);
                        
                        bodyObj = applyAnswers(bodyObj, answers);
                        body = JSON.stringify(bodyObj);
                        
                        if (input instanceof Request) {
                            input = new Request(url, { 
                                method: 'POST',
                                headers: input.headers,
                                body: body
                            });
                        } else { init.body = body; }
                        
                        const secondAttempt = await originalFetch.apply(this, [input, init]);
                        const responseClone = secondAttempt.clone();
                        
                        try {
                            const finalResponse = await responseClone.json();
                            
                            if (finalResponse?.data?.attemptProblem?.result?.itemData) {
                                const responseItemData = JSON.parse(finalResponse.data.attemptProblem.result.itemData);
                                
                                if (modifyItemData(responseItemData)) {
                                    finalResponse.data.attemptProblem.result.itemData = JSON.stringify(responseItemData);
                                    
                                    return new Response(JSON.stringify(finalResponse), {
                                        status: secondAttempt.status,
                                        statusText: secondAttempt.statusText,
                                        headers: secondAttempt.headers
                                    });
                                }
                            }
                        } catch (e) { }
                        return secondAttempt;
                    }
                }
            } catch (e) { }
            
            return firstAttempt;
        } catch (e) { }
    }
    
    return originalFetch.apply(this, arguments);
};

const selectors = [
    '.perseus_hm3uu-sq',
    '[data-testid="exercise-check-answer"]', 
    '[data-testid="exercise-next-question"]', 
    '._1wi2tma4'
];

let running = true;
(async () => { 
    while (running) {
        for (const selector of selectors) {
            findAndClickBySelector(selector);
            const elem = document.querySelector(selector + "> div");
            if (elem?.innerText === "Mostrar resumo") {
                window.frameElement?.remove();
                running = false;
            }
        }
        await delay(800);
    }
})();