const baseSelectors = [
    `[data-testid="choice-icon__library-choice-icon"]`,
    `[data-testid="exercise-check-answer"]`,
    `[data-testid="exercise-next-question"]`,
    `._1udzurba`,
    `._awve9b`
];

const skipSelector = `[data-testid="exercise-skip-button"]`;
const confirmSkipButtonText = "Sim, pular";
const retryButtonText = "Tentar novamente";
const startButtonText = "Vamos lá";

const feedbackSelectors = {
    incorrect: `[data-testid="exercise-feedback-popover-incorrect"]`,
    unanswered: `[data-testid="exercise-feedback-popover-unanswered"]`
};

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function findAndClickBySelector(selector) {
    const element = document.querySelector(selector);
    if (element) {
        element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
        element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        return true;
    }
    return false;
}

function clickButtonByText(text) {
    const span = Array.from(document.querySelectorAll("span"))
        .find(el => el.textContent?.trim() === text && el.offsetParent !== null);
    
    if (span) {
        const btn = span.closest("button");
        if (btn) {
            btn.scrollIntoView({ behavior: "instant", block: "center" });
            btn.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
            btn.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
            btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            console.log(`Clicou no botão: ${text}`);
            return true;
        }
    }

    console.log(`Botão "${text}" não encontrado.`);
    return false;
}


async function waitAndClickConfirmSkipButton(maxWait = 3000) {
    const start = Date.now();
    while (Date.now() - start < maxWait) {
        const btn = Array.from(document.querySelectorAll("button, div"))
            .find(el => el.textContent?.trim() === confirmSkipButtonText);
        if (btn) {
            btn.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
            btn.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
            btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            return true;
        }
        await delay(100);
    }
    return false;
}

function repeatIfSkipped() {
    if (skippedByAbsence) {
        const repeatButton = document.querySelector("._ypgawqo"); 
        if (repeatButton) {
            repeatButton.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
            repeatButton.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
            repeatButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            console.log("Pergunta repetida após pulo.");
        } else {
            console.log("Botão de repetir não encontrado.");
        }
    }
}

setInterval(() => {
    console.log("skippedBy.2Absence:", skippedByAbsence);
}, 100);

khanwareDominates = true;
let skippedByAbsence = false;

(async () => {
    while (khanwareDominates) {
        if (features.autoAnswer && features.questionSpoof) {
            const selectorsToCheck = [...baseSelectors];
            if (features.nextRecomendation) selectorsToCheck.push("._hxicrxf");
            if (features.repeatQuestion) selectorsToCheck.push("._ypgawqo");

            for (const q of selectorsToCheck) {
                findAndClickBySelector(q);
            }

            if (document.querySelector(feedbackSelectors.incorrect)) {
                findAndClickBySelector(skipSelector);
                await waitAndClickConfirmSkipButton();
                skippedByAbsence = true;
                continue;
            }

            if (document.querySelector(feedbackSelectors.unanswered)) {
                findAndClickBySelector(skipSelector);
                await waitAndClickConfirmSkipButton();
                skippedByAbsence = true;
                continue;
            }

            const correctDetected = Array.from(document.querySelectorAll("div.paragraph"))
                .some(el => el.textContent?.trim() === "Resposta correta.");

            const retryClicked = clickButtonByText(retryButtonText);
            const startClicked = clickButtonByText(startButtonText);

            if (retryClicked || startClicked) {
                if (!skippedByAbsence) {
                    skippedByAbsence = false;
                    await delay(1000);
                    skippedByAbsence = false;
                    continue;
                    skippedByAbsence = false;
                }
            }

            repeatIfSkipped();

            if (!correctDetected) {
                findAndClickBySelector(skipSelector);
                await waitAndClickConfirmSkipButton();
                skippedByAbsence = true;
            }
        }

        await delay(featureConfigs.autoAnswerDelay * 800);
    }
})();
