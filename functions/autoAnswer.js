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



if (document.querySelector(feedbackSelectors.incorrect)) {
    feedback = "incorrect";
    sendToast("⏭ Pulando questão por falha geral", 2000);
    findAndClickBySelector(skipSelector);
    const clicked = await waitAndClickConfirmButton();
    if (!clicked) {
      sendToast("⛔ Confirmação de pulo não detectada, não pulando.", 3000);

    }
} else if (document.querySelector(feedbackSelectors.unanswered)) {
    feedback = "unanswered";
    sendToast("⏭ Pulando questão por falha geral", 2000);
    findAndClickBySelector(skipSelector);
    const clicked = await waitAndClickConfirmButton();
    if (!clicked) {
      sendToast("⛔ Confirmação de pulo não detectada, não pulando.", 3000);
    }
}
        await delay(featureConfigs.autoAnswerDelay * 800);
    }
})();
