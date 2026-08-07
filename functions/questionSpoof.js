
const phrases = [ 
    "🔥 Get good, get [**Khanware**](https://github.com/Niximkk/khanware/)!",
    "🤍 Made by [**@im.nix**](https://e-z.bio/sounix).",
    "☄️ By [**Niximkk/khanware**](https://github.com/Niximkk/khanware/).",
    "🌟 Star the project on [GitHub](https://github.com/Niximkk/khanware/)!"
];

const originalFetch = window.fetch;
const correctAnswers = new Map();
const pendingSolves = new Map();
let warnedNoKey = false;
let warnedRateLimit = false;

const toFraction = (d) => { if (d === 0 || d === 1) return String(d); const decimals = (String(d).split('.')[1] || '').length; let num = Math.round(d * Math.pow(10, decimals)), den = Math.pow(10, decimals); const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; }; const div = gcd(Math.abs(num), Math.abs(den)); return den / div === 1 ? String(num / div) : `${num / div}/${den / div}`; };
const getItemId = (body) => { try { const req = JSON.parse(body); return req?.variables?.assessmentItemId || req?.variables?.input?.assessmentItemId || req?.variables?.item?.id || null; } catch (e) { return null; } };
const isWidgetUsed = (widgetKey, questionContent, hints) => {
    const widgetPattern = `☃ ${widgetKey.replace(/\s+/g, ' ')}`;
    
    if (questionContent.includes(widgetPattern)) return true;
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
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'openrouter/free';

const questionContentText = (itemData) => {
    const content = itemData?.question?.content;
    return Array.isArray(content) ? content.join('\n') : String(content ?? '');
};

const condenseWidget = (w) => {
    const type = w?.type || 'unknown';
    const options = w?.options || {};
    const o = {};
    if (type === 'radio') {
        o.choices = (options.choices || []).map(c => (typeof c === 'string' ? c : c.content));
        if (options.multipleSelect) o.multipleSelect = true;
    }
    else if (type === 'dropdown') {
        o.choices = (options.choices || []).map(c => (typeof c === 'string' ? c : c.content));
        if (options.placeholder) o.placeholder = options.placeholder;
    }
    else if (type === 'numeric-input') {
        if (options.answerType) o.answerType = options.answerType;
        if (options.simplify) o.simplify = options.simplify;
    }
    else if (type === 'input-number') {
        if (options.answerType) o.answerType = options.answerType;
        if (options.simplify) o.simplify = options.simplify;
    }
    else if (type === 'expression') {
        if (Array.isArray(options.buttonSets)) o.buttonSets = options.buttonSets;
        if (Array.isArray(options.functions)) o.functions = options.functions;
        if (options.times) o.times = true;
    }
    else if (type === 'grapher') {
        if (options.graph) o.graph = options.graph;
    }
    else if (type === 'interactive-graph') {
        if (options.graph) o.graph = options.graph;
        if (options.snapTo) o.snapTo = options.snapTo;
    }
    else if (type === 'categorizer') {
        if (Array.isArray(options.categories)) o.categories = options.categories;
        if (Array.isArray(options.items)) o.items = options.items;
    }
    else if (type === 'matcher') {
        if (options.left) o.left = options.left;
        if (options.right) o.right = options.right;
    }
    else if (type === 'orderer') {
        if (Array.isArray(options.correctOptions)) o.options = options.correctOptions;
    }
    else if (type === 'sorter') {
        if (options.layout) o.layout = options.layout;
        if (Array.isArray(options.correct)) o.correct = options.correct;
    }
    else if (type === 'number-line') {
        if (options.range) o.range = options.range;
        if (options.tickStep) o.tickStep = options.tickStep;
        if (options.numDivisions) o.numDivisions = options.numDivisions;
    }
    else if (type === 'plotter') {
        if (options.type) o.type = options.type;
        if (Array.isArray(options.categories)) o.categories = options.categories;
        if (Array.isArray(options.labels)) o.labels = options.labels;
        if (options.maxY) o.maxY = options.maxY;
        if (options.scaleY) o.scaleY = options.scaleY;
        if (options.snapsPerLine) o.snapsPerLine = options.snapsPerLine;
        if (options.labelInterval) o.labelInterval = options.labelInterval;
        if (Array.isArray(options.starting)) o.starting = options.starting;
        if (options.picUrl) o.picUrl = options.picUrl;
    }
    else if (type === 'matrix') {
        if (options.matrixBoardSize) o.matrixBoardSize = options.matrixBoardSize;
    }
    else if (type === 'label-image') {
        if (Array.isArray(options.markers)) o.markers = options.markers.map(m => ({ label: m.label, x: m.x, y: m.y }));
        if (Array.isArray(options.choices)) o.choices = options.choices.map(c => (typeof c === 'string' ? c : c.content));
        if (options.imageUrl) o.imageUrl = options.imageUrl;
        if (options.multipleAnswers) o.multipleAnswers = true;
    }
    return { type, options: o };
};

const buildSolvePrompt = (itemData) => {
    const content = questionContentText(itemData);
    const usedWidgets = {};
    for (const [key, w] of Object.entries(itemData?.question?.widgets || {})) {
        if (isWidgetUsed(key, content, itemData?.hints)) usedWidgets[key] = condenseWidget(w);
    }

    return `Solve this Khan Academy Perseus exercise and return ONLY a JSON object in the form {"answers":{...}}.

The question may cover ANY subject (mathematics, science, language arts, history, geography, etc.). Read it in its original language — it can be in Portuguese, Spanish, English or another language — and work out the answer using your own knowledge and reasoning.

Each key of "answers" is a widget key; each value is the ANSWER VALUE for that widget (never the whole Perseus widget object — only the value). A local program will wrap these values into the exact Perseus answer format.

The widgets below DO NOT contain the correct answers — you must SOLVE the question yourself using the QUESTION CONTENT and the widget options (choices, placeholders, etc.).

Answer value format per widget type:

- radio: the 0-based index of the correct choice -> number. If multipleSelect, an array of indices.
- dropdown: the 1-based index of the correct choice -> number.
- numeric-input: the correct number as string or number; use a fraction "a/b" when the answer is not a whole number (e.g. 0.5 -> "1/2").
- input-number: the correct number; use a fraction "a/b" when it is not a whole number.
- expression: the correct expression as a string, e.g. "x^2+2*x".
- grapher: {"type":"<graph type>","coords":[[x1,y1],[x2,y2]],"asymptote":<number or null>}.
- interactive-graph: {"coords":[[x1,y1],...],"graphType":"<graph type>"}.
- categorizer: array of arrays; item i lists the items that belong to category i.
- matcher: {"left":[<left options>],"right":[<right options/indices matched in order>]}.
- orderer: array of the options in the correct order.
- sorter: array of arrays; each inner array is one group of items.
- number-line: the correct position as a number.
- plotter: array of the correct values (one per category/bar).
- matrix: 2D array of the correct cell values.
- table: 2D array of the correct cell values.
- label-image: array of arrays; element i is the list of correct choice indexes for marker i (in the markers' order as they appear in the data).

RULES:
1. Only include widgets listed in the USED WIDGETS section below.
2. Only include a widget if you are confident you solved it; skip the ones you cannot solve (e.g. choices that are only images or audio you cannot read).
3. Work out the answer from the QUESTION CONTENT and the widget data. Never output a guess.
4. Use the ids, indices, values and structures exactly as they appear in the USED WIDGETS data.
5. Return ONLY the JSON object, no markdown, no commentary.

QUESTION CONTENT:
${content}

USED WIDGETS (JSON):
${JSON.stringify(usedWidgets)}`;
};

const buildAnswers = (itemData, aiMap) => {
    const answers = [];
    const widgets = itemData?.question?.widgets || {};
    const content = questionContentText(itemData);

    for (const [key, w] of Object.entries(widgets)) {
        if (!isWidgetUsed(key, content, itemData?.hints)) continue;
        if (!(key in aiMap)) continue;
        const ai = aiMap[key];
        const options = w?.options || {};

        if (w.type === 'radio' && Array.isArray(options.choices)) {
            const choices = options.choices.map((c, i) => ({ ...c, id: c.id || `radio-choice-${i}` }));
            const indices = Array.isArray(ai) ? ai : [ai];
            if (indices.some(i => typeof i !== 'number' || !Number.isInteger(i) || i < 0 || i >= choices.length)) continue;
            const choiceIds = indices.map(i => choices[i].id);
            if (choiceIds.length > 0) {
                answers.push({ type: 'radio', choiceIds, multipleSelect: options.multipleSelect || false, widgetKey: key });
            }
        }
        else if (w.type === 'dropdown' && Array.isArray(options.choices)) {
            const value = Number(ai);
            if (Number.isInteger(value) && value >= 1 && value <= options.choices.length) {
                answers.push({ type: 'dropdown', value, choices: options.choices.map(c => c.content), placeholder: options.placeholder || '', widgetKey: key });
            }
        }
        else if (w.type === 'numeric-input') {
            if (ai === null || ai === undefined || ai === '') continue;
            let val = String(ai);
            const formInfo = options.answers?.find(x => x.answerForms?.length) || options.answers?.[0];
            if (formInfo?.answerForms?.some(f => ['proper', 'improper', 'mixed'].includes(f))) {
                const num = Number(ai);
                if (!Number.isNaN(num)) val = toFraction(num);
            }
            answers.push({ type: 'numeric-input', value: val, simplify: formInfo?.simplify || 'required', widgetKey: key });
        }
        else if (w.type === 'input-number') {
            if (ai === null || ai === undefined || ai === '') continue;
            const num = Number(ai);
            let val = String(ai);
            if (num > 0 && num < 1 && String(ai).includes('.')) val = toFraction(num);
            answers.push({ type: 'input-number', value: val, simplify: options.simplify || 'required', answerType: options.answerType || 'number', widgetKey: key });
        }
        else if (w.type === 'expression') {
            if (ai === null || ai === undefined || ai === '') continue;
            answers.push({ type: 'expression', value: String(ai), buttonSets: Array.isArray(options.buttonSets) ? options.buttonSets : ['basic'], functions: Array.isArray(options.functions) ? options.functions : ['f', 'g', 'h'], times: !!options.times, widgetKey: key });
        }
        else if (w.type === 'grapher') {
            const g = typeof ai === 'object' ? ai : {};
            if (g.type && Array.isArray(g.coords)) {
                answers.push({ type: 'grapher', graphType: g.type, coords: g.coords, asymptote: g.asymptote ?? null, widgetKey: key });
            }
        }
        else if (w.type === 'interactive-graph') {
            const g = typeof ai === 'object' ? ai : {};
            if (Array.isArray(g.coords)) {
                answers.push({ type: 'interactive-graph', coords: g.coords, match: g.match || 'congruent', graphType: g.graphType || g.type, showSides: g.showSides, snapTo: g.snapTo, widgetKey: key });
            }
        }
        else if (w.type === 'categorizer') {
            if (Array.isArray(ai)) {
                answers.push({ type: 'categorizer', values: ai, widgetKey: key });
            }
        }
        else if (w.type === 'matcher') {
            const m = typeof ai === 'object' ? ai : {};
            if (m.left && m.right) {
                answers.push({ type: 'matcher', left: m.left, right: m.right, widgetKey: key });
            }
        }
        else if (w.type === 'orderer') {
            if (Array.isArray(ai)) {
                answers.push({ type: 'orderer', correctOptions: ai, widgetKey: key });
            }
        }
        else if (w.type === 'sorter') {
            if (Array.isArray(ai)) {
                answers.push({ type: 'sorter', correct: ai, layout: options.layout || 'horizontal', padding: options.padding !== undefined ? !!options.padding : true, widgetKey: key });
            }
        }
        else if (w.type === 'number-line') {
            if (ai !== null && ai !== undefined && ai !== '') {
                answers.push({ type: 'number-line', correctX: Number(ai), correctRel: options.correctRel || 'eq', widgetKey: key });
            }
        }
        else if (w.type === 'plotter') {
            if (Array.isArray(ai)) {
                answers.push({ type: 'plotter', correct: ai, plotType: options.type || 'bar', categories: Array.isArray(options.categories) ? options.categories : [], labels: Array.isArray(options.labels) ? options.labels : [], maxY: options.maxY || 24, scaleY: options.scaleY || 1, snapsPerLine: options.snapsPerLine || 1, labelInterval: options.labelInterval || 1, starting: Array.isArray(options.starting) ? options.starting : [], picUrl: options.picUrl ?? null, widgetKey: key });
            }
        }
        else if (w.type === 'matrix') {
            if (Array.isArray(ai)) {
                answers.push({ type: 'matrix', answers: ai, prefix: options.prefix || '', suffix: options.suffix || '', matrixBoardSize: options.matrixBoardSize || [3, 3], cursorPosition: options.cursorPosition || [0, 0], widgetKey: key });
            }
        }
        else if (w.type === 'table') {
            if (Array.isArray(ai)) {
                answers.push({ type: 'table', answers: ai, widgetKey: key });
            }
        }
        else if (w.type === 'label-image') {
            if (Array.isArray(options.markers) && Array.isArray(ai)) {
                const markers = options.markers.map((marker, i) => ({
                    label: marker.label,
                    answers: Array.isArray(ai[i]) ? ai[i] : [],
                    x: marker.x,
                    y: marker.y
                }));
                answers.push({
                    type: 'label-image',
                    markers,
                    choices: Array.isArray(options.choices) ? options.choices : [],
                    imageUrl: options.imageUrl || '',
                    imageWidth: options.imageWidth || 0,
                    imageHeight: options.imageHeight || 0,
                    imageAlt: options.imageAlt || '',
                    multipleAnswers: !!options.multipleAnswers,
                    hideChoicesFromInstructions: !!options.hideChoicesFromInstructions,
                    widgetKey: key
                });
            }
        }
    }
    return answers;
};

const extractAnswers = async (itemData) => {
    const apiKey = featureConfigs?.openRouterKey;
    const model = featureConfigs?.openRouterModel || DEFAULT_MODEL;

    if (!apiKey) {
        sendToast(`🔑 ${t('openrouter_key_missing')}`, 6000, 'top');
        return [];
    }

    const content = questionContentText(itemData);
    const usedCount = Object.keys(itemData?.question?.widgets || {}).filter(key => isWidgetUsed(key, content, itemData?.hints)).length;
    if (usedCount === 0) {
        debug(`🚨 Khanware questionSpoof: ${t('no_used_widgets')} (${Object.keys(itemData?.question?.widgets || {}).length})`);
        return [];
    }

    debug(`🤖 Khanware questionSpoof: ${model} · ${usedCount} ${t('used_widgets')}`);

    const callModel = async (withFormat) => {
        const body = {
            model,
            temperature: 0,
            max_tokens: 4096,
            messages: [
                { role: 'system', content: 'You are an expert at solving Khan Academy Perseus exercises in any subject (mathematics, science, language arts, history, etc.). Read each question in its original language and work out the answer through reasoning. You only output valid JSON, nothing else.' },
                { role: 'user', content: buildSolvePrompt(itemData) }
            ]
        };
        if (withFormat) body.response_format = { type: 'json_object' };

        return originalFetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Khanware'
            },
            body: JSON.stringify(body)
        });
    };

    let response;
    try {
        response = await callModel(true);
        if (response.status === 400) response = await callModel(false);
    } catch (e) {
        debug(`🚨 Khanware questionSpoof: OpenRouter request falhou\n${e}`);
        return [];
    }

    if (response.status === 429) {
        if (!warnedRateLimit) {
            warnedRateLimit = true;
            sendToast(`⚠️ ${t('openrouter_rate_limited')}`, 6000, 'top');
        }
        return [];
    }

    if (!response.ok) {
        debug(`🚨 Khanware questionSpoof: OpenRouter status ${response.status}`);
        return [];
    }

    let text = '';
    try { text = (await response.json())?.choices?.[0]?.message?.content || ''; }
    catch (e) { debug(`🚨 Khanware questionSpoof: OpenRouter response\n${e}`); }

    let aiMap = {};
    try {
        const parsed = JSON.parse(text);
        aiMap = parsed.answers && typeof parsed.answers === 'object' ? parsed.answers : {};
    } catch (e) {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
            try {
                const parsed = JSON.parse(match[0]);
                aiMap = parsed.answers && typeof parsed.answers === 'object' ? parsed.answers : {};
            } catch {}
        }
    }

    return buildAnswers(itemData, aiMap);
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

    answers.filter(a => a.type === 'numeric-input').forEach(a => content.push({ currentValue: a.value }));
    
    bodyObj.variables.input.attemptContent = JSON.stringify([content, []]);
    bodyObj.variables.input.userInput = JSON.stringify(userInput);
    if (state) bodyObj.variables.input.attemptState = JSON.stringify(state);
    
    return bodyObj;
};
const modifyItemData = (itemData) => {
    if (itemData.question.content?.[0] === itemData.question.content[0].toUpperCase()) {
        itemData.answerArea = { 
            calculator: false, 
            chi2Table: false, 
            periodicTable: false, 
            tTable: false, 
            zTable: false 
        };
        
        itemData.question.content = phrases[Math.floor(Math.random() * phrases.length)] + 
            `\n\n**${t('spoof_question')}**` + 
            `[[☃ radio 1]]` + 
            `\n\n${t('spoof_donate')}`;
        
        itemData.question.widgets = {
            "radio 1": {
                type: "radio", 
                alignment: "default", 
                static: false, 
                graded: true,
                options: {
                    choices: [
                        { 
                            content: t('spoof_choice_correct'), 
                            correct: true, 
                            id: "correct-choice" 
                        },
                        { 
                            content: t('spoof_choice_incorrect'), 
                            correct: false, 
                            id: "incorrect-choice" 
                        }
                    ],
                    randomize: false, 
                    multipleSelect: false, 
                    displayCount: null, 
                    deselectEnabled: false
                },
                version: { major: 1, minor: 0 }
            }
        };
        
        return true;
    }
    return false;
};

