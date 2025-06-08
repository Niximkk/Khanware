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
            btn.click();
            return true;
        }
        await delay(100);
    }
    return false;
}

function clickButtonByText(buttonText) {
    const btn = Array.from(document.querySelectorAll("button, div"))
        .find(el => el.textContent?.trim() === buttonText);
    if (btn) {
        btn.click();
        return true;
    }
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
                await waitAndClickConfirmSkipButton();
                skippedByAbsence = false;
                continue;
            }

            if (document.querySelector(feedbackSelectors.unanswered)) {
                findAndClickBySelector(skipSelector);
                await waitAndClickConfirmSkipButton();
                skippedByAbsence = false;
                continue;
            }

            const correctDetected = Array.from(document.querySelectorAll("div.paragraph"))
                .some(el => el.textContent?.trim() === "Resposta correta.");

            if (clickButtonByText(retryButtonText)) {
                skippedByAbsence = false;
                await delay(1000);
                continue;
            }

            if (!correctDetected) {
                if (clickButtonByText(startButtonText)) {
                    await delay(1000);
                    continue;
                }
                findAndClickBySelector(skipSelector);
                await waitAndClickConfirmSkipButton();
                skippedByAbsence = true;
            }
        }

        await delay(featureConfigs.autoAnswerDelay * 800);
    }
})();
