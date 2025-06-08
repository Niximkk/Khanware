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
const feedbackSelectors = {
    incorrect: `[data-testid="exercise-feedback-popover-incorrect"]`,
    unanswered: `[data-testid="exercise-feedback-popover-unanswered"]`
};

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

function findRetryButton() {
    return Array.from(document.querySelectorAll("button, div"))
        .find(el => el.textContent?.trim() === retryButtonText);
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
                sendToast("⏭ Pulando questão por resposta errada.", 2000);
                findAndClickBySelector(skipSelector);
                await waitAndClickConfirmButton();
                skippedByAbsence = false;
                continue;
            }

            if (document.querySelector(feedbackSelectors.unanswered)) {
                sendToast("⏭ Pulando questão não respondida.", 2000);
                findAndClickBySelector(skipSelector);
                await waitAndClickConfirmButton();
                skippedByAbsence = false;
                continue;
            }

            const correctDetected = Array.from(document.querySelectorAll("div.paragraph"))
                .some(el => el.textContent?.trim() === "Resposta correta.");

            const retryButton = findRetryButton();

            if (retryButton) {
                if (skippedByAbsence) {
                    sendToast("🔁 Repetindo tentativa por erro anterior (ausência de resposta correta).", 2000);
                    retryButton.click();
                    skippedByAbsence = false;
                } else {
                    skippedByAbsence = false;
                }
                continue;
            }

            if (!correctDetected) {
                sendToast("⏭ Pulando por ausência de feedback e de resposta correta.", 2000);
                findAndClickBySelector(skipSelector);
                await waitAndClickConfirmButton();
                skippedByAbsence = true;
            } else {
                sendToast("✅ Resposta correta detectada.", 1500);
            }
        }

        await delay(featureConfigs.autoAnswerDelay * 800);
    }
})();