const spoofAttemptResponse = async (res) => {
    if (!res || !res.ok) return res;
    const clone = res.clone();
    try {
        const data = await clone.json();
        const itemData = data?.data?.attemptProblem?.result?.itemData;
        if (itemData) {
            const itemDataObj = JSON.parse(itemData);
            if (modifyItemData(itemDataObj)) {
                data.data.attemptProblem.result.itemData = JSON.stringify(itemDataObj);
                return new Response(JSON.stringify(data), {
                    status: res.status,
                    statusText: res.statusText,
                    headers: res.headers
                });
            }
        }
    } catch (e) { debug(`🚨 Khanware questionSpoof (attemptProblem response spoof): ${e}`); }
    return res;
};

window.fetch = async function(input, init) {
    const url = input instanceof Request ? input.url : input;
    let body = input instanceof Request ? await input.clone().text() : init?.body;
    
    if (features.questionSpoof && url.includes('getAssessmentItem') && body) {
        const res = await originalFetch.apply(this, arguments);
        const clone = res.clone();
        try {
            const data = await clone.json();
            let item = null;
            
            if (data?.data) { for (const key in data.data) { if (data.data[key]?.item) { item = data.data[key].item; break; } } }
            
            if (!item?.itemDataAnswerless) {
                debug('🛠️ Khanware questionSpoof: getAssessmentItem sem itemDataAnswerless');
                return res;
            }
            
            const itemId = getItemId(body) || item.id || item.assessmentItemId || item.itemId || null;
            debug(`🛠️ Khanware questionSpoof: getAssessmentItem itemId=${itemId} | key=${!!featureConfigs?.openRouterKey}`);
            
            let itemData = JSON.parse(item.itemDataAnswerless);
            
            if (itemId && featureConfigs?.openRouterKey && !correctAnswers.has(itemId) && !pendingSolves.has(itemId)) {
                debug(`🤖 Khanware questionSpoof: resolvendo item ${itemId}...`);
                sendToast(`🔍 ${t('searching_answers')}`, 1500);
                const solvePromise = extractAnswers(JSON.parse(item.itemDataAnswerless))
                    .then((answers) => {
                        debug(`🤖 Khanware questionSpoof: item ${itemId} resolvido (${answers.length} widgets)`);
                        if (answers.length > 0) {
                            correctAnswers.set(itemId, answers);
                            sendToast(`🤖 ${t('ai_solved')} ${answers.length}`, 2000);
                        }
                        return answers;
                    })
                    .catch((e) => { debug(`🚨 Khanware questionSpoof (AI solve): ${e}`); return []; })
                    .finally(() => { pendingSolves.delete(itemId); });
                pendingSolves.set(itemId, solvePromise);
            }
            
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
                
                sendToast(`🔓 ${t('exploited_assignment')}`, 750);
                return new Response(JSON.stringify(modified), { 
                    status: res.status, 
                    statusText: res.statusText, 
                    headers: res.headers 
                });
            }
        } catch (e) { debug(`🚨 Khanware questionSpoof (getAssessmentItem): ${e}`); }
        return res;
    }
    
    if (features.questionSpoof && body?.includes('"operationName":"attemptProblem"')) {
        try {
            let bodyObj = JSON.parse(body);
            const itemId = bodyObj.variables?.input?.assessmentItemId;
            debug(`🛠️ Khanware questionSpoof: attemptProblem itemId=${itemId}`);
            
            if (!featureConfigs?.openRouterKey) {
                if (!warnedNoKey) { warnedNoKey = true; sendToast(`🔑 ${t('openrouter_key_missing')}`, 5000, 'top'); }
                return originalFetch.apply(this, arguments);
            }
            
            if (correctAnswers.has(itemId)) {
                bodyObj = applyAnswers(bodyObj, correctAnswers.get(itemId));
                body = JSON.stringify(bodyObj);
                if (input instanceof Request) { input = new Request(url, { method: 'POST', headers: input.headers, body }); }
                else { init.body = body; }
                return spoofAttemptResponse(await originalFetch.apply(this, [input, init]));
            }
            
            if (pendingSolves.has(itemId)) {
                try {
                    const answers = await pendingSolves.get(itemId);
                    if (answers && answers.length > 0) {
                        bodyObj = applyAnswers(bodyObj, answers);
                        body = JSON.stringify(bodyObj);
                        if (input instanceof Request) { input = new Request(url, { method: 'POST', headers: input.headers, body }); }
                        else { init.body = body; }
                    }
                } catch (e) { debug(`🚨 Khanware questionSpoof (attemptProblem pending): ${e}`); }
            }
            
            return spoofAttemptResponse(await originalFetch.apply(this, [input, init]));
        } catch (e) { debug(`🚨 Khanware questionSpoof (attemptProblem): ${e}`); }
    }
    
    return originalFetch.apply(this, arguments);
};