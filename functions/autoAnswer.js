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

function findAndClickBySelector(selector) {
    const el = document.querySelector(selector);
    if (el) {
        const event = new MouseEvent("click", { bubbles: true, cancelable: true });
        el.dispatchEvent(event);
        return true;
    }
    return false;
}

function findAndClickByText(text) {
    const el = Array.from(document.querySelectorAll("*"))
        .find(e => e.textContent?.trim() === text);
    if (!el) return false;

    const clickable = el.closest("button, div");
    if (!clickable) return false;

    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    clickable.dispatchEvent(event);
    return true;
}

async function waitAndClickConfirmButton(maxWait = 3000) {
    const start = Date.now();
    while (Date.now() - start < maxWait) {
        if (findAndClickByText(confirmSkipButtonText)) {
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

            if (document.querySelector(feedbackSelectors.incorrect)) {
                sendToast("⏭ Pulando questão por falta de 'Resposta correta.'", 2000);
                findAndClickBySelector(skipSelector);
                await waitAndClickConfirmButton();
                continue;
            }

            if (document.querySelector(feedbackSelectors.unanswered)) {
                sendToast("⏭ Pulando questão por falta de 'Resposta correta.'", 2000);
                findAndClickBySelector(skipSelector);
                await waitAndClickConfirmButton();
                continue;
            }

            const correctDetected = Array.from(document.querySelectorAll("div.paragraph"))
                .some(el => el.textContent?.trim() === "Resposta correta.");

            if (findAndClickByText(retryButtonText)) {
                await delay(1000);
                continue;
            }

            if (!correctDetected) {
                if (findAndClickByText(startButtonText)) {
                    await delay(1000);
                    continue;
                }
                findAndClickBySelector(skipSelector);
                await waitAndClickConfirmButton();
            }
        }

        await delay(featureConfigs.autoAnswerDelay * 800);
    }
})();
