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

function clickButtonByText(text) {
    const btn = Array.from(document.querySelectorAll("button, div"))
        .find(el => el.textContent?.trim() === text && !el.disabled && el.offsetParent !== null);

    if (btn) {
        const evOpts = { bubbles: true, cancelable: true, composed: true };

        btn.dispatchEvent(new PointerEvent("pointerdown", evOpts));
        btn.dispatchEvent(new PointerEvent("pointerup", evOpts));
        btn.dispatchEvent(new MouseEvent("mousedown", evOpts));
        btn.dispatchEvent(new MouseEvent("mouseup", evOpts));
        btn.dispatchEvent(new MouseEvent("click", evOpts));

        console.log(`Clicking "${text}" using pointer + mouse events`);
        return true;
    }

    return false;
}



setInterval(() => {
    console.log("skippedByAbsence:", skippedByAbsence);
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

            const retryClicked = clickButtonByText(retryButtonText);
            const startClicked = clickButtonByText(startButtonText);

            if (retryClicked) {
                await delay(1000);
                continue;
            }

            if (startClicked) {
                skippedByAbsence = false; 
                await delay(1000);
                continue;
            }

   


            if (document.querySelector(feedbackSelectors.incorrect) || document.querySelector(feedbackSelectors.unanswered)) {
                findAndClickBySelector(skipSelector);
                await waitAndClickConfirmSkipButton();
                skippedByAbsence = true;
                continue;
            }

            const correctDetected = Array.from(document.querySelectorAll("div.paragraph"))
                .some(el => el.textContent?.trim() === "Resposta correta.");

            if (!correctDetected) {
                findAndClickBySelector(skipSelector);
                await waitAndClickConfirmSkipButton();
                skippedByAbsence = true;
            }
        }

        await delay(featureConfigs.autoAnswerDelay * 800);
    }
})();
