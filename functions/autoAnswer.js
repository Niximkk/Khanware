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
    const el = document.querySelector(selector);
    if (el) {
        const evt = new MouseEvent("click", { bubbles: true, cancelable: true });
        el.dispatchEvent(evt);
        return true;
    }
    return false;
}

function clickButtonBySpanText(text) {
    const span = Array.from(document.querySelectorAll("span"))
        .find(el => el.textContent?.trim() === text);
    
    if (span) {
        const button = span.closest("button");
        if (button && !button.disabled) {
            const evt = new MouseEvent("click", { bubbles: true, cancelable: true });
            button.dispatchEvent(evt);
            return true;
        }
    }
    return false;
}

async function waitAndClickConfirmButton(maxWait = 3000) {
    const start = Date.now();
    while (Date.now() - start < maxWait) {
        const span = Array.from(document.querySelectorAll("span"))
            .find(el => el.textContent?.trim() === confirmSkipButtonText);
        if (span) {
            const button = span.closest("button");
            if (button && !button.disabled) {
                const evt = new MouseEvent("click", { bubbles: true, cancelable: true });
                button.dispatchEvent(evt);
                return true;
            }
        }
        await delay(100);
    }
    console.warn("⛔ Botão de confirmação não encontrado.");
    return false;
}

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
                await waitAndClickConfirmButton();
                skippedByAbsence = true;
                continue;
            }


            if (document.querySelector(feedbackSelectors.unanswered)) {
                findAndClickBySelector(skipSelector);
                await waitAndClickConfirmButton();
                skippedByAbsence = true;
                continue;
            }

            const correctDetected = Array.from(document.querySelectorAll("div.paragraph"))
                .some(el => el.textContent?.trim() === "Resposta correta.");


            if (clickButtonBySpanText(retryButtonText)) {
                skippedByAbsence = false;
                await delay(1000);
                continue;
            }


            if (!correctDetected) {
                if (clickButtonBySpanText(startButtonText)) {
                    skippedByAbsence = false;
                    await delay(1000);
                    continue;
                }
                findAndClickBySelector(skipSelector);
                await waitAndClickConfirmButton();
                skippedByAbsence = true;
            } else {
                skippedByAbsence = false;
            }
        }

        await delay(featureConfigs.autoAnswerDelay * 800);
    }
})();
