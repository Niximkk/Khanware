const baseSelectors = [
    `[data-testid="choice-icon__library-choice-icon"]`,
    `[data-testid="exercise-check-answer"]`,
    `[data-testid="exercise-next-question"]`,
    `._1udzurba`,
    `._awve9b`
];

const skipSelector = `[data-testid="exercise-skip-button"]`;
const confirmSkipButtonText = "Sim, pular";
const feedbackSelectors = {
    incorrect: `[data-testid="exercise-feedback-popover-incorrect"]`,
    unanswered: `[data-testid="exercise-feedback-popover-unanswered"]`,
    correct: `[data-testid="exercise-feedback-popover-correct"]`
};

khanwareDominates = true;
async function waitAndClickConfirmButton(maxWait = 3000) {
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
    console.warn("⛔ Botão de confirmação não encontrado.");
    return false;
}

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

            let feedback = null;

            if (document.querySelector(feedbackSelectors.incorrect)) {
                feedback = "incorrect";
                sendToast("❌ Resposta errada. Pulando...", 2000);
                await delay(1000);
                findAndClickBySelector(skipSelector);
                await waitAndClickConfirmButton();
            } else if (document.querySelector(feedbackSelectors.unanswered)) {
                feedback = "unanswered";
                sendToast("⚠️ Pergunta não respondida. Pulando...", 2000);
                await delay(1000);
                findAndClickBySelector(skipSelector);
                await waitAndClickConfirmButton();
            } else if (document.querySelector(feedbackSelectors.correct)) {
                feedback = "correct";
                sendToast("✅ Resposta correta detectada.", 1500);
            }

        }

        await delay(featureConfigs.autoAnswerDelay * 800);
    }
})();
