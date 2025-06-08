const baseSelectors = [
    `[data-testid="choice-icon__library-choice-icon"]`,
    `[data-testid="exercise-check-answer"]`,
    `[data-testid="exercise-next-question"]`,
    `._1udzurba`,
    `._awve9b`
];

const skipSelector = `[data-testid="exercise-skip-button"]`;
const confirmSkipSelector = `._15f36dw6`;

const feedbackSelectors = {
    incorrect: `[data-testid="exercise-feedback-popover-incorrect"]`,
    unanswered: `[data-testid="exercise-feedback-popover-unanswered"]`,
    correct: `[data-testid="exercise-feedback-popover-correct"]`
};

khanwareDominates = true;

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
                sendToast("⏭ Pulando questão por falha geral", 2000);
                await delay(1000);
                findAndClickBySelector(skipSelector);
                await delay(500);
                findAndClickBySelector(confirmSkipSelector);
            } else if (document.querySelector(feedbackSelectors.unanswered)) {
                sendToast("⏭ Pulando questão por falha geral", 2000);
                await delay(1000);
                findAndClickBySelector(skipSelector);
                await delay(500);
                findAndClickBySelector(confirmSkipSelector);

        }

        await delay(featureConfigs.autoAnswerDelay * 800);
    }
})();
